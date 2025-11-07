-- Add availability status to doctors table
ALTER TABLE public.doctors 
ADD COLUMN availability_status TEXT DEFAULT 'active' CHECK (availability_status IN ('active', 'away'));

-- Add comment for clarity
COMMENT ON COLUMN public.doctors.availability_status IS 'Current availability status set by the doctor: active or away';

-- Enable realtime for doctors table
ALTER PUBLICATION supabase_realtime ADD TABLE doctors;