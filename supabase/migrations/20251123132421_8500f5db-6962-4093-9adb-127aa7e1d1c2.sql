-- Create atomic multi-seat booking function with proper transaction handling
CREATE OR REPLACE FUNCTION public.begin_multi_seat_booking(
  p_trip_id UUID,
  p_user_id UUID,
  p_seat_numbers INTEGER[],
  p_from_index INTEGER,
  p_to_index INTEGER,
  p_passengers JSONB,
  p_fare_per_seat NUMERIC,
  p_booking_group_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seat_num INTEGER;
  v_conflict BOOLEAN;
  v_passenger JSONB;
  v_result JSONB[] := ARRAY[]::JSONB[];
  v_booking_id UUID;
  v_idx INTEGER := 0;
BEGIN
  -- BEGIN TRANSACTION (implicit in function)
  
  -- Check each seat for conflicts with SELECT FOR UPDATE lock
  FOREACH v_seat_num IN ARRAY p_seat_numbers
  LOOP
    SELECT EXISTS(
      SELECT 1 
      FROM bookings 
      WHERE trip_id = p_trip_id 
        AND seat_number = v_seat_num
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
      seat_numbers
    ) VALUES (
      p_trip_id,
      p_user_id,
      v_seat_num,
      p_from_index,
      p_to_index,
      v_passenger->>'passenger_name',
      v_passenger->>'passenger_phone',
      v_passenger->>'passenger_email',
      p_fare_per_seat,
      'pending_payment',
      NOW(),
      p_booking_group_id,
      ARRAY['S' || v_seat_num::TEXT]
    )
    RETURNING jsonb_build_object(
      'id', id,
      'trip_id', trip_id,
      'seat_number', seat_number,
      'passenger_name', passenger_name,
      'status', status,
      'total_amount', total_amount
    ) INTO v_booking_id;
    
    v_result := array_append(v_result, v_booking_id);
    v_idx := v_idx + 1;
  END LOOP;
  
  -- Return all inserted bookings as JSONB array
  RETURN jsonb_build_object('bookings', to_jsonb(v_result));
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;