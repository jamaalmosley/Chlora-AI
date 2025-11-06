-- Create enum for test types
CREATE TYPE public.test_type AS ENUM (
  'mri',
  'ct_scan',
  'x_ray',
  'ekg',
  'ecg',
  'blood_test',
  'urine_test',
  'ultrasound',
  'biopsy',
  'other'
);

-- Create medical_records table
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  test_type public.test_type NOT NULL,
  test_date DATE NOT NULL,
  test_name TEXT NOT NULL,
  findings TEXT,
  notes TEXT,
  file_urls TEXT[], -- Array of file URLs from storage
  status TEXT NOT NULL DEFAULT 'draft',
  released_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- Doctors can create and manage their own records
CREATE POLICY "Doctors can create medical records"
ON public.medical_records
FOR INSERT
WITH CHECK (
  doctor_id IN (
    SELECT id FROM public.doctors WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Doctors can view their medical records"
ON public.medical_records
FOR SELECT
USING (
  doctor_id IN (
    SELECT id FROM public.doctors WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Doctors can update their medical records"
ON public.medical_records
FOR UPDATE
USING (
  doctor_id IN (
    SELECT id FROM public.doctors WHERE user_id = auth.uid()
  )
);

-- Patients can only view released records
CREATE POLICY "Patients can view released medical records"
ON public.medical_records
FOR SELECT
USING (
  status = 'released' 
  AND patient_id IN (
    SELECT id FROM public.patients WHERE user_id = auth.uid()
  )
);

-- Create storage bucket for medical files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical-files',
  'medical-files',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'image/dicom']
);

-- Storage policies for medical files
CREATE POLICY "Doctors can upload medical files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'medical-files'
  AND auth.uid() IN (SELECT user_id FROM public.doctors)
);

CREATE POLICY "Doctors can view medical files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'medical-files'
  AND auth.uid() IN (SELECT user_id FROM public.doctors)
);

CREATE POLICY "Patients can view their medical files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'medical-files'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.patients WHERE user_id = auth.uid()
  )
);

-- Create notifications table for test result releases
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications"
ON public.notifications
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
ON public.notifications
FOR UPDATE
USING (user_id = auth.uid());

-- Function to notify patient when record is released
CREATE OR REPLACE FUNCTION notify_patient_on_release()
RETURNS TRIGGER AS $$
DECLARE
  patient_user_id UUID;
  doctor_name TEXT;
BEGIN
  IF NEW.status = 'released' AND OLD.status != 'released' THEN
    -- Get patient's user_id
    SELECT user_id INTO patient_user_id
    FROM public.patients
    WHERE id = NEW.patient_id;
    
    -- Get doctor's name
    SELECT p.first_name || ' ' || p.last_name INTO doctor_name
    FROM public.doctors d
    JOIN public.profiles p ON d.user_id = p.id
    WHERE d.id = NEW.doctor_id;
    
    -- Create notification
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      patient_user_id,
      'medical_record_released',
      'New Test Results Available',
      'Dr. ' || doctor_name || ' has released your ' || NEW.test_name || ' results.',
      '/patient/records'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_medical_record_released
  AFTER UPDATE ON public.medical_records
  FOR EACH ROW
  EXECUTE FUNCTION notify_patient_on_release();