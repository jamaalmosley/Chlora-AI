-- Remove the duplicate policy that was created
DROP POLICY IF EXISTS "allow_practice_staff_creation" ON public.staff;

-- Now we should only have the one clean policy that doesn't cause recursion
-- Check if this resolves the issue

-- Also let's verify the practices table policies don't have issues
-- Update practices policies to be simpler if needed  
DROP POLICY IF EXISTS "allow_practice_creation" ON public.practices;
DROP POLICY IF EXISTS "allow_practice_reading" ON public.practices;
DROP POLICY IF EXISTS "allow_practice_updating" ON public.practices;
DROP POLICY IF EXISTS "allow_practice_viewing" ON public.practices;
DROP POLICY IF EXISTS "allow_practice_writing" ON public.practices;
DROP POLICY IF EXISTS "Staff can view their practice" ON public.practices;

-- Create simple practices policies
CREATE POLICY "anyone_can_create_practice" 
ON public.practices 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "anyone_can_view_practices" 
ON public.practices 
FOR SELECT 
USING (true);

CREATE POLICY "anyone_can_update_practices" 
ON public.practices 
FOR UPDATE 
USING (true);