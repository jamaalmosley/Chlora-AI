-- Drop existing conflicting policies on staff table
DROP POLICY IF EXISTS "Allow authenticated staff creation" ON public.staff;
DROP POLICY IF EXISTS "Allow staff updates" ON public.staff;
DROP POLICY IF EXISTS "Staff can view practice staff" ON public.staff;
DROP POLICY IF EXISTS "Users can view staff of their practice" ON public.staff;
DROP POLICY IF EXISTS "staff_can_manage_all" ON public.staff;
DROP POLICY IF EXISTS "staff_can_view_all" ON public.staff;
DROP POLICY IF EXISTS "users_can_insert_own_staff_record" ON public.staff;
DROP POLICY IF EXISTS "users_can_update_own_staff_record" ON public.staff;
DROP POLICY IF EXISTS "users_can_view_own_staff_record" ON public.staff;

-- Create simplified, non-recursive policies
CREATE POLICY "staff_can_view_own_record" 
ON public.staff 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "staff_can_insert_own_record" 
ON public.staff 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "staff_can_update_own_record" 
ON public.staff 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "admins_can_manage_practice_staff" 
ON public.staff 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.staff admin_staff 
    WHERE admin_staff.user_id = auth.uid() 
    AND admin_staff.practice_id = staff.practice_id
    AND admin_staff.role = 'admin' 
    AND admin_staff.status = 'active'
  )
);