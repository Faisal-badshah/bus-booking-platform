-- Add notes column to client_limits for internal notes
ALTER TABLE public.client_limits 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create superadmin_logs table for audit trail
CREATE TABLE public.superadmin_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  super_admin_id UUID NOT NULL,
  client_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on superadmin_logs
ALTER TABLE public.superadmin_logs ENABLE ROW LEVEL SECURITY;

-- Only super_admins can read/write superadmin_logs
CREATE POLICY "Super admins can manage logs"
ON public.superadmin_logs
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Update client_limits RLS policies
-- Drop existing policies first
DROP POLICY IF EXISTS "Admins can view own limits" ON public.client_limits;
DROP POLICY IF EXISTS "Admins can insert own limits" ON public.client_limits;
DROP POLICY IF EXISTS "Staff can view tracking status" ON public.client_limits;

-- Super admins can do everything on client_limits
CREATE POLICY "Super admins can manage all client limits"
ON public.client_limits
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Admins can only read their own limits
CREATE POLICY "Admins can view own limits"
ON public.client_limits
FOR SELECT
USING ((auth.uid() = client_id) AND has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert their own limits (for auto-creation)
CREATE POLICY "Admins can insert own limits"
ON public.client_limits
FOR INSERT
WITH CHECK ((auth.uid() = client_id) AND has_role(auth.uid(), 'admin'::app_role));

-- Staff can only read tracking status
CREATE POLICY "Staff can view tracking status"
ON public.client_limits
FOR SELECT
USING (has_role(auth.uid(), 'staff'::app_role));