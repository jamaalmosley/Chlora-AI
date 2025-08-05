-- Allow doctors to create appointments for their patients
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