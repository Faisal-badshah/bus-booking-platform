-- Update RLS policy to restrict system_settings to authenticated users only
-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view system settings" ON public.system_settings;

-- Create a new policy that only allows authenticated users to view settings
CREATE POLICY "Authenticated users can view system settings" ON public.system_settings FOR
SELECT
  USING (auth.uid () IS NOT NULL);