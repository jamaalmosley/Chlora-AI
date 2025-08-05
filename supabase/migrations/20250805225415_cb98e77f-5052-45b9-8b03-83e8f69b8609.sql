-- Drop the current policy and create a new one that checks staff table
DROP POLICY IF EXISTS "Doctors can create appointments" ON public.appointments;

-- Create policy that checks if user is staff with physician role
CREATE POLICY "Physicians can create appointments"
ON public.appointments
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM staff
    WHERE role IN ('doctor', 'physician', 'admin')
    AND status = 'active'
  )
);