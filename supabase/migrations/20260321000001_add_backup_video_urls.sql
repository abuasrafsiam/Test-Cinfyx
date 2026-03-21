-- Add backup video URLs to movies table
ALTER TABLE public.movies
  ADD COLUMN IF NOT EXISTS video_url_backup_1 TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS video_url_backup_2 TEXT DEFAULT '';

-- Add backup video URLs to episodes table
ALTER TABLE public.episodes
  ADD COLUMN IF NOT EXISTS video_url_backup_1 TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS video_url_backup_2 TEXT DEFAULT '';
