import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Movie {
  id: string;
  title: string;
  description: string;
  poster_url: string;
  backdrop_url: string;
  video_url: string;
  category: string;
  year: string;
  genre: string;
  featured: boolean;
  created_at: string;
}

export function useMovies() {
  return useQuery({
    queryKey: ["movies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Movie[];
    },
  });
}

export function useMovie(id: string) {
  return useQuery({
    queryKey: ["movie", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Movie;
    },
    enabled: !!id,
  });
}

export function useMoviesByCategory(category: string) {
  return useQuery({
    queryKey: ["movies", category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("category", category)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Movie[];
    },
  });
}

export function useFeaturedMovies() {
  return useQuery({
    queryKey: ["movies", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("featured", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Movie[];
    },
  });
}

export function useSearchMovies(query: string) {
  return useQuery({
    queryKey: ["movies", "search", query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .ilike("title", `%${query}%`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Movie[];
    },
    enabled: query.length > 0,
  });
}
