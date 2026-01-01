-- SOLID START: Consolidated Security & Performance Fix
-- Replaces all previous RLS and Indexing migrations from 20250101000017 onwards.
-- GUARANTEED IDEMPOTENT: Can be run multiple times safely.

-- 1. Helper Function to Clean Slate (Drop all policies safely)
CREATE OR REPLACE FUNCTION public.drop_policy_if_exists(table_name_text text, policy_name_text text)
RETURNS void AS $$
BEGIN
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name_text, table_name_text);
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors if policy doesn't exist
    NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Safe Role Check Function (Bypasses RLS recursion)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = auth.uid();
  RETURN v_role;
END;
$$;


-- 3. PERFOMANCE INDEXES (From previous optimization attempts)
DO $$
BEGIN
    -- [Standard Tables]
    CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_id ON public.exam_questions(exam_id);
    CREATE INDEX IF NOT EXISTS idx_exam_results_exam_id ON public.exam_results(exam_id);
    CREATE INDEX IF NOT EXISTS idx_exam_results_student_id ON public.exam_results(student_id);
    CREATE INDEX IF NOT EXISTS idx_lecture_assignments_student_id ON public.lecture_assignments(student_id);
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON public.attendance(user_id);
    END IF;

    -- [Legacy/Optional Tables]
    -- Todo: user_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'todos' AND column_name = 'user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_todos_user_id ON public.todos(user_id);
    END IF;

    -- Learning History: user_id, lecture_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'learning_history' AND column_name = 'user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_learning_history_user_id ON public.learning_history(user_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'learning_history' AND column_name = 'lecture_id') THEN
        CREATE INDEX IF NOT EXISTS idx_learning_history_lecture_id ON public.learning_history(lecture_id);
    END IF;

    -- Test Results: various possible columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'test_results' AND column_name = 'student_id') THEN
        CREATE INDEX IF NOT EXISTS idx_test_results_student_id ON public.test_results(student_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'test_results' AND column_name = 'user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON public.test_results(user_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'test_results' AND column_name = 'test_id') THEN
        CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON public.test_results(test_id);
    END IF;

    -- Questions: test_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'test_id') THEN
        CREATE INDEX IF NOT EXISTS idx_questions_test_id ON public.questions(test_id);
    END IF;

    -- Answers: user_id, question_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'answers' AND column_name = 'user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_answers_user_id ON public.answers(user_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'answers' AND column_name = 'question_id') THEN
        CREATE INDEX IF NOT EXISTS idx_answers_question_id ON public.answers(question_id);
    END IF;
END $$;


-- 4. RLS POLICIES (Strict Separation of SELECT vs WRITE)

-- A. [LECTURES]
SELECT public.drop_policy_if_exists('lectures', 'Public Read Lectures');
SELECT public.drop_policy_if_exists('lectures', 'Admins and Assistants can manage lectures');
SELECT public.drop_policy_if_exists('lectures', 'Staff Manage Lectures');
SELECT public.drop_policy_if_exists('lectures', 'Staff Insert Lectures');
SELECT public.drop_policy_if_exists('lectures', 'Staff Update Lectures');
SELECT public.drop_policy_if_exists('lectures', 'Staff Delete Lectures');
-- Drop self
SELECT public.drop_policy_if_exists('lectures', 'lecture_read_all');
SELECT public.drop_policy_if_exists('lectures', 'lecture_insert_staff');
SELECT public.drop_policy_if_exists('lectures', 'lecture_update_staff');
SELECT public.drop_policy_if_exists('lectures', 'lecture_delete_staff');

CREATE POLICY "lecture_read_all" ON public.lectures FOR SELECT USING (true);
CREATE POLICY "lecture_insert_staff" ON public.lectures FOR INSERT WITH CHECK (
  (select public.get_my_role()) IN ('admin', 'assistant')
);
CREATE POLICY "lecture_update_staff" ON public.lectures FOR UPDATE USING (
  (select public.get_my_role()) IN ('admin', 'assistant')
);
CREATE POLICY "lecture_delete_staff" ON public.lectures FOR DELETE USING (
  (select public.get_my_role()) IN ('admin', 'assistant')
);


