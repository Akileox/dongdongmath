-- Add missing columns to questions table to fix insert error
alter table public.questions 
add column if not exists title text,
add column if not exists lecture_id uuid references public.lectures(id),
add column if not exists timestamp_seconds integer,
add column if not exists ai_draft_answer text;

-- Optional: Add index for faster lookup by lecture
create index if not exists questions_lecture_id_idx on public.questions(lecture_id);
