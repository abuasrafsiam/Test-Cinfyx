
-- Shows table
CREATE TABLE public.shows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  poster_url TEXT DEFAULT '',
  backdrop_url TEXT DEFAULT '',
  release_year TEXT DEFAULT '',
  genre TEXT DEFAULT '',
  tmdb_id INTEGER,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on shows" ON public.shows FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert on shows" ON public.shows FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update on shows" ON public.shows FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete on shows" ON public.shows FOR DELETE TO anon, authenticated USING (true);

-- Seasons table
CREATE TABLE public.seasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL DEFAULT 1,
  title TEXT DEFAULT '',
  poster_url TEXT DEFAULT '',
  backdrop_url TEXT DEFAULT '',
  release_year TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on seasons" ON public.seasons FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert on seasons" ON public.seasons FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update on seasons" ON public.seasons FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete on seasons" ON public.seasons FOR DELETE TO anon, authenticated USING (true);

-- Episodes table
CREATE TABLE public.episodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  episode_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  video_url TEXT DEFAULT '',
  duration TEXT DEFAULT '',
  thumbnail_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on episodes" ON public.episodes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert on episodes" ON public.episodes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update on episodes" ON public.episodes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete on episodes" ON public.episodes FOR DELETE TO anon, authenticated USING (true);
