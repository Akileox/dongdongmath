-- Add playlist_url to lectures table
ALTER TABLE public.lectures ADD COLUMN IF NOT EXISTS playlist_url text;

-- Create Exam Questions Table
CREATE TABLE IF NOT EXISTS public.exam_questions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id uuid REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  question_number integer NOT NULL,
  correct_answer text,
  score_value integer DEFAULT 0,
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(exam_id, question_number)
);

-- RLS Policies for exam_questions
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view exam questions" ON public.exam_questions;
CREATE POLICY "Everyone can view exam questions" ON public.exam_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage exam questions" ON public.exam_questions;
CREATE POLICY "Admins can manage exam questions" ON public.exam_questions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
