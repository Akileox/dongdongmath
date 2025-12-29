-- Add class_section column for granular student grouping
alter table profiles add column if not exists class_section text;

-- Optional: If we want to migrate existing data or set defaults
-- update profiles set class_section = '미배정' where role = 'student' and class_section is null;
