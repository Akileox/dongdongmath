-- Nuclear Fix for Infinite Recursion on Profiles
-- This script dynamically finds AND DROPS ALL policies on the 'profiles' table.
-- This guarantees that the problematic policy (whatever its name is) gets removed.

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
    END LOOP;
END $$;

-- Now that the table is clean, apply the SAFE policies.

-- 1. Enable RLS (just in case)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Safe Policies

-- VIEW: Everyone can view profiles (no recursion)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING ( true );

-- INSERT: Trigger usually handles this, but allowing self-insert is safe if ID matches
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK ( auth.uid() = id );

-- UPDATE: Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING ( auth.uid() = id );

-- ADMINS: Update/Delete using Metadata (Recursion-Free)
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
