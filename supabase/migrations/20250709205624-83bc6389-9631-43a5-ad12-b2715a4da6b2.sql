-- Fix the RLS policies to prevent infinite recursion

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can manage practices" ON public.practices;
DROP POLICY IF EXISTS "Admins and doctors can manage staff" ON public.staff;
DROP POLICY IF EXISTS "Admins can manage staff" ON public.staff;
DROP POLICY IF EXISTS "Practice admins can view staff" ON public.staff;

-- Create simple, non-recursive policies for practices table
CREATE POLICY "allow_practice_reading" ON public.practices
FOR SELECT 
USING (true);

CREATE POLICY "allow_practice_writing" ON public.practices
FOR ALL
USING (true);

-- Create simple, non-recursive policies for staff table
CREATE POLICY "staff_can_view_all" ON public.staff
FOR SELECT 
USING (true);

CREATE POLICY "staff_can_manage_all" ON public.staff
FOR ALL
USING (true);