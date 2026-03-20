import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShow, useSeasons, useEpisodes, type Season } from "@/hooks/useShows";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { fetchTMDBShowTrailer } from "@/hooks/useTMDBShows";
import { supabase } from "@/integrations/supabase/client";

const ShowDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: show, isLoading } = useShow(id!);
  const { data: seasons = [] } = useSeasons(id!);
  const navigate = useNavigate();

  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [firstEpisodeId, setFirstEpisodeId] = useState<string | null>(null);

  // Auto-select first season
  useEffect(() => {
    if (seasons.length > 0 && !activeSeason) {
      setActiveSeason(seasons[0]);
    }
  }, [seasons, activeSeason]);

  // Fetch trailer
  useEffect(() => {
    if (show?.tmdb_id) {
      fetchTMDBShowTrailer(show.tmdb_id).then(setTrailerKey).catch(() => {});
    }
  }, [show?.tmdb_id]);

  // Find first episode (S1E1) for the play button
  useEffect(() => {
    if (seasons.length === 0) return;
    const s1 = seasons[0];
    supabase
      .from("episodes")
      .select("id, video_url")
      .eq("season_id", s1.id)
      .order("episode_number", { ascending: true })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0 && data[0].video_url) {
          setFirstEpisodeId(data[0].id);
        }
      });
  }, [seasons]);

  const { data: episodes = [] } = useEpisodes(activeSeason?.id || "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="w-full aspect-video" />
        <div className="p-5 space-y-3">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Show not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero */}
      <div className="relative w-full aspect-video overflow-hidden">
        {trailerKey ? (
          <iframe
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&loop=1&playlist=${trailerKey}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&disablekb=1&fs=0`}
            className={`absolute inset-0 w-full h-full border-0 scale-[1.2] origin-center pointer-events-none transition-opacity duration-700 ${iframeLoaded ? "opacity-100" : "opacity-0"}`}
            allow="autoplay; encrypted-media"
            onLoad={() => setIframeLoaded(true)}
          />
        ) : show.backdrop_url ? (
          <img
            src={show.backdrop_url}
            alt={show.title}
            className={`w-full h-full object-cover transition-opacity duration-700 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setImageLoaded(true)}
          />
        ) : (
          <div className="w-full h-full bg-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent pointer-events-none" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-background/60 backdrop-blur-md flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
      </div>

      <div className="px-5 -mt-8 relative z-10">
        {/* Title + poster */}
        <div className="flex gap-4 items-end">
          {show.poster_url && (
            <img src={show.poster_url} alt={show.title} className="w-24 h-36 rounded-2xl object-cover shadow-2xl shrink-0 border-2 border-secondary" />
          )}
          <div className="pb-1 min-w-0 flex-1">
            <h1 className="text-xl font-bold text-foreground leading-tight">{show.title}</h1>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {show.release_year && (
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg">
              <Calendar className="w-3 h-3" />{show.release_year}
            </span>
          )}
          {show.genre && (
            <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg">{show.genre}</span>
          )}
          <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg">{seasons.length} Seasons</span>
        </div>

        {/* Play S1E1 button */}
        {firstEpisodeId && (
          <Button
            onClick={() => navigate(`/watch/episode/${firstEpisodeId}`)}
            className="w-full mt-5 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-2xl h-13 text-base font-semibold shadow-lg shadow-primary/20"
          >
            <Play className="w-5 h-5 fill-current" />
            Play S1 E1
          </Button>
        )}

        {/* Description */}
        <p className="text-sm text-foreground/70 mt-4 leading-relaxed">{show.description}</p>

        {/* Season pills */}
        {seasons.length > 0 && (
          <div className="mt-5">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {seasons.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSeason(s)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    activeSeason?.id === s.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  S{s.season_number}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Episodes – compact list */}
        <div className="mt-3 divide-y divide-border/30">
          {episodes.map((ep) => (
            <button
              key={ep.id}
              onClick={() => ep.video_url && navigate(`/watch/episode/${ep.id}`)}
              disabled={!ep.video_url}
              className={`w-full flex items-center justify-between py-3 px-1 text-left transition-colors ${
                ep.video_url
                  ? "hover:bg-secondary/40 active:bg-secondary/60"
                  : "opacity-35 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-bold text-muted-foreground w-6 text-center shrink-0">{ep.episode_number}</span>
                <span className="text-sm font-medium text-foreground truncate">{ep.title}</span>
              </div>
              {ep.video_url && (
                <Play className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-2" />
              )}
            </button>
          ))}
          {episodes.length === 0 && activeSeason && (
            <p className="text-sm text-muted-foreground text-center py-6">No episodes available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShowDetail;
