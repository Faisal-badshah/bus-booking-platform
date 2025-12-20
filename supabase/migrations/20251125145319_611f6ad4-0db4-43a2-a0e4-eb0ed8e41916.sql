-- Create system_settings table for booking mode and payment rules
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_mode text NOT NULL CHECK (booking_mode IN ('offline', 'online', 'hybrid')) DEFAULT 'offline',
  online_payment_weekends boolean DEFAULT false,
  online_payment_distance_threshold integer DEFAULT null,
  online_payment_disable_from time DEFAULT null,
  online_payment_disable_to time DEFAULT null,
  festival_force_online boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can view system settings"
  ON public.system_settings
  FOR SELECT
  USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update system settings"
  ON public.system_settings
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert settings
CREATE POLICY "Admins can insert system settings"
  ON public.system_settings
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed initial row if table is empty
INSERT INTO public.system_settings (booking_mode, online_payment_weekends, festival_force_online)
SELECT 'offline', false, false
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_system_settings_updated_at();