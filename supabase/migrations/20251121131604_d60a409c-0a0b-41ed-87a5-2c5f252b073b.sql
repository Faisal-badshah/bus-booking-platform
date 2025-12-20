-- Drop the old validate_booking_seats trigger FIRST (before any data changes)
DROP TRIGGER IF EXISTS check_booking_seats ON public.bookings;
DROP FUNCTION IF EXISTS public.validate_booking_seats();

-- Create routes table
CREATE TABLE public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  stops TEXT[] NOT NULL,
  base_price_per_segment INTEGER DEFAULT 0,
  prices_per_segment INTEGER[] DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on routes
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

-- RLS policies for routes
CREATE POLICY "Anyone can view routes"
  ON public.routes FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert routes"
  ON public.routes FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update routes"
  ON public.routes FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete routes"
  ON public.routes FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add route_id to trips table
ALTER TABLE public.trips
ADD COLUMN route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL;

-- Modify bookings table structure
-- Add new columns as nullable first
ALTER TABLE public.bookings
ADD COLUMN seat_number INTEGER,
ADD COLUMN from_index INTEGER,
ADD COLUMN to_index INTEGER;

-- For existing bookings, extract numeric part from seat_numbers array (e.g., "S22" -> 22)
-- Use regex to extract digits only
UPDATE public.bookings
SET 
  seat_number = CAST(regexp_replace(seat_numbers[1], '[^0-9]', '', 'g') AS INTEGER),
  from_index = 0,
  to_index = 1
WHERE seat_number IS NULL AND seat_numbers IS NOT NULL AND array_length(seat_numbers, 1) > 0;

-- Now make the new columns NOT NULL (after migration)
ALTER TABLE public.bookings
ALTER COLUMN seat_number SET NOT NULL,
ALTER COLUMN from_index SET NOT NULL,
ALTER COLUMN to_index SET NOT NULL;

-- Create index for better performance on bookings queries
CREATE INDEX idx_bookings_trip_seat ON public.bookings(trip_id, seat_number);
CREATE INDEX idx_trips_route ON public.trips(route_id);