-- Add current_study column to profiles
alter table profiles add column if not exists current_study text;
