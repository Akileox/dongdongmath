-- Add current_study column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS current_study TEXT;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
