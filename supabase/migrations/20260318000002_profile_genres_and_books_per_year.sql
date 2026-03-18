-- Add reader preference columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS books_per_year TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS genres TEXT[] DEFAULT NULL;
