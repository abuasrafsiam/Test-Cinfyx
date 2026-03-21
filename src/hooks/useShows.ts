import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Show {
  id: string;
  title: string;
  description: string;
  poster_url: string;
  backdrop_url: string;
  release_year: string;
  genre: string;
  tmdb_id: number | null;
  featured: boolean;
  created_at: string;
}

export interface Season {
  id: string;
  show_id: string;
  season_number: number;
  title: string;
  poster_url: string;
  backdrop_url: string;
  release_year: string;
  created_at: string;
}

export interface Episode {
  id: string;
  season_id: string;
  episode_number: number;
  title: string;
  description: string;
  video_url: string;
  video_url_backup_1?: string;
  video_url_backup_2?: string;
  duration: string;
  thumbnail_url: string;
  created_at: string;
}

export function useShows() {
  return useQuery({
    queryKey: ["shows"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shows")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Show[];
    },
  });
}

export function useShow(id: string) {
  return useQuery({
    queryKey: ["show", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shows")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Show;
    },
    enabled: !!id,
  });
}

export function useSeasons(showId: string) {
  return useQuery({
    queryKey: ["seasons", showId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .eq("show_id", showId)
        .order("season_number", { ascending: true });
      if (error) throw error;
      return data as Season[];
    },
    enabled: !!showId,
  });
}

export function useEpisodes(seasonId: string) {
  return useQuery({
    queryKey: ["episodes", seasonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("season_id", seasonId)
        .order("episode_number", { ascending: true });
      if (error) throw error;
      return data as Episode[];
    },
    enabled: !!seasonId,
  });
}

export function useFeaturedShows() {
  return useQuery({
    queryKey: ["shows", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shows")
        .select("*")
        .eq("featured", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Show[];
    },
  });
}

export function useSearchShows(query: string) {
  return useQuery({
    queryKey: ["shows", "search", query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shows")
        .select("*")
        .ilike("title", `%${query}%`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Show[];
    },
    enabled: query.length > 0,
  });
}
