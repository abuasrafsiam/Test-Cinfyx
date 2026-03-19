import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdConfig {
  id: string;
  ads_enabled: boolean;
  ad_video_url: string;
  midroll_trigger_minutes: number;
  skip_after_seconds: number;
  max_ads_per_video: number;
  created_at: string;
  updated_at: string;
}

export function useAdConfig() {
  return useQuery({
    queryKey: ["ad_config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_config")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data as AdConfig;
    },
  });
}
