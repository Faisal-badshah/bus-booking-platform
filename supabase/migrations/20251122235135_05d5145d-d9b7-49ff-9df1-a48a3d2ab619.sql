-- =====================================================
-- MIGRATION: Multi-seat booking + Cancellation + Monitoring
-- =====================================================

-- 1. Add booking_group_id and cancellation fields to bookings
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS booking_group_id UUID,
ADD COLUMN IF NOT EXISTS cancellation_requested BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC;

-- Create index for booking groups
CREATE INDEX IF NOT EXISTS idx_bookings_group_id ON public.bookings(booking_group_id);

-- 2. Create booking_logs table for monitoring
CREATE TABLE IF NOT EXISTS public.booking_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_group_id UUID,
  booking_id UUID,
  event_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_logs_group_id ON public.booking_logs(booking_group_id);
CREATE INDEX IF NOT EXISTS idx_booking_logs_event_type ON public.booking_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_booking_logs_created_at ON public.booking_logs(created_at DESC);

-- Enable RLS on booking_logs
ALTER TABLE public.booking_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view all logs" ON public.booking_logs
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert logs (functions will use service role)
CREATE POLICY "System can insert logs" ON public.booking_logs
FOR INSERT WITH CHECK (true);

-- 3. Create payments table if not exists (for idempotency tracking)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_reference TEXT UNIQUE NOT NULL,
  booking_group_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_reference ON public.payment_transactions(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_group_id ON public.payment_transactions(booking_group_id);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all payment transactions" ON public.payment_transactions
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Create staff_roles table for driver verification
CREATE TABLE IF NOT EXISTS public.staff_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('driver', 'conductor', 'manager')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view own roles" ON public.staff_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage staff roles" ON public.staff_roles
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Create boarding_logs table for driver app
CREATE TABLE IF NOT EXISTS public.boarding_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id),
  trip_id UUID NOT NULL,
  verified_by UUID REFERENCES auth.users(id),
  verification_method TEXT NOT NULL CHECK (verification_method IN ('qr_online', 'qr_offline', 'manual')),
  boarded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_boarding_logs_booking ON public.boarding_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_boarding_logs_trip ON public.boarding_logs(trip_id);

ALTER TABLE public.boarding_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can insert boarding logs" ON public.boarding_logs
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.staff_roles
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Staff and admins can view boarding logs" ON public.boarding_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.staff_roles
    WHERE user_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

-- 6. Update bookings status check to include new statuses
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('confirmed', 'cancelled', 'cancellation_requested', 'pending_payment', 'expired'));