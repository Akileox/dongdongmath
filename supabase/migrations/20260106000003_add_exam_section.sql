-- Add section column to exams table
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS section TEXT;

-- Index for performance if filtering by section
CREATE INDEX IF NOT EXISTS idx_exams_section ON public.exams(section);
