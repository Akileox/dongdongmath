-- Ensure Schema: Run this to guarantee all columns exist
-- This is safe to run even if columns already exist.

-- 1. Lectures: Ensure playlist_url exists
ALTER TABLE public.lectures ADD COLUMN IF NOT EXISTS playlist_url text;

-- 2. Exams: Ensure grade and stats columns exist
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS "grade" text;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS max_score integer;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS min_score integer;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS difficulty text;

-- 3. Profiles: Ensure parent_phone exists (just in case)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_phone text;

-- 4. Exam Questions: Ensure table exists (User was worried about this)
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

-- 5. RLS for exam_questions: Ensure policies exist
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exam_questions' AND policyname = 'Everyone can view exam questions') THEN
        CREATE POLICY "Everyone can view exam questions" ON public.exam_questions FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exam_questions' AND policyname = 'Admins can manage exam questions') THEN
        CREATE POLICY "Admins can manage exam questions" ON public.exam_questions FOR ALL USING (
            EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND (auth.users.raw_user_meta_data->>'role')::text = 'admin')
        ); 
    END IF;
END $$;
