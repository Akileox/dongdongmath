-- Create a table for public profiles linked to auth.users
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  role text default 'student' check (role in ('student', 'admin', 'assistant')),
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;

-- Create policies for profiles
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- Create a table for lectures
create table lectures (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  youtube_link text not null,
  category text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for lectures
alter table lectures enable row level security;

-- Policies for lectures
create policy "Lectures are viewable by everyone (students)." on lectures for select using (true);
create policy "Only admins can insert lectures." on lectures for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'assistant'))
);
create policy "Only admins can update lectures." on lectures for update using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'assistant'))
);

-- Create a table for questions
create table questions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  lecture_id uuid references lectures(id) on delete cascade,
  content text not null,
  image_url text, -- For dragged & dropped images
  timestamp_seconds integer, -- Video timestamp
  status text default 'pending' check (status in ('pending', 'answered')),
  ai_draft_answer text, -- Hidden draft field
  final_answer text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for questions
alter table questions enable row level security;

-- Policies for questions
create policy "Users can see their own questions." on questions for select using (auth.uid() = user_id);
create policy "Admins/Assistants can see all questions." on questions for select using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'assistant'))
);
create policy "Users can insert their own questions." on questions for insert with check (auth.uid() = user_id);
create policy "Admins/Assistants can update questions (answer)." on questions for update using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'assistant'))
);

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'student');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
