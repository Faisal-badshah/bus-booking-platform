-- Create live_locations table for real-time GPS tracking
CREATE TABLE public.live_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  speed double precision DEFAULT 0,
  heading -- Fix RPC function fare calculation fallback and clean corrupted data

-- 1. Fix existing routes with base_price_per_segment = 0
UPDATE routes 
SET base_price_per_segment = 50 
WHERE base_price_per_segment = 0;

-- 2. Update RPC function with proper fallback at line 54
CREATE OR REPLACE FUNCTION public.begin_multi_seat_booking(
  p_trip_id uuid, 
  p_user_id uuid, 
  p_seat_numbers integer[], 
  p_from_index integer, 
  p_to_index integer, 
  p_passengers jsonb, 
  p_fare_per_seat numeric, 
  p_booking_group_id uuid, 
  p_booking_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_seat_num INTEGER;
  v_conflict BOOLEAN;
  v_passenger JSONB;
  v_result JSONB[] := ARRAY[]::JSONB[];
  v_booking_record JSONB;
  v_idx INTEGER := 0;
  v_route_id UUID;
  v_prices_per_segment INTEGER[];
  v_base_price INTEGER;
  v_fare NUMERIC := 0;
  v_segment_idx INTEGER;
  v_total_fare NUMERIC := 0;
BEGIN
  -- Get route info for server-side fare calculation
  SELECT route_id INTO v_route_id FROM trips WHERE id = p_trip_id;
  
  IF v_route_id IS NULL THEN
    RAISE EXCEPTION 'Trip not found';
  END IF;

  SELECT prices_per_segment, base_price_per_segment
  INTO v_prices_per_segment, v_base_price
  FROM routes WHERE id = v_route_id;

  -- ALWAYS calculate fare server-side (ignore p_fare_per_seat)
  -- Method A, Logic 2: Fare = Sum of (Price per segment) for all segments
  v_fare := 0;
  
  FOR v_segment_idx IN p_from_index..(p_to_index - 1) LOOP
    -- Check if prices_per_segment exists and has the required index
    IF v_prices_per_segment IS NOT NULL 
       AND array_length(v_prices_per_segment, 1) > v_segment_idx THEN
      -- Use segment-specific price with proper fallback (FIXED: Added COALESCE for v_base_price)
      v_fare := v_fare + COALESCE(v_prices_per_segment[v_segment_idx + 1], COALESCE(v_base_price, 50));
    ELSE
      -- Fallback to base price
      v_fare := v_fare + COALESCE(v_base_price, 50);
    END IF;
  END LOOP;
  
  -- Safety check: ensure fare is never NULL, NaN, or zero
  IF v_fare IS NULL OR v_fare <= 0 THEN
    v_fare := COALESCE(v_base_price, 50) * (p_to_index - p_from_index);
  END IF;

  -- Check each seat for conflicts with SELECT FOR UPDATE lock
  FOREACH v_seat_num IN ARRAY p_seat_numbers
  LOOP
    SELECT EXISTS(
      SELECT 1 
      FROM bookings 
      WHERE trip_id = p_trip_id 
        AND seat_number = v_seat_num
        AND booking_date = p_booking_date
        AND status IN ('confirmed', 'pending_payment', 'cancellation_requested')
        AND from_index < p_to_index 
        AND to_index > p_from_index
      FOR UPDATE
    ) INTO v_conflict;
    
    IF v_conflict THEN
      RAISE EXCEPTION 'seat_taken: Seat % is already booked for this segment', v_seat_num;
    END IF;
  END LOOP;
  
  -- All seats available, insert all bookings
  FOREACH v_seat_num IN ARRAY p_seat_numbers
  LOOP
    v_passenger := (p_passengers->v_idx);
    
    INSERT INTO bookings (
      trip_id,
      user_id,
      seat_number,
      from_index,
      to_index,
      passenger_name,
      passenger_phone,
      passenger_email,
      total_amount,
      status,
      booking_date,
      booking_group_id,
      seat_numbers,
      cancellation_requested
    ) VALUES (
      p_trip_id,
      p_user_id,
      v_seat_num,
      p_from_index,
      p_to_index,
      v_passenger->>'passenger_name',
      v_passenger->>'passenger_phone',
      v_passenger->>'passenger_email',
      v_fare,
      'pending_payment',
      p_booking_date,
      p_booking_group_id,
      ARRAY['S' || v_seat_num::TEXT],
      false
    )
    RETURNING jsonb_build_object(
      'id', id,
      'trip_id', trip_id,
      'seat_number', seat_number,
      'passenger_name', passenger_name,
      'status', status,
      'total_amount', total_amount
    ) INTO v_booking_record;
    
    v_result := array_append(v_result, v_booking_record);
    v_total_fare := v_total_fare + v_fare;
    v_idx := v_idx + 1;
  END LOOP;
  
  -- Return all inserted bookings with correct total fare
  RETURN jsonb_build_object(
    'bookings', to_jsonb(v_result),
    'total_fare', v_total_fare,
    'fare_per_seat', v_fare
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$function$;double precision DEFAULT 0,
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