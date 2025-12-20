-- Allow staff to read tracking status from client_limits
CREATE POLICY "Staff can view tracking status"
ON public.client_limits
FOR SELECT
USING (has_role(auth.uid(), 'staff'::app_role));