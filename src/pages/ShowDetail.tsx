import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Star, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShow, useSeasons, useEpisodes, type Season } from "@/hooks/useShows";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { fetchTMDBShowById, fetchTMDBShowTrailer } from "@/hooks/useTMDBShows";

const ShowDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: show, isLoading } = useShow(id!);
  const { data: seasons = [] } = useSeasons(id!);
  const navigate = useNavigate();

  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Auto-select first season
  useEffect(() => {
    if (seasons.length > 0 && !activeSeason) {
      setActiveSeason(seasons[0]);
    }
  }, [seasons]);

  // Fetch trailer
  useEffect(() => {
    if (show?.tmdb_id) {
      fetchTMDBShowTrailer(show.tmdb_id).then(setTrailerKey).catch(() => {});
    }
  }, [show?.tmdb_id]);

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
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&loop=1&playlist=${trailerKey}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
            className="absolute inset-0 w-full h-full border-0 scale-[1.2] origin-center"
            allow="autoplay; encrypted-media"
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

        {/* Description */}
        <p className="text-sm text-foreground/70 mt-4 leading-relaxed">{show.description}</p>

        {/* Season tabs */}
        {seasons.length > 0 && (
          <div className="mt-6">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {seasons.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSeason(s)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeSeason?.id === s.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.title || `Season ${s.season_number}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Episodes */}
        <div className="mt-4 space-y-3">
          {episodes.map((ep) => (
            <button
              key={ep.id}
              onClick={() => ep.video_url && navigate(`/watch/episode/${ep.id}`)}
              className="w-full flex gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left group"
            >
              <div className="w-28 h-16 rounded-lg overflow-hidden bg-muted shrink-0 relative">
                {ep.thumbnail_url ? (
                  <img src={ep.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">E{ep.episode_number}</div>
                )}
                {ep.video_url && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-6 h-6 text-white fill-current" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">E{ep.episode_number}: {ep.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{ep.description}</p>
                {ep.duration && <p className="text-xs text-muted-foreground mt-1">{ep.duration}</p>}
              </div>
            </button>
          ))}
          {episodes.length === 0 && activeSeason && (
            <p className="text-sm text-muted-foreground text-center py-4">No episodes available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShowDetail;
