-- Migration: Ensure exam_incorrect_answers table and RLS policies

-- 1. Create Table (if not exists)
CREATE TABLE IF NOT EXISTS public.exam_incorrect_answers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    result_id uuid REFERENCES public.exam_results(id) ON DELETE CASCADE,
    question_number integer NOT NULL,
    description text,
    created_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.exam_incorrect_answers ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Drop existing to be safe
DROP POLICY IF EXISTS "incorrect_answers_read_unified" ON public.exam_incorrect_answers;
DROP POLICY IF EXISTS "incorrect_answers_write_staff" ON public.exam_incorrect_answers;

-- Read: Staff, or Student (if they own the result)
CREATE POLICY "incorrect_answers_read_unified" ON public.exam_incorrect_answers FOR SELECT USING (
    (select public.get_my_role()) IN ('admin', 'assistant') OR
    EXISTS (
        SELECT 1 FROM public.exam_results er
        WHERE er.id = exam_incorrect_answers.result_id
        AND er.student_id = auth.uid()
    )
);

-- Write: Staff only
CREATE POLICY "incorrect_answers_write_staff" ON public.exam_incorrect_answers FOR ALL USING (
    (select public.get_my_role()) IN ('admin', 'assistant')
);

-- 4. Index
CREATE INDEX IF NOT EXISTS idx_incorrect_answers_result_id ON public.exam_incorrect_answers(result_id);
