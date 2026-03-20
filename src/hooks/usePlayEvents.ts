import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlayStat {
  movie_id: string;
  title: string;
  poster_url: string;
  play_count: number;
}

export function usePlayStats() {
  return useQuery({
    queryKey: ["play-stats"],
    queryFn: async () => {
      // Get all play events
      const { data: events, error: evError } = await supabase
        .from("play_events")
        .select("movie_id, created_at");
      if (evError) throw evError;

      // Get all movies
      const { data: movies, error: mError } = await supabase
        .from("movies")
        .select("id, title, poster_url");
      if (mError) throw mError;

      // Aggregate
      const countMap: Record<string, number> = {};
      (events || []).forEach((e: { movie_id: string }) => {
        countMap[e.movie_id] = (countMap[e.movie_id] || 0) + 1;
      });

      interface MovieData { id: string; title: string; poster_url: string | null }
      const stats: PlayStat[] = (movies || []).map((m: MovieData) => ({
        movie_id: m.id,
        title: m.title,
        poster_url: m.poster_url || "",
        play_count: countMap[m.id] || 0,
      }));

      stats.sort((a, b) => b.play_count - a.play_count);
      return { stats, totalPlays: events?.length || 0, totalMovies: movies?.length || 0 };
    },
  });
}

export async function logPlayEvent(movieId: string) {
  await supabase.from("play_events").insert({ movie_id: movieId });
}
