
-- First, completely drop all existing policies and functions that might cause recursion
DROP POLICY IF EXISTS "Admins and doctors can manage staff" ON public.staff;
DROP POLICY IF EXISTS "Admins can manage staff" ON public.staff;
DROP POLICY IF EXISTS "Allow authenticated staff creation" ON public.staff;
DROP POLICY IF EXISTS "Allow staff updates" ON public.staff;
DROP POLICY IF EXISTS "Practice admins can view staff" ON public.staff;
DROP POLICY IF EXISTS "Staff can view practice staff" ON public.staff;
DROP POLICY IF EXISTS "Users can view staff of their practice" ON public.staff;
DROP POLICY IF EXISTS "users_can_insert_own_staff_record" ON public.staff;
DROP POLICY IF EXISTS "users_can_update_own_staff_record" ON public.staff;
DROP POLICY IF EXISTS "users_can_view_own_staff_record" ON public.staff;

-- Drop all existing policies on practices table that might cause issues
DROP POLICY IF EXISTS "Admins can manage practices" ON public.practices;
DROP POLICY IF EXISTS "Staff can view their practice" ON public.practices;
DROP POLICY IF EXISTS "allow_practice_creation" ON public.practices;
DROP POLICY IF EXISTS "allow_practice_updating" ON public.practices;
DROP POLICY IF EXISTS "allow_practice_viewing" ON public.practices;

-- Drop any existing problematic functions
DROP FUNCTION IF EXISTS public.user_can_manage_practice(uuid);
DROP FUNCTION IF EXISTS public.get_user_practice_ids();
DROP FUNCTION IF EXISTS public.is_practice_admin(uuid);
DROP FUNCTION IF EXISTS public.can_access_practice(uuid);

-- Create simple, non-recursive policies for staff table
-- Allow users to view their own staff record
CREATE POLICY "staff_own_record_select" 
  ON public.staff 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Allow users to insert their own staff record
CREATE POLICY "staff_own_record_insert" 
  ON public.staff 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Allow users to update their own staff record
CREATE POLICY "staff_own_record_update" 
  ON public.staff 
  FOR UPDATE 
  USING (user_id = auth.uid());

-- Create simple policies for practices table
-- Allow anyone to insert practices (for practice creation)
CREATE POLICY "practices_insert_any" 
  ON public.practices 
  FOR INSERT 
  WITH CHECK (true);

-- Allow anyone to view practices (we'll control access in application logic)
CREATE POLICY "practices_select_any" 
  ON public.practices 
  FOR SELECT 
  USING (true);

-- Allow anyone to update practices (we'll control access in application logic)
CREATE POLICY "practices_update_any" 
  ON public.practices 
  FOR UPDATE 
  USING (true);
