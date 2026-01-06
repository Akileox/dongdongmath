-- Add max_score to exams table
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS max_score integer DEFAULT 100;
