-- Create client_limits table for bus/feature limits per admin
CREATE TABLE public.client_limits (
  client_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  max_buses INTEGER NOT NULL DEFAULT 2,
  max_seats_per_bus INTEGER NOT NULL DEFAULT 50,
  gps_enabled BOOLEAN NOT NULL DEFAULT true,
  gps_trial_end DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '60 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_limits ENABLE ROW LEVEL SECURITY;

-- Admins can view their own limits
CREATE POLICY "Admins can view own limits"
ON public.client_limits
FOR SELECT
USING (auth.uid() = client_id AND has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert their own limits (for auto-creation)
CREATE POLICY "Admins can insert own limits"
ON public.client_limits
FOR INSERT
WITH CHECK (auth.uid() = client_id AND has_role(auth.uid(), 'admin'::app_role));

-- Only system can update limits (via service role)
-- No UPDATE policy for regular users - upgrades handled by system

-- Create trigger for updated_at
CREATE TRIGGER update_client_limits_updated_at
BEFORE UPDATE ON public.client_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_system_settings_updated_at();

-- Create function to check bus limit
CREATE OR REPLACE FUNCTION public.check_bus_limit()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_max_buses INTEGER;
  v_current_count INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  -- Get or create client limits
  INSERT INTO client_limits (client_id)
  VALUES (v_user_id)
  ON CONFLICT (client_id) DO NOTHING;
  
  -- Get max buses limit
  SELECT max_buses INTO v_max_buses
  FROM client_limits
  WHERE client_id = v_user_id;
  
  -- Count existing buses
  SELECT COUNT(*) INTO v_current_count
  FROM buses;
  
  RETURN jsonb_build_object(
    'current_count', v_current_count,
    'max_buses', COALESCE(v_max_buses, 2),
    'can_add', v_current_count < COALESCE(v_max_buses, 2)
  );
END;
$$;

-- Create function to create bus with limit check
CREATE OR REPLACE FUNCTION public.create_bus_with_limit_check(
  p_name TEXT,
  p_seat_count INTEGER
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_max_buses INTEGER;
  v_max_seats INTEGER;
  v_current_count INTEGER;
  v_new_bus_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Verify user is admin
  IF NOT has_role(v_user_id, 'admin'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  -- Get or create client limits
  INSERT INTO client_limits (client_id)
  VALUES (v_user_id)
  ON CONFLICT (client_id) DO NOTHING;
  
  -- Get limits
  SELECT max_buses, max_seats_per_bus INTO v_max_buses, v_max_seats
  FROM client_limits
  WHERE client_id = v_user_id;
  
  v_max_buses := COALESCE(v_max_buses, 2);
  v_max_seats := COALESCE(v_max_seats, 50);
  
  -- Count existing buses
  SELECT COUNT(*) INTO v_current_count FROM buses;
  
  -- Check bus limit
  IF v_current_count >= v_max_buses THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Bus limit reached. Upgrade to add more buses.',
      'current_count', v_current_count,
      'max_buses', v_max_buses
    );
  END IF;
  
  -- Check seat count limit
  IF p_seat_count > v_max_seats THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Seat count exceeds maximum allowed (' || v_max_seats || ')',
      'max_seats', v_max_seats
    );
  END IF;
  
  -- Create the bus
  INSERT INTO buses (name, seat_count)
  VALUES (p_name, p_seat_count)
  RETURNING id INTO v_new_bus_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'bus_id', v_new_bus_id,
    'current_count', v_current_count + 1,
    'max_buses', v_max_buses
  );
END;
$$;