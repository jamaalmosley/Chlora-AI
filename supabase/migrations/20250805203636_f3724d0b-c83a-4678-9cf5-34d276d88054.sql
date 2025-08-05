-- Drop the incorrect policy first
DROP POLICY IF EXISTS "Doctors can create appointments" ON public.appointments;

-- Create the correct policy - doctors can create appointments where they are the doctor
CREATE POLICY "Doctors can create appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM doctors d
    WHERE d.id = appointments.doctor_id 
    AND d.user_id = auth.uid()
  )
);