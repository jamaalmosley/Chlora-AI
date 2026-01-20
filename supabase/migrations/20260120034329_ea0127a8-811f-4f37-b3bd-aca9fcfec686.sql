-- Fix remaining permissive INSERT policy on practices table

-- Drop the permissive insert policy
DROP POLICY IF EXISTS "Authenticated users can create practices" ON public.practices;

-- Create a more restrictive insert policy - only authenticated users can create practices
-- and must be doctors or intending to become practice admins
CREATE POLICY "Doctors can create practices"
ON public.practices FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if user is a doctor (they can create practices they'll manage)
  EXISTS (
    SELECT 1 FROM public.doctors 
    WHERE user_id = auth.uid()
  )
  OR
  -- Or if user has admin role in user_roles
  public.has_role(auth.uid(), 'admin')
);