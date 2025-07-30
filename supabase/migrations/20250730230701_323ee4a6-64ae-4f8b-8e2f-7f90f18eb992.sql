-- Drop the problematic admin policy
DROP POLICY IF EXISTS "admins_can_manage_practice_staff" ON public.staff;

-- Create a security definer function to check admin permissions safely
CREATE OR REPLACE FUNCTION public.user_is_practice_admin(p_practice_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff 
    WHERE user_id = auth.uid() 
    AND practice_id = p_practice_id
    AND role = 'admin' 
    AND status = 'active'
  );
$$;

-- Create a new admin policy using the security definer function
CREATE POLICY "practice_admins_can_manage_staff" 
ON public.staff 
FOR ALL 
USING (user_is_practice_admin(practice_id))
WITH CHECK (user_is_practice_admin(practice_id));

-- Also create a policy to allow viewing practice staff for all active staff members
CREATE POLICY "active_staff_can_view_practice_colleagues" 
ON public.staff 
FOR SELECT 
USING (
  practice_id IN (
    SELECT DISTINCT practice_id 
    FROM public.staff 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);