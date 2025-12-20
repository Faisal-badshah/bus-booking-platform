-- Fix routes table to ensure base_price_per_segment is never NULL
ALTER TABLE routes 
ALTER COLUMN base_price_per_segment SET DEFAULT 50,
ALTER COLUMN base_price_per_segment SET NOT NULL;

-- Update existing NULL values
UPDATE routes 
SET base_price_per_segment = 50 
WHERE base_price_per_segment IS NULL;

-- Fix begin_multi_seat_booking function for safe fare calculation
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
  v_stops TEXT[];
  v_prices_per_segment INTEGER[];
  v_base_price INTEGER;
  v_fare NUMERIC := 0;
  v_segment_price INTEGER;
  v_segment_idx INTEGER;
  v_total_fare NUMERIC := 0;
BEGIN
  -- Get route info for fare calculation
  SELECT route_id INTO v_route_id FROM trips WHERE id = p_trip_id;
  
  IF v_route_id IS NULL THEN
    RAISE EXCEPTION 'Trip not found';
  END IF;

  SELECT stops, prices_per_segment, COALESCE(base_price_per_segment, 50) 
  INTO v_stops, v_prices_per_segment, v_base_price
  FROM routes WHERE id = v_route_id;

  -- Calculate fare per seat if not provided
  IF p_fare_per_seat IS NULL OR p_fare_per_seat = 0 THEN
    v_fare := 0;
    FOR v_segment_idx IN p_from_index..(p_to_index - 1) LOOP
      -- Use prices_per_segment if available and valid, otherwise use base_price
      IF v_prices_per_segment IS NOT NULL 
         AND array_length(v_prices_per_segment, 1) >= (v_segment_idx + 1) THEN
        v_segment_price := v_prices_per_segment[v_segment_idx + 1];
      ELSE
        v_segment_price := v_base_price;
      END IF;
      v_fare := v_fare + COALESCE(v_segment_price, v_base_price);
    END LOOP;
    
    -- Ensure fare is never NULL or zero
    IF v_fare IS NULL OR v_fare = 0 THEN
      v_fare := v_base_price * (p_to_index - p_from_index);
    END IF;
  ELSE
    v_fare := p_fare_per_seat;
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
  
  -- Return all inserted bookings as JSONB array with total fare
  RETURN jsonb_build_object(
    'bookings', to_jsonb(v_result),
    'total_fare', v_total_fare
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$function$;