-- Migration: Assignments & Exam Refinements
-- 1. Update Exams Table (Category)
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS category text DEFAULT 'Daily Test';

-- 2. Create Assignments Table
CREATE TABLE IF NOT EXISTS public.assignments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lecture_id uuid REFERENCES public.lectures(id) ON DELETE SET NULL, -- Optional link to lecture
    title text NOT NULL,
    description text,
    due_date timestamptz,
    created_at timestamptz DEFAULT now()
);

-- 3. Create Assignment Submissions Table (Links students to assignments)
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    status text DEFAULT 'pending', -- pending, submitted, graded
    grade text, -- Score or A/B/C
    feedback text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. Automation: Trigger to create Todo on Assignment Assignment
CREATE OR REPLACE FUNCTION public.handle_new_assignment_submission()
RETURNS TRIGGER AS $$
DECLARE
    v_title text;
BEGIN
    -- Get assignment title
    SELECT title INTO v_title FROM public.assignments WHERE id = NEW.assignment_id;
    
    -- Insert Todo
    INSERT INTO public.todos (user_id, content, is_done)
    VALUES (NEW.student_id, '[과제] ' || v_title, false);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_assignment_assigned ON public.assignment_submissions;
CREATE TRIGGER on_assignment_assigned
    AFTER INSERT ON public.assignment_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_assignment_submission();


-- 5. RLS Policies (Strict)

-- [Assignments]
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Read: Authenticated (Users see assignments)
-- Actually, students only need to see assignments they are submitted to? 
-- Or they can see all assignments? Let's say all for simplicity or linked via submissions.
-- Admin needs to see all.
create policy "assignments_read_all" on public.assignments for select using (true);

-- Write: Staff only
create policy "assignments_write_staff" on public.assignments for all using (
    (select public.get_my_role()) IN ('admin', 'assistant')
);


-- [Assignment Submissions]
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Read: Own + Staff
create policy "submissions_read_own_staff" on public.assignment_submissions for select using (
    ((select auth.uid()) = student_id) OR
    ((select public.get_my_role()) IN ('admin', 'assistant'))
);

-- Insert: Staff only (Assigning)
-- Students usually don't create the submission record, the admin does.
create policy "submissions_insert_staff" on public.assignment_submissions for insert with check (
    (select public.get_my_role()) IN ('admin', 'assistant')
);

-- Update: Own (Submit) + Staff (Grade)
create policy "submissions_update_own_staff" on public.assignment_submissions for update using (
    ((select auth.uid()) = student_id) OR
    ((select public.get_my_role()) IN ('admin', 'assistant'))
);

-- Delete: Staff only
create policy "submissions_delete_staff" on public.assignment_submissions for delete using (
    (select public.get_my_role()) IN ('admin', 'assistant')
);


-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_assignments_lecture_id ON public.assignments(lecture_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON public.assignment_submissions(student_id);
