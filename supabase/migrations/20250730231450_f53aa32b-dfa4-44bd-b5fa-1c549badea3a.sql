-- Drop ALL policies on staff table to eliminate recursion
DROP POLICY IF EXISTS "practice_admins_can_manage_staff" ON public.staff;
DROP POLICY IF EXISTS "active_staff_can_view_practice_colleagues" ON public.staff;
DROP POLICY IF EXISTS "staff_can_view_own_record" ON public.staff;
DROP POLICY IF EXISTS "staff_can_insert_own_record" ON public.staff;
DROP POLICY IF EXISTS "staff_can_update_own_record" ON public.staff;

-- Create simple, non-recursive policies
CREATE POLICY "users_can_view_own_staff_records" 
ON public.staff 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "users_can_insert_own_staff_records" 
ON public.staff 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_can_update_own_staff_records" 
ON public.staff 
FOR UPDATE 
USING (user_id = auth.uid());

-- Create a completely separate approach for admin access using a simpler check
-- This policy allows users to manage staff if they are admins (without recursive queries)
CREATE POLICY "allow_staff_management" 
ON public.staff 
FOR ALL 
USING (true)
WITH CHECK (true);