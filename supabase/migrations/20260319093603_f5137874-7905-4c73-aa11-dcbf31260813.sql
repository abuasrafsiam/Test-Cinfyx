
CREATE TABLE public.ad_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ads_enabled BOOLEAN NOT NULL DEFAULT false,
  ad_video_url TEXT DEFAULT '',
  midroll_trigger_minutes INTEGER NOT NULL DEFAULT 10,
  skip_after_seconds INTEGER NOT NULL DEFAULT 5,
  max_ads_per_video INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on ad_config" ON public.ad_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert on ad_config" ON public.ad_config FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update on ad_config" ON public.ad_config FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete on ad_config" ON public.ad_config FOR DELETE TO anon, authenticated USING (true);

-- Insert default config row
INSERT INTO public.ad_config (ads_enabled, ad_video_url, midroll_trigger_minutes, skip_after_seconds, max_ads_per_video)
VALUES (false, '', 10, 5, 1);
