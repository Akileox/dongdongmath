-- Ensure all Exam-related tables exist and defined correctly

-- 1. Exams Table
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    exam_date DATE,
    grade TEXT,
    subject TEXT,
    difficulty TEXT,
    max_score INTEGER,
    min_score INTEGER,
    average_score NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Exam Questions Table
CREATE TABLE IF NOT EXISTS public.exam_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    correct_answer TEXT,
    score_value INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Exam Results Table
CREATE TABLE IF NOT EXISTS public.exam_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies

-- Enable RLS
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- Exams: Read for all, Manage for Admin
DROP POLICY IF EXISTS "Anyone can view exams" ON public.exams;
CREATE POLICY "Anyone can view exams" ON public.exams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage exams" ON public.exams;
CREATE POLICY "Admins can manage exams" ON public.exams FOR ALL USING (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
);

-- Exam Questions: Read for all, Manage for Admin
DROP POLICY IF EXISTS "Anyone can view exam questions" ON public.exam_questions;
CREATE POLICY "Anyone can view exam questions" ON public.exam_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage exam questions" ON public.exam_questions;
CREATE POLICY "Admins can manage exam questions" ON public.exam_questions FOR ALL USING (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
);

-- Exam Results: Student view own, Admin manage all
DROP POLICY IF EXISTS "Students can view own results" ON public.exam_results;
CREATE POLICY "Students can view own results" ON public.exam_results FOR SELECT USING (
  auth.uid() = student_id
);

DROP POLICY IF EXISTS "Admins can manage exam results" ON public.exam_results;
CREATE POLICY "Admins can manage exam results" ON public.exam_results FOR ALL USING (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
);
