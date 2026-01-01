-- Fix RLS: Infinite Recursion on Profiles
-- The issue is that checking "is admin" by querying the profiles table *while* trying to read the profiles table causes a loop.
-- We fix this by efficiently checking the 'role' from auth.users metadata, or by ensuring the policy doesn't self-reference in a blocking way.
-- However, since 'role' is synced to profiles, the most robust way without recursion is to trust auth.jwt() claiming the role (if using custom claims) OR query auth.users metadata.

-- Strategy: Use auth.users metadata for admin checks in RLS policies on the profiles table.

-- 1. Drop existing problematic policies on specific tables if they exist (clean slate approach for these specific policies)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;

-- 2. Re-create Safe Policies

-- Anyone can view profiles (needed for leaderboards, etc. - or restrict to authenticated)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING ( true );

-- Users can insert their own profile (usually handled by trigger, but good to have)
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK ( auth.uid() = id );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING ( auth.uid() = id );

-- Admins can update/delete any profile
-- CRITICAL FIX: Instead of querying public.profiles, we query auth.users metadata to avoid recursion.
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

-- Note: We don't need a special "Admins can view" policy because "everyone" (true) covers it for SELECT.
