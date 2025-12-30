-- Create Todos Table
create table if not exists public.todos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  content text not null,
  due_date timestamptz,
  is_done boolean default false,
  created_at timestamptz default now()
);

alter table public.todos enable row level security;

drop policy if exists "Users can view their own todos" on public.todos;
create policy "Users can view their own todos"
  on public.todos for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own todos" on public.todos;
create policy "Users can insert their own todos"
  on public.todos for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own todos" on public.todos;
create policy "Users can update their own todos"
  on public.todos for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own todos" on public.todos;
create policy "Users can delete their own todos"
  on public.todos for delete
  using (auth.uid() = user_id);


-- Create Exams Metadata Table
create table if not exists public.exams (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  exam_date date not null,
  total_score integer default 100,
  average_score numeric,
  created_at timestamptz default now()
);

alter table public.exams enable row level security;

drop policy if exists "Everyone can view exams" on public.exams;
create policy "Everyone can view exams" on public.exams for select using (true);

drop policy if exists "Admins can insert exams" on public.exams;
create policy "Admins can insert exams" on public.exams for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Create Exam Results Table
create table if not exists public.exam_results (
  id uuid default gen_random_uuid() primary key,
  exam_id uuid references public.exams(id) not null,
  student_id uuid references auth.users(id) not null,
  score integer not null,
  rank integer,
  feedback text,
  created_at timestamptz default now()
);

alter table public.exam_results enable row level security;

drop policy if exists "Users can view their own results" on public.exam_results;
create policy "Users can view their own results"
  on public.exam_results for select
  using (auth.uid() = student_id);

drop policy if exists "Admins can manage results" on public.exam_results;
create policy "Admins can manage results"
  on public.exam_results for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );


-- Create Learning History Table (Simple Tracker)
create table if not exists public.learning_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  lecture_id uuid references public.lectures(id) not null,
  last_watched_at timestamptz default now(),
  unique(user_id, lecture_id)
);

alter table public.learning_history enable row level security;

drop policy if exists "Users can view own history" on public.learning_history;
create policy "Users can view own history" on public.learning_history for select using (auth.uid() = user_id);

drop policy if exists "Users can insert/update own history" on public.learning_history;
create policy "Users can insert/update own history" on public.learning_history for all using (auth.uid() = user_id);

-- Add Parent Phone to Profiles
alter table public.profiles add column if not exists parent_phone text;

-- Update trigger function to include parent_phone
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $function$
begin
  insert into public.profiles (id, full_name, role, grade, school, phone, parent_phone, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'role',
    new.raw_user_meta_data->>'grade',
    new.raw_user_meta_data->>'school',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'parent_phone',
    new.email
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    role = excluded.role,
    grade = excluded.grade,
    school = excluded.school,
    phone = excluded.phone,
    parent_phone = excluded.parent_phone,
    email = excluded.email;
  return new;
end;
$function$;

