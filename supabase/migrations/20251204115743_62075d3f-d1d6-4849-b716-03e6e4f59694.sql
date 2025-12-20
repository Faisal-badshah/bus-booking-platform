-- Create live_locations table for real-time GPS tracking
CREATE TABLE public.live_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  speed double precision DEFAULT 0,
  heading double precision DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(trip_id) -- Only keep one record per trip
);

-- Create tracking_subscription table for trial management
CREATE TABLE public.tracking_subscription (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_started_at timestamptz DEFAULT now(),
  trial_ends_at timestamptz DEFAULT (now() + interval '10 days'),
  is_trial_active boolean DEFAULT true,
  tracking_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.live_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_subscription ENABLE ROW LEVEL SECURITY;

-- Enable realtime for live_locations
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_locations;

-- RLS Policies for live_locations
-- Staff can insert/update locations (validated in edge function)
CREATE POLICY "Staff can upsert locations"
ON public.live_locations
FOR ALL
USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Users can read locations for trips they have bookings on
CREATE POLICY "Users can read locations for their booked trips"
ON public.live_locations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.trip_id = live_locations.trip_id
    AND bookings.user_id = auth.uid()
    AND bookings.status IN ('confirmed', 'cancellation_requested')
  )
);

-- Admins can do everything
CREATE POLICY "Admins can manage all locations"
ON public.live_locations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for tracking_subscription
CREATE POLICY "Anyone can view tracking subscription"
ON public.tracking_subscription
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage tracking subscription"
ON public.tracking_subscription
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default tracking subscription row
INSERT INTO public.tracking_subscription (id) VALUES (gen_random_uuid());