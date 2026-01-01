-- Add stats columns to exams table
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS max_score integer;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS min_score integer;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS difficulty text;
