-- Create patient_invitations table
CREATE TABLE public.patient_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  practice_id UUID NOT NULL REFERENCES public.practices(id),
  invited_by UUID NOT NULL,
  invitation_token UUID NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Practice staff can manage patient invitations" 
ON public.patient_invitations 
FOR ALL
USING (
  practice_id IN (
    SELECT practice_id 
    FROM staff 
    WHERE user_id = auth.uid() 
    AND status = 'active' 
    AND ('manage_patients' = ANY(permissions) OR role = 'admin' OR role = 'doctor')
  )
);

CREATE POLICY "Users can view invitations sent to their email" 
ON public.patient_invitations 
FOR SELECT 
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Create index for performance
CREATE INDEX idx_patient_invitations_email ON public.patient_invitations(email);
CREATE INDEX idx_patient_invitations_token ON public.patient_invitations(invitation_token);