-- Create learning_logs table
CREATE TABLE IF NOT EXISTS public.learning_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section_name TEXT NOT NULL,
    log_date DATE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- Add unique constraint to prevent duplicate logs for same section/date
ALTER TABLE public.learning_logs ADD CONSTRAINT learning_logs_section_date_key UNIQUE (section_name, log_date);

-- Enable RLS
ALTER TABLE public.learning_logs ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admin/Assistant can do everything
CREATE POLICY "Admins and Assistants can manage learning_logs" ON public.learning_logs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'assistant')
        )
    );

-- Students can read logs for their sections
-- This requires checking if the student has a lecture with that section name
CREATE POLICY "Students can view logs for their sections" ON public.learning_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.lecture_assignments la
            JOIN public.lectures l ON la.lecture_id = l.id
            WHERE la.student_id = auth.uid()
            AND l.section = learning_logs.section_name
        )
    );
