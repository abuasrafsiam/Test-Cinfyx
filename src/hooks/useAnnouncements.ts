import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Announcement {
  id: string;
  title: string;
  message: string;
  link: string;
  expires_at: string | null;
  active: boolean;
  created_at: string;
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
      // Filter expired client-side
      const now = new Date();
      return (data as Announcement[]).filter(
        (a) => !a.expires_at || new Date(a.expires_at) > now
      );
    },
  });
}
