-- Final Robust Fix for Infinite Recursion on Profiles
-- This script clears all policies on the profiles table (by disabling and re-enabling RLS) 
-- and then re-applies SAFE policies that do not query the profiles table itself.

-- 1. Disable RLS temporarily to clear implicit recursion risk
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop specific known policies in case they persist
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;
-- Drop any potentially lingering default policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.profiles;

-- 3. Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Re-create SAFE Policies
-- SELECT: Everyone can view profiles (simplest, no recursion)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING ( true );

-- INSERT: Users can insert their own profile (trigger handles this mostly, but safe to have)
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK ( auth.uid() = id );

-- UPDATE: Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING ( auth.uid() = id );

-- ADMINS: CRITICAL FIX
-- Use auth.users metadata to check role. This avoids querying database tables.
CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE 
USING ( 
  (select raw_user_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can delete all profiles" 
ON public.profiles FOR DELETE 
USING ( 
  (select raw_user_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin'
);
