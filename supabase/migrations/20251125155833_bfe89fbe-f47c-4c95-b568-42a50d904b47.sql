-- Update begin_multi_seat_booking to explicitly exclude expired bookings
DROP FUNCTION IF EXISTS begin_multi_seat_booking(uuid, uuid, integer[], text, text, timestamp with time zone, jsonb[]);

CREATE OR REPLACE FUNCTION begin_multi_seat_booking(
  p_user_id uuid,
  p_trip_id uuid,
  p_seat_numbers integer[],
  p_from_stop text,
  p_to_stop text,
  p_booking_date timestamp with time zone,
  p_passengers jsonb[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_route_id uuid;
  v_stops text[];
  v_from_index integer;
  v_to_index integer;
  v_seat integer;
  v_conflict_seat integer := 0;
  v_booking_group_id uuid;
  v_booking_id uuid;
  v_passenger jsonb;
  v_fare numeric;
  v_prices_per_segment integer[];
  v_base_price integer;
  v_segment_price integer;
  v_idx integer;
  v_total_fare numeric := 0;
  v_result jsonb;
  v_booking_ids uuid[] := ARRAY[]::uuid[];
  v_ten_minutes_ago timestamp with time zone;
BEGIN
  -- Calculate 10 minutes ago for expiry check
  v_ten_minutes_ago := now() - interval '10 minutes';

  -- Get route info
  SELECT route_id INTO v_route_id FROM trips WHERE id = p_trip_id;
  IF v_route_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'trip_not_found');
  END IF;

  SELECT stops, prices_per_segment, base_price_per_segment 
  INTO v_stops, v_prices_per_segment, v_base_price
  FROM routes WHERE id = v_route_id;

  -- Find indices
  v_from_index := array_position(v_stops, p_from_stop);
  v_to_index := array_position(v_stops, p_to_stop);

  IF v_from_index IS NULL OR v_to_index IS NULL OR v_from_index >= v_to_index THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_stops');
  END IF;

  -- Calculate fare
  FOR v_idx IN v_from_index..(v_to_index - 1) LOOP
    IF v_prices_per_segment IS NOT NULL AND array_length(v_prices_per_segment, 1) >= v_idx THEN
      v_segment_price := v_prices_per_segment[v_idx];
    ELSE
      v_segment_price := v_base_price;
    END IF;
    v_fare := COALESCE(v_fare, 0) + v_segment_price;
  END LOOP;

  -- Generate booking group ID
  v_booking_group_id := gen_random_uuid();

  -- Check and insert for each seat
  FOREACH v_seat IN ARRAY p_seat_numbers LOOP
    -- Lock and check for conflicts, only considering active bookings
    SELECT seat_number INTO v_conflict_seat
    FROM bookings
    WHERE trip_id = p_trip_id
      AND booking_date = p_booking_date
      AND seat_number = v_seat
      AND from_index < v_to_index
      AND to_index > v_from_index
      AND status NOT IN ('expired', 'cancelled')
      AND (
        status IN ('confirmed', 'cancellation_requested')
        OR (status = 'pending_payment' AND created_at >= v_ten_minutes_ago)
      )
    FOR UPDATE;

    IF v_conflict_seat IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'seat_taken',
        'conflicting_seat', v_conflict_seat,
        'message', 'seat_taken: Seat ' || v_conflict_seat || ' is already booked for this segment'
      );
    END IF;

    -- Get corresponding passenger
    v_passenger := p_passengers[array_position(p_seat_numbers, v_seat)];

    -- Insert booking
    INSERT INTO bookings (
      user_id,
      trip_id,
      seat_number,
      from_index,
      to_index,
      booking_date,
      total_amount,
      status,
      passenger_name,
      passenger_email,
      passenger_phone,
      booking_group_id,
      cancellation_requested
    ) VALUES (
      p_user_id,
      p_trip_id,
      v_seat,
      v_from_index - 1,
      v_to_index - 1,
      p_booking_date,
      v_fare,
      'pending_payment',
      v_passenger->>'passenger_name',
      v_passenger->>'passenger_email',
      v_passenger->>'passenger_phone',
      v_booking_group_id,
      false
    )
    RETURNING id INTO v_booking_id;

    v_booking_ids := array_append(v_booking_ids, v_booking_id);
    v_total_fare := v_total_fare + v_fare;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'booking_ids', v_booking_ids,
    'booking_group_id', v_booking_group_id,
    'total_fare', v_total_fare
  );
END;
$$;