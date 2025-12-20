-- Step 1: Create default routes for existing trips
-- First, create a temporary route for each unique from_city -> to_city combination
INSERT INTO public.routes (name, stops, base_price_per_segment)
SELECT DISTINCT 
  CONCAT(t.from_city, ' → ', t.to_city) as name,
  ARRAY[t.from_city, t.to_city] as stops,
  50 as base_price_per_segment
FROM public.trips t
WHERE t.route_id IS NULL
ON CONFLICT DO NOTHING;

-- Step 2: Update trips to reference the created routes
UPDATE public.trips t
SET route_id = r.id
FROM public.routes r
WHERE t.route_id IS NULL
  AND r.name = CONCAT(t.from_city, ' → ', t.to_city);

-- Step 3: Make route_id NOT NULL
ALTER TABLE public.trips 
  ALTER COLUMN route_id SET NOT NULL;

-- Step 4: Add booking status and payment fields
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS ticket_url TEXT;

-- Update existing bookings to have confirmed status
UPDATE public.bookings 
SET status = 'confirmed' 
WHERE status IS NULL OR status = '';

-- Step 5: Create storage bucket for tickets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('tickets', 'tickets', false, 5242880, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies for tickets bucket
CREATE POLICY "Users can view own tickets"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tickets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Service role can upload tickets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tickets');

CREATE POLICY "Service role can update tickets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'tickets');

-- Step 6: Performance indexes
CREATE INDEX IF NOT EXISTS idx_bookings_trip_seat ON public.bookings(trip_id, seat_number);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_trips_route_time ON public.trips(route_id, departure_time);
CREATE INDEX IF NOT EXISTS idx_trips_date_status ON public.trips(trip_date, status);
CREATE INDEX IF NOT EXISTS idx_routes_name ON public.routes(name);

-- Step 7: Create function to check booking expiration
CREATE OR REPLACE FUNCTION public.is_booking_expired(booking_row public.bookings)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    booking_row.status = 'pending_payment' 
    AND booking_row.created_at < (NOW() - INTERVAL '10 minutes')
$$;