-- B. [EXAMS]
SELECT public.drop_policy_if_exists('exams', 'Public Read Exams');
SELECT public.drop_policy_if_exists('exams', 'Staff Manage Exams');
SELECT public.drop_policy_if_exists('exams', 'Admins and Assistants can manage exams');
SELECT public.drop_policy_if_exists('exams', 'Staff Insert Exams');
SELECT public.drop_policy_if_exists('exams', 'Staff Update Exams');
SELECT public.drop_policy_if_exists('exams', 'Staff Delete Exams');
-- Drop self
SELECT public.drop_policy_if_exists('exams', 'exam_read_all');
SELECT public.drop_policy_if_exists('exams', 'exam_insert_staff');
SELECT public.drop_policy_if_exists('exams', 'exam_update_staff');
SELECT public.drop_policy_if_exists('exams', 'exam_delete_staff');

CREATE POLICY "exam_read_all" ON public.exams FOR SELECT USING (true);
CREATE POLICY "exam_insert_staff" ON public.exams FOR INSERT WITH CHECK (
  (select public.get_my_role()) IN ('admin', 'assistant')
);
CREATE POLICY "exam_update_staff" ON public.exams FOR UPDATE USING (
  (select public.get_my_role()) IN ('admin', 'assistant')
);
CREATE POLICY "exam_delete_staff" ON public.exams FOR DELETE USING (
  (select public.get_my_role()) IN ('admin', 'assistant')
);


-- C. [EXAM RESULTS]
SELECT public.drop_policy_if_exists('exam_results', 'Unified Read Exam Results');
SELECT public.drop_policy_if_exists('exam_results', 'Staff Insert Exam Results');
SELECT public.drop_policy_if_exists('exam_results', 'Staff Update Exam Results');
SELECT public.drop_policy_if_exists('exam_results', 'Staff Delete Exam Results');
-- Drop self
SELECT public.drop_policy_if_exists('exam_results', 'exam_result_read');
SELECT public.drop_policy_if_exists('exam_results', 'exam_result_insert_staff');
SELECT public.drop_policy_if_exists('exam_results', 'exam_result_update_staff');
SELECT public.drop_policy_if_exists('exam_results', 'exam_result_delete_staff');

CREATE POLICY "exam_result_read" ON public.exam_results FOR SELECT USING (
  ((select auth.uid()) = student_id) OR 
  (select public.get_my_role()) IN ('admin', 'assistant')
);
CREATE POLICY "exam_result_insert_staff" ON public.exam_results FOR INSERT WITH CHECK (
  (select public.get_my_role()) IN ('admin', 'assistant')
);
CREATE POLICY "exam_result_update_staff" ON public.exam_results FOR UPDATE USING (
  (select public.get_my_role()) IN ('admin', 'assistant')
);
CREATE POLICY "exam_result_delete_staff" ON public.exam_results FOR DELETE USING (
  (select public.get_my_role()) IN ('admin', 'assistant')
);


-- D. [PROFILES]
SELECT public.drop_policy_if_exists('profiles', 'Public Read Profiles');
SELECT public.drop_policy_if_exists('profiles', 'Staff Manage Profiles');
SELECT public.drop_policy_if_exists('profiles', 'Staff Update All Profiles');
SELECT public.drop_policy_if_exists('profiles', 'Users Update Own Profile');
SELECT public.drop_policy_if_exists('profiles', 'Users Insert Own Profile');
SELECT public.drop_policy_if_exists('profiles', 'Admins Delete Profiles');
SELECT public.drop_policy_if_exists('profiles', 'Authenticated Read Profiles');
SELECT public.drop_policy_if_exists('profiles', 'Users update own profile');
SELECT public.drop_policy_if_exists('profiles', 'Admins update all profiles');
-- Drop self
SELECT public.drop_policy_if_exists('profiles', 'profile_read_all');
SELECT public.drop_policy_if_exists('profiles', 'profile_insert_own');
SELECT public.drop_policy_if_exists('profiles', 'profile_update_unified');
SELECT public.drop_policy_if_exists('profiles', 'profile_delete_admin');

