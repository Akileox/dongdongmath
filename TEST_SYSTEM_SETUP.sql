-- 1. TESTS Table (시험 정보)
create table public.tests (
  id uuid default uuid_generate_v4() primary key,
  title text not null, -- e.g. '2025 12월 4주차 주간테스트'
  date date not null,
  average_score numeric, -- Class Average (optional, can be calculated)
  total_score integer default 100,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TEST_RESULTS Table (학생별 성적)
create table public.test_results (
  id uuid default uuid_generate_v4() primary key,
  test_id uuid references public.tests on delete cascade not null,
  student_id uuid references auth.users on delete cascade not null,
  score numeric not null,
  rank integer,
  comment text, -- Teacher's overall comment for this student
  details jsonb, -- For storing detailed question-by-question results if needed later
                 -- Structure: [{"q": 1, "correct": false, "comment": "Note..."}, ...]
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(test_id, student_id) -- Prevent duplicate entries for same test/student
);

-- 3. RLS Policies
alter table public.tests enable row level security;
alter table public.test_results enable row level security;

-- Tests: Public read (or authenticated read), Admin write
create policy "Read tests" on public.tests for select using (true);
create policy "Admin manage tests" on public.tests for all using (
  auth.uid() in (select id from public.profiles where role = 'admin' or role = 'assistant')
);

-- Results: Users see OWN results, Admin see ALL
create policy "User see own results" on public.test_results for select using (
  auth.uid() = student_id
);
create policy "Admin manage results" on public.test_results for all using (
  auth.uid() in (select id from public.profiles where role = 'admin' or role = 'assistant')
);
