-- Update boarding_logs RLS policies to use user_roles instead of staff_roles
DROP POLICY IF EXISTS "Staff and admins can view boarding logs" ON public.boarding_logs;
DROP POLICY IF EXISTS "Staff can insert boarding logs" ON public.boarding_logs;

CREATE POLICY "Staff and admins can view boarding logs"
ON public.boarding_logs
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'staff'::app_role) OR 
  public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Staff can insert boarding logs"
ON public.boarding_logs
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'staff'::app_role));

-- Update staff_roles table policies for admin management
DROP POLICY IF EXISTS "Admins can manage staff roles" ON public.staff_roles;
DROP POLICY IF EXISTS "Staff can view own roles" ON public.staff_roles;

CREATE POLICY "Admins can view all staff_roles"
ON public.staff_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage staff_roles"
ON public.staff_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));