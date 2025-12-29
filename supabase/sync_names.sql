-- Sync name and full_name columns to reduce confusion
-- 1. If name is null but full_name exists, copy full_name to name
UPDATE public.profiles
SET name = full_name
WHERE name IS NULL AND full_name IS NOT NULL;

-- 2. If full_name is null but name exists, copy name to full_name
UPDATE public.profiles
SET full_name = name
WHERE full_name IS NULL AND name IS NOT NULL;
