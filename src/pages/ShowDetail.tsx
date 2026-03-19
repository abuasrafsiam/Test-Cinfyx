import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Calendar } from "lucide-react";
import { useShow, useSeasons, useEpisodes, type Season, type Episode } from "@/hooks/useShows";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useRef } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import { supabase } from "@/integrations/supabase/client";

const ShowDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: show, isLoading } = useShow(id!);
  const { data: seasons = [] } = useSeasons(id!);
  const navigate = useNavigate();

  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);
  const [isPlayerActive, setIsPlayerActive] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const episodeListRef = useRef<HTMLDivElement>(null);

  // Auto-select first season
  useEffect(() => {
    if (seasons.length > 0 && !activeSeason) {
      setActiveSeason(seasons[0]);
    }
  }, [seasons]);

  const { data: episodes = [] } = useEpisodes(activeSeason?.id || "");

  // Auto-select first episode with video when episodes load
  useEffect(() => {
    if (episodes.length > 0 && !activeEpisode) {
      const first = episodes.find((e) => e.video_url);
      if (first) setActiveEpisode(first);
    }
  }, [episodes]);

  // When season changes, reset active episode
  const handleSeasonChange = (s: Season) => {
    setActiveSeason(s);
    setActiveEpisode(null);
    setIsPlayerActive(false);
  };

  const handleEpisodeSelect = (ep: Episode) => {
    if (!ep.video_url) return;
    setActiveEpisode(ep);
    setIsPlayerActive(true);
  };

  const handlePlayFirst = () => {
    const first = episodes.find((e) => e.video_url);
    if (first) {
      setActiveEpisode(first);
      setIsPlayerActive(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="w-full aspect-video" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-12 w-full" />
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

  const isPlaying = isPlayerActive && activeEpisode?.video_url;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Player / Hero area */}
      {isPlaying ? (
        <div className="w-full aspect-video bg-black relative">
          <VideoPlayer
            url={activeEpisode.video_url!}
            title={`${show.title} - S${activeSeason?.season_number || 1} E${activeEpisode.episode_number}`}
            poster={activeEpisode.thumbnail_url || show.backdrop_url || undefined}
          />
        </div>
      ) : (
        <div className="relative w-full aspect-video overflow-hidden">
          {show.backdrop_url ? (
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
          <button
            onClick={() => {
              if (window.history.length > 2) navigate(-1);
              else navigate("/", { replace: true });
            }}
            className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-background/60 backdrop-blur-md flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        </div>
      )}

      {/* Show info */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-3">
          {show.poster_url && !isPlaying && (
            <img
              src={show.poster_url}
              alt={show.title}
              className="w-16 h-24 rounded-xl object-cover shadow-lg shrink-0 border border-border -mt-10 relative z-10"
            />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-foreground leading-tight truncate">{show.title}</h1>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {show.release_year && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                  <Calendar className="w-3 h-3" />{show.release_year}
                </span>
              )}
              {show.genre && (
                <span className="text-[11px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">{show.genre}</span>
              )}
              <span className="text-[11px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">{seasons.length}S</span>
            </div>
          </div>
        </div>

        {/* Now playing info */}
        {activeEpisode && (
          <div className="mt-3 p-2.5 rounded-xl bg-secondary/50 border border-border/50">
            <p className="text-xs font-semibold text-primary">
              Now Playing: S{activeSeason?.season_number} E{activeEpisode.episode_number}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{activeEpisode.title}</p>
          </div>
        )}

        {show.description && !isPlaying && (
          <p className="text-xs text-foreground/60 mt-2 leading-relaxed line-clamp-3">{show.description}</p>
        )}
      </div>

      {/* Seasons – horizontal scroll */}
      {seasons.length > 0 && (
        <div className="mt-4 px-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Seasons</h3>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {seasons.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSeasonChange(s)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeSeason?.id === s.id
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-secondary text-muted-foreground active:scale-95"
                }`}
              >
                {s.title || `Season ${s.season_number}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Episodes – compact horizontal scroll */}
      <div className="mt-3 px-4" ref={episodeListRef}>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Episodes {activeSeason && `· ${activeSeason.title || `Season ${activeSeason.season_number}`}`}
        </h3>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2">
          {episodes.map((ep) => {
            const isActive = activeEpisode?.id === ep.id;
            const hasVideo = !!ep.video_url;
            return (
              <button
                key={ep.id}
                onClick={() => handleEpisodeSelect(ep)}
                disabled={!hasVideo}
                className={`shrink-0 w-36 rounded-xl overflow-hidden text-left transition-all ${
                  isActive
                    ? "ring-2 ring-primary shadow-lg shadow-primary/20"
                    : hasVideo
                      ? "active:scale-95"
                      : "opacity-40 cursor-not-allowed"
                }`}
              >
                {/* Thumbnail */}
                <div className="w-full h-20 bg-muted relative">
                  {ep.thumbnail_url ? (
                    <img src={ep.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg font-bold">
                      {ep.episode_number}
                    </div>
                  )}
                  {hasVideo && (
                    <div className={`absolute inset-0 flex items-center justify-center ${isActive ? "bg-primary/20" : "bg-black/20"}`}>
                      <Play className={`w-5 h-5 fill-current ${isActive ? "text-primary" : "text-white/80"}`} />
                    </div>
                  )}
                  {!hasVideo && (
                    <div className="absolute bottom-1 right-1">
                      <span className="text-[9px] bg-destructive/80 text-destructive-foreground px-1 py-0.5 rounded">No video</span>
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-2 bg-secondary/50">
                  <p className={`text-[11px] font-semibold truncate ${isActive ? "text-primary" : "text-foreground"}`}>
                    E{ep.episode_number}: {ep.title}
                  </p>
                  {ep.duration && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{ep.duration}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        {episodes.length === 0 && activeSeason && (
          <p className="text-xs text-muted-foreground text-center py-6">No episodes available</p>
        )}
      </div>
    </div>
  );
};

export default ShowDetail;
