
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS notification_type text NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS image_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS auto_dismiss_seconds integer DEFAULT 0;
