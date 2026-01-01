-- Fix RLS for exam_questions and exam_results to use JWT role check
-- This avoids any potential recursion or permission issues with profiles

-- Exam Questions
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage exam questions" ON public.exam_questions;
CREATE POLICY "Admins can manage exam questions" ON public.exam_questions FOR ALL USING (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
);

-- Exam Results
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage exam results" ON public.exam_results;
CREATE POLICY "Admins can manage exam results" ON public.exam_results FOR ALL USING (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
);

-- Allow students to view their own results
DROP POLICY IF EXISTS "Students can view own results" ON public.exam_results;
CREATE POLICY "Students can view own results" ON public.exam_results FOR SELECT USING (
  auth.uid() = student_id
);
