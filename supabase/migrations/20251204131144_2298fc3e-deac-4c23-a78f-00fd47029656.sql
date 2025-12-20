-- Create staff_trip_assignments table
CREATE TABLE
  public.staff_trip_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    staff_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    trip_id uuid NOT NULL REFERENCES public.trips (id) ON DELETE CASCADE,
    assignment_date date NOT NULL,
    created_at timestamp
    with
      time zone DEFAULT now (),
      UNIQUE (staff_id, trip_id, assignment_date)
  );

-- Enable RLS
ALTER TABLE public.staff_trip_assignments ENABLE ROW LEVEL SECURITY;

-- Staff can view their own assignments
CREATE POLICY "Staff can view own assignments" ON public.staff_trip_assignments FOR
SELECT
  USING (auth.uid () = staff_id);

-- Admins can view all assignments
CREATE POLICY "Admins can view all assignments" ON public.staff_trip_assignments FOR
SELECT
  USING (has_role (auth.uid (), 'admin'));

-- Admins can insert assignments
CREATE POLICY "Admins can insert assignments" ON public.staff_trip_assignments FOR INSERT
WITH
  CHECK (has_role (auth.uid (), 'admin'));

-- Admins can delete assignments
CREATE POLICY "Admins can delete assignments" ON public.staff_trip_assignments FOR DELETE USING (has_role (auth.uid (), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_staff_trip_assignments_staff_date ON public.staff_trip_assignments (staff_id, assignment_date);

CREATE INDEX idx_staff_trip_assignments_trip ON public.staff_trip_assignments (trip_id);