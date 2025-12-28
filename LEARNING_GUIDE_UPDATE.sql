-- Add learning_guide column to lectures table
alter table public.lectures 
add column if not exists learning_guide text;

-- Optional: Add materials_link column for future use
alter table public.lectures
add column if not exists materials_link text;
