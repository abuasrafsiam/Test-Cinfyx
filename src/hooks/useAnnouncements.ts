import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Announcement {
  id: string;
  title: string;
  message: string;
  link: string;
  expires_at: string | null;
  active: boolean;
  created_at: string;
  target_type: string;
  target_value: string;
  notification_type: string;
  image_url: string;
  scheduled_at: string | null;
  auto_dismiss_seconds: number;
}

export function useAnnouncements() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Announcement[];
    },
  });
}

export function useActiveAnnouncements() {
  return useQuery({
    queryKey: ["announcements", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const now = new Date();
      return (data as Announcement[]).filter((a) => {
        if (a.expires_at && new Date(a.expires_at) < now) return false;
        if (a.scheduled_at && new Date(a.scheduled_at) > now) return false;
        return true;
      });
    },
    refetchInterval: 30000,
  });
}
