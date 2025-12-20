-- Create a SECURITY DEFINER function for trusted logging
-- Edge functions use service role key (bypasses RLS), but this provides an additional secure path
CREATE OR REPLACE FUNCTION public.log_booking_event(
  p_event_type TEXT,
  p_booking_id UUID DEFAULT NULL,
  p_booking_group_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO booking_logs (booking_id, booking_group_id, event_type, metadata)
  VALUES (p_booking_id, p_booking_group_id, p_event_type, p_metadata)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Drop the overly permissive INSERT policy that allows anyone to insert logs
DROP POLICY IF EXISTS "System can insert logs" ON public.booking_logs;