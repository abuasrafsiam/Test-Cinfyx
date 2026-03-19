
-- Hero items table (independent from movies)
CREATE TABLE public.hero_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_url text DEFAULT '',
  title text DEFAULT '',
  description text DEFAULT '',
  backdrop_url text DEFAULT '',
  start_time timestamptz DEFAULT NULL,
  end_time timestamptz DEFAULT NULL,
  priority integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hero_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on hero_items" ON public.hero_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert on hero_items" ON public.hero_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update on hero_items" ON public.hero_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete on hero_items" ON public.hero_items FOR DELETE TO anon, authenticated USING (true);

-- Add targeting columns to announcements
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS target_type text NOT NULL DEFAULT 'all';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS target_value text DEFAULT '';
