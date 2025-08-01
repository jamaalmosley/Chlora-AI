-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can create invitations for their practice" ON public.patient_invitations;
DROP POLICY IF EXISTS "Users can view invitations for their practice" ON public.patient_invitations;
DROP POLICY IF EXISTS "Users can update invitations for their practice" ON public.patient_invitations;

-- Create simplified policies that avoid recursion
CREATE POLICY "Staff can create patient invitations" 
ON public.patient_invitations 
FOR INSERT 
WITH CHECK (invited_by = auth.uid());

CREATE POLICY "Staff can view patient invitations" 
ON public.patient_invitations 
FOR SELECT 
USING (invited_by = auth.uid());

CREATE POLICY "Staff can update patient invitations" 
ON public.patient_invitations 
FOR UPDATE 
USING (invited_by = auth.uid());