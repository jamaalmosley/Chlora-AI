-- Fix all error-level security issues

-- ==========================================
-- ISSUE 1: Create user_roles table for proper admin authorization
-- (Following security guidelines - roles must be in separate table)
-- ==========================================

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

-- Only existing admins can manage roles (bootstrap first admin via SQL or service role)
CREATE POLICY "Admins can manage user roles"
ON public.user_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create SECURITY DEFINER function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- ==========================================
-- ISSUE 2: Fix practices table - Remove permissive policies
-- ==========================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "anyone_can_view_practices" ON public.practices;
DROP POLICY IF EXISTS "anyone_can_create_practice" ON public.practices;
DROP POLICY IF EXISTS "anyone_can_update_practices" ON public.practices;

-- Staff can view their practice
CREATE POLICY "Staff can view their practice"
ON public.practices FOR SELECT
USING (
  id IN (
    SELECT practice_id FROM public.staff
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Authenticated users can view practices for discovery/joining
CREATE POLICY "Authenticated users can view practices for discovery"
ON public.practices FOR SELECT
TO authenticated
USING (true);

-- Practice admins can create practices (first user becomes admin via staff table)
CREATE POLICY "Authenticated users can create practices"
ON public.practices FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only practice admins can update practices
CREATE POLICY "Practice admins can update practices"
ON public.practices FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.staff
    WHERE staff.practice_id = practices.id
      AND staff.user_id = auth.uid()
      AND staff.role = 'admin'
      AND staff.status = 'active'
  )
);

-- Only system admins can delete practices
CREATE POLICY "System admins can delete practices"
ON public.practices FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- ==========================================
-- ISSUE 3: Fix notifications - Remove permissive insert policy
-- ==========================================

-- Drop the permissive policy that allows anyone to insert
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create SECURITY DEFINER function for system notifications
CREATE OR REPLACE FUNCTION public.create_system_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Validate inputs
  IF p_user_id IS NULL OR p_type IS NULL OR p_title IS NULL OR p_message IS NULL THEN
    RAISE EXCEPTION 'Missing required parameters';
  END IF;
  
  -- Validate type against known types
  IF p_type NOT IN ('appointment_reminder', 'medical_record_released', 'prescription_ready', 'system_announcement', 'join_request', 'invitation') THEN
    RAISE EXCEPTION 'Invalid notification type: %', p_type;
  END IF;
  
  -- Insert notification (bypasses RLS due to SECURITY DEFINER)
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (p_user_id, p_type, p_title, p_message, p_link)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Update the notify_patient_on_release trigger to use the new function
CREATE OR REPLACE FUNCTION public.notify_patient_on_release()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  patient_user_id UUID;
  doctor_name TEXT;
BEGIN
  IF NEW.status = 'released' AND OLD.status != 'released' THEN
    -- Get patient's user_id
    SELECT user_id INTO patient_user_id
    FROM public.patients
    WHERE id = NEW.patient_id;
    
    -- Get doctor's name
    SELECT p.first_name || ' ' || p.last_name INTO doctor_name
    FROM public.doctors d
    JOIN public.profiles p ON d.user_id = p.id
    WHERE d.id = NEW.doctor_id;
    
    -- Use the secure function to create notification
    PERFORM public.create_system_notification(
      patient_user_id,
      'medical_record_released',
      'New Test Results Available',
      'Dr. ' || COALESCE(doctor_name, 'Your Doctor') || ' has released your ' || NEW.test_name || ' results.',
      '/patient/records'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- ==========================================
-- ISSUE 4: Add DELETE policies for admin operations
-- ==========================================

-- Patients table - system admins only
CREATE POLICY "System admins can delete patients"
ON public.patients FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Appointments - patients can cancel their own, doctors theirs, admins all
CREATE POLICY "Users can delete their appointments"
ON public.appointments FOR DELETE
USING (
  -- Patient can delete their own appointment
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = appointments.patient_id AND p.user_id = auth.uid()
  )
  OR
  -- Doctor can delete appointments they're assigned to
  EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.id = appointments.doctor_id AND d.user_id = auth.uid()
  )
  OR
  -- System admins can delete any
  public.has_role(auth.uid(), 'admin')
);

