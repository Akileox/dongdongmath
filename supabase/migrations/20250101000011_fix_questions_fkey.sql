-- Fix Foreign Key Constraint on 'questions' table to allow cascading delete of lectures
-- This resolves: update or delete on table "lectures" violates foreign key constraint "questions_lecture_id_fkey" on table "questions"

ALTER TABLE public.questions
DROP CONSTRAINT IF EXISTS questions_lecture_id_fkey;

ALTER TABLE public.questions
ADD CONSTRAINT questions_lecture_id_fkey
FOREIGN KEY (lecture_id)
REFERENCES public.lectures(id)
ON DELETE CASCADE;
