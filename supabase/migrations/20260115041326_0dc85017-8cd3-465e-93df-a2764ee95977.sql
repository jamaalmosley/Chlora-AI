-- Fix 1: Add INSERT policy for notifications table (for trigger function)
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Fix 3: Restrict medical-files storage access to assigned patients only
-- First, drop the overly permissive doctor policy
DROP POLICY IF EXISTS "Doctors can view medical files" ON storage.objects;

-- Create restrictive policy: Doctors can only view files of patients assigned to their practice or with appointments
CREATE POLICY "Doctors can view assigned patient files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'medical-files'
  AND (
    -- Check if user is a doctor and the file belongs to an assigned patient
    (storage.foldername(name))[1] IN (
      -- Patients assigned to practices where the doctor works
      SELECT pa.patient_id::text 
      FROM public.patient_assignments pa
      JOIN public.staff s ON s.practice_id = pa.practice_id
      WHERE s.user_id = auth.uid() 
        AND s.status = 'active'
        AND pa.status = 'active'
      UNION
      -- Patients with appointments with this doctor
      SELECT a.patient_id::text 
      FROM public.appointments a
      JOIN public.doctors d ON d.id = a.doctor_id
      WHERE d.user_id = auth.uid()
      UNION
      -- Medical records created by this doctor
      SELECT mr.patient_id::text
      FROM public.medical_records mr
      JOIN public.doctors d ON d.id = mr.doctor_id
      WHERE d.user_id = auth.uid()
    )
  )
);

-- Update INSERT policy for doctors to only upload to assigned patient folders
DROP POLICY IF EXISTS "Doctors can upload medical files" ON storage.objects;

CREATE POLICY "Doctors can upload assigned patient files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'medical-files'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT pa.patient_id::text 
      FROM public.patient_assignments pa
      JOIN public.staff s ON s.practice_id = pa.practice_id
      WHERE s.user_id = auth.uid() 
        AND s.status = 'active'
        AND pa.status = 'active'
      UNION
      SELECT a.patient_id::text 
      FROM public.appointments a
      JOIN public.doctors d ON d.id = a.doctor_id
      WHERE d.user_id = auth.uid()
      UNION
      SELECT mr.patient_id::text
      FROM public.medical_records mr
      JOIN public.doctors d ON d.id = mr.doctor_id
      WHERE d.user_id = auth.uid()
    )
  )
);

-- Ensure patients can still view their own files
DROP POLICY IF EXISTS "Patients can view their medical files" ON storage.objects;

CREATE POLICY "Patients can view their medical files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'medical-files'
  AND (storage.foldername(name))[1] IN (
    SELECT p.id::text FROM public.patients p WHERE p.user_id = auth.uid()
  )
);