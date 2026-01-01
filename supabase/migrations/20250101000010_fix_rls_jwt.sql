-- Fix RLS Policies to use JWT metadata instead of auth.users table
-- This avoids "permission denied" errors and infinite recursion.

-- 1. Lectures: Enable RLS and Fix Policies
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can delete lectures" ON public.lectures;
CREATE POLICY "Admins can delete lectures" ON public.lectures FOR DELETE USING (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
);

DROP POLICY IF EXISTS "Admins can insert lectures" ON public.lectures;
CREATE POLICY "Admins can insert lectures" ON public.lectures FOR INSERT WITH CHECK (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
);

DROP POLICY IF EXISTS "Admins can update lectures" ON public.lectures;
CREATE POLICY "Admins can update lectures" ON public.lectures FOR UPDATE USING (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
);

DROP POLICY IF EXISTS "Everyone can view lectures" ON public.lectures;
CREATE POLICY "Everyone can view lectures" ON public.lectures FOR SELECT USING (true);


-- 2. Profiles: Apply same JWT-based check for safety
-- (We assume the Nuclear Fix was run, but this is a safer version of it)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL USING (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (
  auth.uid() = id
);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (
  auth.uid() = id
);
