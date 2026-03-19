import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HeroItem {
  id: string;
  video_url: string;
  title: string;
  description: string;
  backdrop_url: string;
  start_time: string | null;
  end_time: string | null;
  priority: number;
  active: boolean;
  created_at: string;
}

export function useHeroItems() {
  return useQuery({
    queryKey: ["hero_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_items")
        .select("*")
        .order("priority", { ascending: false });
      if (error) throw error;
      return data as HeroItem[];
    },
  });
}

export function useActiveHeroItems() {
  return useQuery({
    queryKey: ["hero_items", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_items")
        .select("*")
        .eq("active", true)
        .order("priority", { ascending: false });
      if (error) throw error;
      const now = new Date();
      return (data as HeroItem[]).filter((h) => {
        if (h.start_time && new Date(h.start_time) > now) return false;
        if (h.end_time && new Date(h.end_time) < now) return false;
        return true;
      });
    },
  });
}
