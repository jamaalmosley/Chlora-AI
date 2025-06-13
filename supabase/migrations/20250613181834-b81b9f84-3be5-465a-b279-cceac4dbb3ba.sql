
-- Drop existing problematic policies on staff table
DROP POLICY IF EXISTS "Users can view staff records for their practices" ON public.staff;
DROP POLICY IF EXISTS "Users can manage staff in their practices" ON public.staff;
DROP POLICY IF EXISTS "Practice admins can manage staff" ON public.staff;
DROP POLICY IF EXISTS "Staff can view their own record" ON public.staff;

-- Create simple, non-recursive policies for staff table
CREATE POLICY "Staff can view their own record" 
  ON public.staff 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Practice owners can view all staff" 
  ON public.staff 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.practices p 
      JOIN public.staff s ON p.id = s.practice_id 
      WHERE s.user_id = auth.uid() 
      AND s.role = 'admin' 
      AND s.status = 'active'
      AND p.id = practice_id
    )
  );

CREATE POLICY "Practice owners can insert staff" 
  ON public.staff 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.practices p 
      JOIN public.staff s ON p.id = s.practice_id 
      WHERE s.user_id = auth.uid() 
      AND s.role = 'admin' 
      AND s.status = 'active'
      AND p.id = practice_id
    )
  );

CREATE POLICY "Practice owners can update staff" 
  ON public.staff 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.practices p 
      JOIN public.staff s ON p.id = s.practice_id 
      WHERE s.user_id = auth.uid() 
      AND s.role = 'admin' 
      AND s.status = 'active'
      AND p.id = practice_id
    )
  );

CREATE POLICY "Practice owners can delete staff" 
  ON public.staff 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.practices p 
      JOIN public.staff s ON p.id = s.practice_id 
      WHERE s.user_id = auth.uid() 
      AND s.role = 'admin' 
      AND s.status = 'active'
      AND p.id = practice_id
    )
  );
