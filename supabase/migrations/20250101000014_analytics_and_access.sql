-- 1. Add 'grade' column to lectures table
ALTER TABLE public.lectures ADD COLUMN IF NOT EXISTS grade text;

-- 2. Add 'details' JSONB column to exam_results table
-- Stores detailed question results like { "question_id": { "is_correct": true, "answer": "3" } }
ALTER TABLE public.exam_results ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;

-- 3. Create 'attendance' table
DROP TABLE IF EXISTS public.attendance CASCADE;
CREATE TABLE public.attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date)
);

-- 4. Create 'lecture_assignments' table for specific access control
DROP TABLE IF EXISTS public.lecture_assignments CASCADE;
CREATE TABLE public.lecture_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lecture_id UUID REFERENCES public.lectures(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(lecture_id, student_id)
);

-- 5. RLS Policies

-- Attendance RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage attendance" ON public.attendance;
CREATE POLICY "Admins can manage attendance" ON public.attendance FOR ALL USING (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
);

DROP POLICY IF EXISTS "Students can view own attendance" ON public.attendance;
CREATE POLICY "Students can view own attendance" ON public.attendance FOR SELECT USING (
  auth.uid() = user_id
);

-- Lecture Assignments RLS
ALTER TABLE public.lecture_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage lecture assignments" ON public.lecture_assignments;
CREATE POLICY "Admins can manage lecture assignments" ON public.lecture_assignments FOR ALL USING (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
);

DROP POLICY IF EXISTS "Students can view own assignments" ON public.lecture_assignments;
CREATE POLICY "Students can view own assignments" ON public.lecture_assignments FOR SELECT USING (
  auth.uid() = student_id
);

-- Update Lecture Visibility Policy (if it allows filtering by assignment)
-- Note: 'lectures' usually has a public read policy. If we want to restrict it, we need to change it.
-- For now, we will keep lectures public read, but frontend filters it.
-- If strict security is needed, we would update the policy. 
-- Let's stick to frontend filtering for now as per "like test assignment" request which implies visibility/recommendation logic.
-- However, if user wants STRICT access control, we should update the policy. 
-- For now, let's just enable the tables.
