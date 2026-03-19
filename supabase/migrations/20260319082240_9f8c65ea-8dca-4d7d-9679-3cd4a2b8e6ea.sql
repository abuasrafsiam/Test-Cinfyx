
-- Announcements table for notification/popup system
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  link text DEFAULT '',
  expires_at timestamp with time zone,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on announcements" ON public.announcements FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert on announcements" ON public.announcements FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update on announcements" ON public.announcements FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete on announcements" ON public.announcements FOR DELETE TO anon, authenticated USING (true);

-- Play events table for analytics
CREATE TABLE public.play_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id uuid REFERENCES public.movies(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.play_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on play_events" ON public.play_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public read on play_events" ON public.play_events FOR SELECT TO anon, authenticated USING (true);
