-- Fix exams category check constraint to include new types
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exams_category_check') THEN
        ALTER TABLE public.exams DROP CONSTRAINT exams_category_check;
    END IF;
END $$;

ALTER TABLE public.exams 
ADD CONSTRAINT exams_category_check 
CHECK (category IN ('Daily Test', 'Midterm', 'Final', 'Mock'));
