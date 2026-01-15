-- Fix search_path for SECURITY DEFINER functions to prevent search_path manipulation attacks

-- Fix accept_invitation
ALTER FUNCTION public.accept_invitation(invitation_token uuid) SET search_path = public;

-- Fix approve_join_request
ALTER FUNCTION public.approve_join_request(request_id uuid) SET search_path = public;

-- Fix create_staff_record
ALTER FUNCTION public.create_staff_record(
  p_user_id uuid,
  p_practice_id uuid,
  p_role text,
  p_department text
) SET search_path = public;

-- Fix get_current_user_role
ALTER FUNCTION public.get_current_user_role() SET search_path = public;

-- Fix handle_doctor_staff_assignment
ALTER FUNCTION public.handle_doctor_staff_assignment() SET search_path = public;

-- Fix user_can_manage_practice
ALTER FUNCTION public.user_can_manage_practice(p_practice_id uuid) SET search_path = public;