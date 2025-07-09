
-- Create the physician_patient_requests table for doctor-patient connection requests
CREATE TABLE public.physician_patient_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_id UUID NOT NULL REFERENCES public.practices(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.physician_patient_requests ENABLE ROW LEVEL SECURITY;

-- Allow patients to view requests sent to them
CREATE POLICY "patients_can_view_their_requests" 
  ON public.physician_patient_requests 
  FOR SELECT 
  USING (patient_id IN (
    SELECT id FROM public.patients WHERE user_id = auth.uid()
  ));

-- Allow patients to update requests sent to them (accept/reject)
CREATE POLICY "patients_can_respond_to_requests" 
  ON public.physician_patient_requests 
  FOR UPDATE 
  USING (patient_id IN (
    SELECT id FROM public.patients WHERE user_id = auth.uid()
  ));

-- Allow doctors to create requests
CREATE POLICY "doctors_can_create_requests" 
  ON public.physician_patient_requests 
  FOR INSERT 
  WITH CHECK (requested_by = auth.uid());

-- Allow doctors to view their own requests
CREATE POLICY "doctors_can_view_their_requests" 
  ON public.physician_patient_requests 
  FOR SELECT 
  USING (requested_by = auth.uid());
