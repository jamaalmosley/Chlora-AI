-- Drop all staff policies completely
DROP POLICY IF EXISTS "allow_staff_management" ON public.staff;
DROP POLICY IF EXISTS "users_can_view_own_staff_records" ON public.staff;
DROP POLICY IF EXISTS "users_can_insert_own_staff_records" ON public.staff;
DROP POLICY IF EXISTS "users_can_update_own_staff_records" ON public.staff;

-- Create simple, non-recursive policies exactly as ChatGPT suggested
CREATE POLICY "users_can_manage_own_staff_record" 
ON public.staff 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Separate policy for practice creation (allows inserting staff records during practice setup)
CREATE POLICY "allow_practice_staff_creation" 
ON public.staff 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);