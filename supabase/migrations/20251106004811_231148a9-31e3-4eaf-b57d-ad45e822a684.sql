-- Fix search path for notify_patient_on_release function
CREATE OR REPLACE FUNCTION notify_patient_on_release()
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
    
    -- Create notification
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      patient_user_id,
      'medical_record_released',
      'New Test Results Available',
      'Dr. ' || doctor_name || ' has released your ' || NEW.test_name || ' results.',
      '/patient/records'
    );
  END IF;
  
  RETURN NEW;
END;
$$;