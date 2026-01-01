-- Enable RLS on lectures if not already enabled
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;

-- Allow Admins to Delete Lectures
DROP POLICY IF EXISTS "Admins can delete lectures" ON public.lectures;
CREATE POLICY "Admins can delete lectures" ON public.lectures FOR DELETE USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND (auth.users.raw_user_meta_data->>'role')::text = 'admin')
);

-- Ensure Admins can also Update/Insert (just in case)
DROP POLICY IF EXISTS "Admins can insert lectures" ON public.lectures;
CREATE POLICY "Admins can insert lectures" ON public.lectures FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND (auth.users.raw_user_meta_data->>'role')::text = 'admin')
);

DROP POLICY IF EXISTS "Admins can update lectures" ON public.lectures;
CREATE POLICY "Admins can update lectures" ON public.lectures FOR UPDATE USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND (auth.users.raw_user_meta_data->>'role')::text = 'admin')
);

-- Ensure Everyone can view (already likely there, but safety first)
DROP POLICY IF EXISTS "Everyone can view lectures" ON public.lectures;
CREATE POLICY "Everyone can view lectures" ON public.lectures FOR SELECT USING (true);
