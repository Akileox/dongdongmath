-- Migration: Optimize DB (Fix RLS warnings, consolidates policies)
-- Target Tables: assignments, assignment_submissions, learning_logs, profiles

-- [ASSIGNMENTS]
DROP POLICY IF EXISTS "assignments_read_all" ON public.assignments;
DROP POLICY IF EXISTS "assignments_write_staff" ON public.assignments;
-- Drop potential legacy names
DROP POLICY IF EXISTS "Public Read Assignments" ON public.assignments;
DROP POLICY IF EXISTS "Staff Manage Assignments" ON public.assignments;

CREATE POLICY "assignments_read_all" ON public.assignments FOR SELECT USING (true);
CREATE POLICY "assignments_write_staff" ON public.assignments FOR ALL USING (
    (select public.get_my_role()) IN ('admin', 'assistant')
);

-- [ASSIGNMENT SUBMISSIONS]
DROP POLICY IF EXISTS "submissions_read_own_staff" ON public.assignment_submissions;
DROP POLICY IF EXISTS "submissions_insert_staff" ON public.assignment_submissions;
DROP POLICY IF EXISTS "submissions_update_own_staff" ON public.assignment_submissions;
DROP POLICY IF EXISTS "submissions_delete_staff" ON public.assignment_submissions;
-- legacy
DROP POLICY IF EXISTS "Staff Manage Submissions" ON public.assignment_submissions;

CREATE POLICY "submissions_read_own_staff" ON public.assignment_submissions FOR SELECT USING (
    ((select auth.uid()) = student_id) OR
    ((select public.get_my_role()) IN ('admin', 'assistant'))
);
CREATE POLICY "submissions_insert_staff" ON public.assignment_submissions FOR INSERT WITH CHECK (
    (select public.get_my_role()) IN ('admin', 'assistant')
);
CREATE POLICY "submissions_update_own_staff" ON public.assignment_submissions FOR UPDATE USING (
    ((select auth.uid()) = student_id) OR
    ((select public.get_my_role()) IN ('admin', 'assistant'))
);
CREATE POLICY "submissions_delete_staff" ON public.assignment_submissions FOR DELETE USING (
    (select public.get_my_role()) IN ('admin', 'assistant')
);

-- [LEARNING LOGS]
DROP POLICY IF EXISTS "Admins and Assistants can manage learning_logs" ON public.learning_logs;
DROP POLICY IF EXISTS "Students can view logs for their sections" ON public.learning_logs;
-- legacy/duplicates
DROP POLICY IF EXISTS "learning_logs_read_own" ON public.learning_logs;
DROP POLICY IF EXISTS "learning_logs_write_staff" ON public.learning_logs;

-- Re-create with better names and logic
CREATE POLICY "learning_logs_read_unified" ON public.learning_logs FOR SELECT USING (
    -- Admin/Assistant
    ((select public.get_my_role()) IN ('admin', 'assistant')) OR
    -- Student (linked via section)
    EXISTS (
        SELECT 1 FROM public.lecture_assignments la
        JOIN public.lectures l ON la.lecture_id = l.id
        WHERE la.student_id = auth.uid()
        AND l.section = learning_logs.section_name
    )
);

CREATE POLICY "learning_logs_write_staff" ON public.learning_logs FOR ALL USING (
    (select public.get_my_role()) IN ('admin', 'assistant')
);

-- [PROFILES]
-- Security Final handled this, but user still sees warnings.
-- Let's explicitly DROP everything again and re-apply strict ones.
DROP POLICY IF EXISTS "profile_read_all" ON public.profiles;
DROP POLICY IF EXISTS "profile_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profile_update_unified" ON public.profiles;
DROP POLICY IF EXISTS "profile_delete_admin" ON public.profiles;
DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users Update Own Profile" ON public.profiles;

CREATE POLICY "profile_read_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profile_insert_own" ON public.profiles FOR INSERT WITH CHECK ((select auth.uid()) = id);
CREATE POLICY "profile_update_unified" ON public.profiles FOR UPDATE USING (
  ((select auth.uid()) = id) OR 
  ((select public.get_my_role()) IN ('admin', 'assistant'))
);
CREATE POLICY "profile_delete_admin" ON public.profiles FOR DELETE USING ((select public.get_my_role()) = 'admin');

-- [INDEXES]
-- Add missing indexes for foreign keys if any
CREATE INDEX IF NOT EXISTS idx_learning_logs_section_name ON public.learning_logs(section_name);
CREATE INDEX IF NOT EXISTS idx_learning_logs_log_date ON public.learning_logs(log_date);
