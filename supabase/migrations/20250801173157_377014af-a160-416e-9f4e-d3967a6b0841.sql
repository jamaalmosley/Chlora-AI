-- Create patient_invitations table
CREATE TABLE public.patient_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  practice_id UUID NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitation_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create invitations for their practice" 
ON public.patient_invitations 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.staff 
    WHERE user_id = auth.uid() 
    AND practice_id = patient_invitations.practice_id 
    AND status = 'active'
  )
);

CREATE POLICY "Users can view invitations for their practice" 
ON public.patient_invitations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.staff 
    WHERE user_id = auth.uid() 
    AND practice_id = patient_invitations.practice_id 
    AND status = 'active'
  )
);

CREATE POLICY "Users can update invitations for their practice" 
ON public.patient_invitations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.staff 
    WHERE user_id = auth.uid() 
    AND practice_id = patient_invitations.practice_id 
    AND status = 'active'
  )
);

-- Create index for performance
CREATE INDEX idx_patient_invitations_practice_id ON public.patient_invitations(practice_id);
CREATE INDEX idx_patient_invitations_token ON public.patient_invitations(invitation_token);
CREATE INDEX idx_patient_invitations_email ON public.patient_invitations(email);