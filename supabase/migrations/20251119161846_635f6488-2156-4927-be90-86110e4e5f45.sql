-- Fix 1: Add RLS policies for payments table
-- Users can only create payments for their own bookings
CREATE POLICY "Users can only create payments for own bookings"
ON payments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = payments.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

-- Admins can manage all payments
CREATE POLICY "Admins can manage all payments"
ON payments FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Restrict booking UPDATE policy to only allow status changes, not PII modifications
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;

CREATE POLICY "Users can update booking status only"
ON bookings FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND status IN ('confirmed', 'cancellation_requested')
  AND passenger_name = (SELECT passenger_name FROM bookings WHERE id = bookings.id)
  AND passenger_email = (SELECT passenger_email FROM bookings WHERE id = bookings.id)
  AND passenger_phone = (SELECT passenger_phone FROM bookings WHERE id = bookings.id)
);

-- Fix 3: Add server-side seat validation trigger
CREATE OR REPLACE FUNCTION validate_booking_seats()
RETURNS TRIGGER AS $$
DECLARE
  bus_seats INT;
  reserved_seats TEXT[];
  booked_seats TEXT[];
BEGIN
  -- Get bus capacity and reserved seats
  SELECT b.seat_count, t.owner_reserved_seats
  INTO bus_seats, reserved_seats
  FROM trips t
  JOIN buses b ON t.bus_id = b.id
  WHERE t.id = NEW.trip_id;
  
  -- Check all seats are valid (within bus capacity)
  IF EXISTS (
    SELECT 1 FROM unnest(NEW.seat_numbers) AS seat 
    WHERE seat::INT > bus_seats OR seat::INT < 1
  ) THEN
    RAISE EXCEPTION 'Invalid seat number - must be between 1 and %', bus_seats;
  END IF;
  
  -- Check no reserved seats are being booked
  IF reserved_seats IS NOT NULL AND NEW.seat_numbers && reserved_seats THEN
    RAISE EXCEPTION 'Cannot book owner-reserved seats';
  END IF;
  
  -- Check seats not already booked
  SELECT array_agg(DISTINCT seat_num)
  INTO booked_seats
  FROM bookings b
  CROSS JOIN unnest(b.seat_numbers) AS seat_num
  WHERE b.trip_id = NEW.trip_id
    AND b.status IN ('confirmed', 'cancellation_requested')
    AND b.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND seat_num = ANY(NEW.seat_numbers);
    
  IF booked_seats IS NOT NULL AND array_length(booked_seats, 1) > 0 THEN
    RAISE EXCEPTION 'Seats already booked: %', array_to_string(booked_seats, ', ');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER check_booking_seats
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION validate_booking_seats();