CREATE POLICY "profile_read_all" ON public.profiles FOR SELECT USING (true); 
CREATE POLICY "profile_insert_own" ON public.profiles FOR INSERT WITH CHECK ((select auth.uid()) = id);
-- Unified UPDATE Policy (To avoid "Multiple Permissive Policies" warning)
CREATE POLICY "profile_update_unified" ON public.profiles FOR UPDATE USING (
  ((select auth.uid()) = id) OR 
  ((select public.get_my_role()) IN ('admin', 'assistant'))
);
CREATE POLICY "profile_delete_admin" ON public.profiles FOR DELETE USING ((select public.get_my_role()) = 'admin');


-- E. [ATTENDANCE] & [LECTURE ASSIGNMENTS] (Missing from some previous runs, added here for completeness)
-- [ATTENDANCE]
SELECT public.drop_policy_if_exists('attendance', 'Unified Read Attendance');
SELECT public.drop_policy_if_exists('attendance', 'Staff Insert Attendance');
SELECT public.drop_policy_if_exists('attendance', 'Staff Update Attendance');
SELECT public.drop_policy_if_exists('attendance', 'Staff Delete Attendance');
-- Drop self
SELECT public.drop_policy_if_exists('attendance', 'attendance_read_unified');
SELECT public.drop_policy_if_exists('attendance', 'attendance_insert_staff');
SELECT public.drop_policy_if_exists('attendance', 'attendance_update_staff');
SELECT public.drop_policy_if_exists('attendance', 'attendance_delete_staff');

CREATE POLICY "attendance_read_unified" ON public.attendance FOR SELECT USING (
  ((select auth.uid()) = user_id) OR
  (select public.get_my_role()) IN ('admin', 'assistant')
);
CREATE POLICY "attendance_insert_staff" ON public.attendance FOR INSERT WITH CHECK (
  (select public.get_my_role()) IN ('admin', 'assistant')
);
CREATE POLICY "attendance_update_staff" ON public.attendance FOR UPDATE USING (
  (select public.get_my_role()) IN ('admin', 'assistant')
);
CREATE POLICY "attendance_delete_staff" ON public.attendance FOR DELETE USING (
  (select public.get_my_role()) IN ('admin', 'assistant')
);


-- [LECTURE ASSIGNMENTS]
SELECT public.drop_policy_if_exists('lecture_assignments', 'Unified Read Lecture Assignments');
SELECT public.drop_policy_if_exists('lecture_assignments', 'Staff Insert Lecture Assignments');
SELECT public.drop_policy_if_exists('lecture_assignments', 'Staff Update Lecture Assignments');
SELECT public.drop_policy_if_exists('lecture_assignments', 'Staff Delete Lecture Assignments');
-- Drop self
SELECT public.drop_policy_if_exists('lecture_assignments', 'assignment_read_unified');
SELECT public.drop_policy_if_exists('lecture_assignments', 'assignment_insert_staff');
SELECT public.drop_policy_if_exists('lecture_assignments', 'assignment_update_staff');
SELECT public.drop_policy_if_exists('lecture_assignments', 'assignment_delete_staff');

CREATE POLICY "assignment_read_unified" ON public.lecture_assignments FOR SELECT USING (
  ((select auth.uid()) = student_id) OR
  (select public.get_my_role()) IN ('admin', 'assistant')
);
CREATE POLICY "assignment_insert_staff" ON public.lecture_assignments FOR INSERT WITH CHECK (
  (select public.get_my_role()) IN ('admin', 'assistant')
);
CREATE POLICY "assignment_update_staff" ON public.lecture_assignments FOR UPDATE USING (
  (select public.get_my_role()) IN ('admin', 'assistant')
);
CREATE POLICY "assignment_delete_staff" ON public.lecture_assignments FOR DELETE USING (
  (select public.get_my_role()) IN ('admin', 'assistant')
);


