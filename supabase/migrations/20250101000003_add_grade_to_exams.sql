-- Add grade to exams table
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS "grade" text;
