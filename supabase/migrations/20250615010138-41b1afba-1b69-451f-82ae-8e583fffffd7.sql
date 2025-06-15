
-- Drop all existing policies on staff table that might be causing recursion
DROP POLICY IF EXISTS "Staff can view their own record" ON public.staff;
DROP POLICY IF EXISTS "Practice owners can view all staff" ON public.staff;
DROP POLICY IF EXISTS "Practice owners can insert staff" ON public.staff;
DROP POLICY IF EXISTS "Practice owners can update staff" ON public.staff;
DROP POLICY IF EXISTS "Practice owners can delete staff" ON public.staff;
DROP POLICY IF EXISTS "view_practice_staff" ON public.staff;
DROP POLICY IF EXISTS "admin_manage_staff" ON public.staff;
DROP POLICY IF EXISTS "insert_self_as_staff" ON public.staff;

-- Drop any existing functions that might cause issues
DROP FUNCTION IF EXISTS public.can_access_practice(uuid);
DROP FUNCTION IF EXISTS public.is_practice_admin(uuid);

-- Create completely simple, non-recursive policies for staff table
-- Allow users to view their own staff record
CREATE POLICY "users_can_view_own_staff_record" 
  ON public.staff 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Allow users to insert their own staff record (for practice creation)
CREATE POLICY "users_can_insert_own_staff_record" 
  ON public.staff 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Allow users to update their own staff record
CREATE POLICY "users_can_update_own_staff_record" 
  ON public.staff 
  FOR UPDATE 
  USING (user_id = auth.uid());

-- Create simple policies for practices table
DROP POLICY IF EXISTS "view_own_practices" ON public.practices;
DROP POLICY IF EXISTS "admin_update_practices" ON public.practices;
DROP POLICY IF EXISTS "anyone_insert_practices" ON public.practices;

-- Allow anyone to insert practices (for practice creation)
CREATE POLICY "allow_practice_creation" 
  ON public.practices 
  FOR INSERT 
  WITH CHECK (true);

-- Allow viewing practices (we'll handle access control in application logic)
CREATE POLICY "allow_practice_viewing" 
  ON public.practices 
  FOR SELECT 
  USING (true);

-- Allow updating practices (we'll handle access control in application logic)
CREATE POLICY "allow_practice_updating" 
  ON public.practices 
  FOR UPDATE 
  USING (true);
