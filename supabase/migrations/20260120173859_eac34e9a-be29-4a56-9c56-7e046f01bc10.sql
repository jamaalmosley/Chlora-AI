-- Create surgeries table first
CREATE TABLE public.surgeries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  surgery_date TIMESTAMP WITH TIME ZONE NOT NULL,
  procedure_name TEXT NOT NULL,
  location TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.surgeries ENABLE ROW LEVEL SECURITY;

-- RLS policies for surgeries
CREATE POLICY "Doctors can view their surgeries"
ON public.surgeries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.id = surgeries.doctor_id
    AND d.user_id = auth.uid()
  )
);

CREATE POLICY "Doctors can manage their surgeries"
ON public.surgeries FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.id = surgeries.doctor_id
    AND d.user_id = auth.uid()
  )
);

CREATE POLICY "Patients can view their surgeries"
ON public.surgeries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = surgeries.patient_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Staff can view practice surgeries"
ON public.surgeries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.doctors d
    JOIN public.staff st ON st.practice_id = (
      SELECT practice_id FROM public.staff WHERE user_id = d.user_id LIMIT 1
    )
    WHERE d.id = surgeries.doctor_id
    AND st.user_id = auth.uid()
    AND st.status = 'active'
  )
);

-- Create checklist templates table for reusable checklist templates
CREATE TABLE public.checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID REFERENCES public.practices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create surgery checklists table (per-surgery instance of a checklist)
CREATE TABLE public.surgery_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surgery_id UUID NOT NULL REFERENCES public.surgeries(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.checklist_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create checklist item completions table
CREATE TABLE public.checklist_item_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES public.surgery_checklists(id) ON DELETE CASCADE,
  item_index INTEGER NOT NULL,
  completed_by UUID REFERENCES auth.users(id),
  completed_by_role TEXT CHECK (completed_by_role IN ('patient', 'staff')),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  UNIQUE(checklist_id, item_index)
);

-- Create pre-op images table
CREATE TABLE public.preop_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surgery_id UUID NOT NULL REFERENCES public.surgeries(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surgery_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_item_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preop_images ENABLE ROW LEVEL SECURITY;

-- RLS policies for checklist_templates
CREATE POLICY "Practice staff can view checklist templates"
ON public.checklist_templates FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.staff 
    WHERE staff.user_id = auth.uid() 
    AND staff.practice_id = checklist_templates.practice_id
    AND staff.status = 'active'
  )
);

CREATE POLICY "Practice admins can manage checklist templates"
ON public.checklist_templates FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.staff 
    WHERE staff.user_id = auth.uid() 
    AND staff.practice_id = checklist_templates.practice_id
    AND staff.role IN ('admin', 'doctor')
    AND staff.status = 'active'
  )
);

-- RLS policies for surgery_checklists
CREATE POLICY "Practice staff can view surgery checklists"
ON public.surgery_checklists FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.surgeries s
    JOIN public.doctors d ON s.doctor_id = d.id
    JOIN public.staff st ON st.practice_id = (
      SELECT practice_id FROM public.staff WHERE user_id = d.user_id LIMIT 1
    )
    WHERE s.id = surgery_checklists.surgery_id
    AND st.user_id = auth.uid()
    AND st.status = 'active'
  )
);

CREATE POLICY "Practice staff can manage surgery checklists"
ON public.surgery_checklists FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.surgeries s
    JOIN public.doctors d ON s.doctor_id = d.id
    JOIN public.staff st ON st.practice_id = (
      SELECT practice_id FROM public.staff WHERE user_id = d.user_id LIMIT 1
    )
    WHERE s.id = surgery_checklists.surgery_id
    AND st.user_id = auth.uid()
    AND st.status = 'active'
  )
);

CREATE POLICY "Patients can view their surgery checklists"
ON public.surgery_checklists FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.surgeries s
    JOIN public.patients p ON s.patient_id = p.id
    WHERE s.id = surgery_checklists.surgery_id
    AND p.user_id = auth.uid()
  )
);

-- RLS policies for checklist_item_completions
CREATE POLICY "Staff can manage checklist completions"
ON public.checklist_item_completions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.surgery_checklists sc
    JOIN public.surgeries s ON sc.surgery_id = s.id
    JOIN public.doctors d ON s.doctor_id = d.id
    JOIN public.staff st ON st.practice_id = (
      SELECT practice_id FROM public.staff WHERE user_id = d.user_id LIMIT 1
    )
    WHERE sc.id = checklist_item_completions.checklist_id
    AND st.user_id = auth.uid()
    AND st.status = 'active'
  )
);

CREATE POLICY "Patients can complete their checklist items"
ON public.checklist_item_completions FOR INSERT
WITH CHECK (
  completed_by_role = 'patient' AND
  completed_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.surgery_checklists sc
    JOIN public.surgeries s ON sc.surgery_id = s.id
    JOIN public.patients p ON s.patient_id = p.id
    WHERE sc.id = checklist_item_completions.checklist_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Patients can view their checklist completions"
ON public.checklist_item_completions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.surgery_checklists sc
    JOIN public.surgeries s ON sc.surgery_id = s.id
    JOIN public.patients p ON s.patient_id = p.id
    WHERE sc.id = checklist_item_completions.checklist_id
    AND p.user_id = auth.uid()
  )
);

-- RLS policies for preop_images (staff only)
CREATE POLICY "Staff can view preop images"
ON public.preop_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.surgeries s
    JOIN public.doctors d ON s.doctor_id = d.id
    JOIN public.staff st ON st.practice_id = (
      SELECT practice_id FROM public.staff WHERE user_id = d.user_id LIMIT 1
    )
    WHERE s.id = preop_images.surgery_id
    AND st.user_id = auth.uid()
    AND st.status = 'active'
  )
);

CREATE POLICY "Staff can upload preop images"
ON public.preop_images FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.surgeries s
    JOIN public.doctors d ON s.doctor_id = d.id
    JOIN public.staff st ON st.practice_id = (
      SELECT practice_id FROM public.staff WHERE user_id = d.user_id LIMIT 1
    )
    WHERE s.id = preop_images.surgery_id
    AND st.user_id = auth.uid()
    AND st.status = 'active'
  )
);

CREATE POLICY "Staff can delete preop images"
ON public.preop_images FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.surgeries s
    JOIN public.doctors d ON s.doctor_id = d.id
    JOIN public.staff st ON st.practice_id = (
      SELECT practice_id FROM public.staff WHERE user_id = d.user_id LIMIT 1
    )
    WHERE s.id = preop_images.surgery_id
    AND st.user_id = auth.uid()
    AND st.status = 'active'
  )
);

-- Create preop-images storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('preop-images', 'preop-images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for preop-images bucket
CREATE POLICY "Staff can upload preop images to storage"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'preop-images' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Staff can view preop images in storage"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'preop-images' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Staff can delete preop images from storage"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'preop-images' AND
  auth.uid() IS NOT NULL
);

-- Add triggers for updated_at
CREATE TRIGGER update_surgeries_updated_at
BEFORE UPDATE ON public.surgeries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checklist_templates_updated_at
BEFORE UPDATE ON public.checklist_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_surgery_checklists_updated_at
BEFORE UPDATE ON public.surgery_checklists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();