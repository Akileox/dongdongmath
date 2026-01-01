-- Ensure the trigger function exists (it should, but just in case)
-- (It was defined in 20250101000001_dashboard_features.sql)

-- 1. Create the trigger if it doesn't exist
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Backfill missing profiles for existing users
-- This inserts profiles for any auth.users that don't have a matching profile
insert into public.profiles (id, full_name, role, grade, school, phone, parent_phone, email)
select 
  id,
  raw_user_meta_data->>'full_name',
  coalesce(raw_user_meta_data->>'role', 'student'), -- Default to student if not set
  raw_user_meta_data->>'grade',
  raw_user_meta_data->>'school',
  raw_user_meta_data->>'phone',
  raw_user_meta_data->>'parent_phone',
  email
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;
