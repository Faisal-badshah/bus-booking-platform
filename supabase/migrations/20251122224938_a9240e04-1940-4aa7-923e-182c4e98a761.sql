-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.is_booking_expired(booking_row public.bookings)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    booking_row.status = 'pending_payment' 
    AND booking_row.created_at < (NOW() - INTERVAL '10 minutes')
$$;