-- F. [LEGACY TABLES: TEST_RESULTS, ANSWERS, TESTS, TODOS]
DO $$
BEGIN
    -- [TESTS]
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tests') THEN
        PERFORM public.drop_policy_if_exists('tests', 'Public Read Tests');
        PERFORM public.drop_policy_if_exists('tests', 'Staff Manage Tests');
        PERFORM public.drop_policy_if_exists('tests', 'tests_read_all');
        PERFORM public.drop_policy_if_exists('tests', 'tests_write_staff');
        PERFORM public.drop_policy_if_exists('tests', 'tests_update_staff');
        PERFORM public.drop_policy_if_exists('tests', 'tests_delete_staff');
        
        -- Read
        CREATE POLICY "tests_read_all" ON public.tests FOR SELECT USING (true);
        -- Write
        CREATE POLICY "tests_write_staff" ON public.tests FOR INSERT WITH CHECK ((select public.get_my_role()) IN ('admin', 'assistant'));
        CREATE POLICY "tests_update_staff" ON public.tests FOR UPDATE USING ((select public.get_my_role()) IN ('admin', 'assistant'));
        CREATE POLICY "tests_delete_staff" ON public.tests FOR DELETE USING ((select public.get_my_role()) IN ('admin', 'assistant'));
    END IF;

    -- [ANSWERS]
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'answers') THEN
        PERFORM public.drop_policy_if_exists('answers', 'Staff Manage Answers');
        PERFORM public.drop_policy_if_exists('answers', 'Users View Own Answers');
        PERFORM public.drop_policy_if_exists('answers', 'Users Insert Own Answers');
        PERFORM public.drop_policy_if_exists('answers', 'answers_read_all_staff');
        PERFORM public.drop_policy_if_exists('answers', 'answers_read_staff');
        PERFORM public.drop_policy_if_exists('answers', 'answers_read_own');
        PERFORM public.drop_policy_if_exists('answers', 'answers_insert_own');
        
        -- Read
        CREATE POLICY "answers_read_staff" ON public.answers FOR SELECT USING ((select public.get_my_role()) IN ('admin', 'assistant'));
        -- Check for user_id/student_id for User Read
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='answers' AND column_name='user_id') THEN
             CREATE POLICY "answers_read_own" ON public.answers FOR SELECT USING ((select auth.uid()) = user_id);
             CREATE POLICY "answers_insert_own" ON public.answers FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
        END IF;
    END IF;

    -- [TODOS]
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'todos') THEN
        PERFORM public.drop_policy_if_exists('todos', 'Users can manage own todos');
        DROP POLICY IF EXISTS "Users can view their own todos" ON public.todos;
        PERFORM public.drop_policy_if_exists('todos', 'todos_read_own');
        PERFORM public.drop_policy_if_exists('todos', 'todos_insert_own');
        PERFORM public.drop_policy_if_exists('todos', 'todos_update_own');
        PERFORM public.drop_policy_if_exists('todos', 'todos_delete_own');
        
        -- Read
        CREATE POLICY "todos_read_own" ON public.todos FOR SELECT USING ((select auth.uid()) = user_id);
        -- Write
        CREATE POLICY "todos_insert_own" ON public.todos FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
        CREATE POLICY "todos_update_own" ON public.todos FOR UPDATE USING ((select auth.uid()) = user_id);
        CREATE POLICY "todos_delete_own" ON public.todos FOR DELETE USING ((select auth.uid()) = user_id);
    END IF;

END $$;


-- 5. Clean up Helper Function
DROP FUNCTION public.drop_policy_if_exists;
