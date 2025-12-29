-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  role text default 'student'::text,
  phone text,
  grade text,
  school text,
  class_section text,
  current_study text, -- Added for study tracking
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- WORK SHIFTS Table (for Assistant Schedule)
create table if not exists public.work_shifts (
    id uuid default gen_random_uuid() primary key,
    category text not null,
    label text,
    time_range text,
    assigned_names text[] default '{}',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on work_shifts
alter table public.work_shifts enable row level security;

-- TRIGGER: Handling New User
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, phone, grade, school)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'grade',
    new.raw_user_meta_data->>'school'
  )
  on conflict (id) do update
  set
    role = excluded.role,
    full_name = excluded.full_name;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger creation (only if not exists - tricky in pure SQL without PL/pgSQL block, but standard simplified version)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- RLS POLICIES (Consolidated)

-- Profiles: Allow read for everyone (e.g. for student list) - In prod this should be tighter but for this app requirements:
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

-- Profiles: Allow update by users themselves OR by Admins/Assistants
-- Note: 'admin' role check via auth.jwt() usually requires custom claims or a look up. 
-- Simplified: users can update own profile. Frontend admin uses Service Role Key for critical updates.
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Work Shifts: Public read, Admin write (Simplified to allow all for now as requested or implied by previous scripts)
create policy "Allow all access to work_shifts"
on public.work_shifts for all using (true);