-- Medications - doctors who prescribed can delete, or system admins
CREATE POLICY "Doctors can delete medications they prescribed"
ON public.medications FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.id = medications.prescribed_by AND d.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Profiles - system admins only (users shouldn't delete their own profile)
CREATE POLICY "System admins can delete profiles"
ON public.profiles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Staff - practice admins can remove staff, system admins can remove any
CREATE POLICY "Practice admins can delete staff"
ON public.staff FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.practice_id = staff.practice_id
      AND s.user_id = auth.uid()
      AND s.role = 'admin'
      AND s.status = 'active'
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Patient assignments - practice admins or system admins
CREATE POLICY "Practice admins can delete patient assignments"
ON public.patient_assignments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.practice_id = patient_assignments.practice_id
      AND s.user_id = auth.uid()
      AND s.role = 'admin'
      AND s.status = 'active'
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Doctors - system admins only
CREATE POLICY "System admins can delete doctors"
ON public.doctors FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Medical records - doctors who created or system admins
CREATE POLICY "Doctors can delete their medical records"
ON public.medical_records FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.id = medical_records.doctor_id AND d.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- ==========================================
-- ISSUE 5: Ensure accept_invitation and approve_join_request exist
-- (These already exist per db-functions, just ensure search_path is set)
-- ==========================================

-- Recreate accept_invitation with all security measures
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_record public.practice_invitations;
  staff_id UUID;
  v_user_email TEXT;
BEGIN
  -- Get authenticated user's email
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  
  IF v_user_email IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get the invitation
  SELECT * INTO invitation_record 
  FROM public.practice_invitations 
  WHERE practice_invitations.invitation_token = accept_invitation.invitation_token
  AND status = 'pending'
  AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;
  
  -- Check if user email matches invitation email
  IF invitation_record.email != v_user_email THEN
    RETURN json_build_object('success', false, 'error', 'Email does not match invitation');
  END IF;
  
  -- Create staff record
  INSERT INTO public.staff (user_id, practice_id, role, department, status)
  VALUES (auth.uid(), invitation_record.practice_id, invitation_record.role, invitation_record.department, 'active')
  ON CONFLICT (user_id, practice_id) DO UPDATE
  SET role = EXCLUDED.role, department = EXCLUDED.department, status = 'active'
  RETURNING id INTO staff_id;
  
  -- Mark invitation as accepted
  UPDATE public.practice_invitations 
  SET status = 'accepted', updated_at = now()
  WHERE id = invitation_record.id;
  
  RETURN json_build_object('success', true, 'staff_id', staff_id, 'practice_id', invitation_record.practice_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Recreate approve_join_request with all security measures
CREATE OR REPLACE FUNCTION public.approve_join_request(request_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_record public.practice_join_requests;
  staff_id UUID;
BEGIN
  -- Get the join request
  SELECT * INTO request_record 
  FROM public.practice_join_requests 
  WHERE id = request_id
  AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or already processed request');
  END IF;
  
  -- Check if current user can manage the practice (is admin of the practice)
  IF NOT EXISTS (
    SELECT 1 FROM public.staff
    WHERE user_id = auth.uid()
      AND practice_id = request_record.practice_id
      AND role = 'admin'
      AND status = 'active'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized to approve requests for this practice');
  END IF;
  
  -- Create staff record
  INSERT INTO public.staff (user_id, practice_id, role, status)
  VALUES (request_record.user_id, request_record.practice_id, request_record.requested_role, 'active')
  ON CONFLICT (user_id, practice_id) DO UPDATE
  SET role = EXCLUDED.role, status = 'active'
  RETURNING id INTO staff_id;
  
  -- Mark request as approved
  UPDATE public.practice_join_requests 
  SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
  WHERE id = request_id;
  
  RETURN json_build_object('success', true, 'staff_id', staff_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.accept_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_join_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_system_notification(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;