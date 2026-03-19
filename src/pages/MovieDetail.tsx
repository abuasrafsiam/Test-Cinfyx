import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Star, Clock, Calendar, Heart, Share2, Info } from "lucide-react";
import { useMovie, useMoviesByCategory, useMovies } from "@/hooks/useMovies";
import { searchTMDBByTitle, fetchTMDBCast, type TMDBCastMember } from "@/hooks/useTMDB";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import VideoPlayer from "@/components/VideoPlayer";

interface TMDBExtras {
  cast: TMDBCastMember[];
  rating: number;
  runtime: number;
  tagline: string;
  country: string;
}

const TMDB_API_KEY = "fc113ae7bdb111be9218caccbfb49bfe";

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: movie, isLoading } = useMovie(id!);
  const { data: similarMovies = [] } = useMoviesByCategory(movie?.category || "");
  const { data: allMovies = [] } = useMovies();
  const navigate = useNavigate();

  const [extras, setExtras] = useState<TMDBExtras>({ cast: [], rating: 0, runtime: 0, tagline: "", country: "" });
  const [isPlaying, setIsPlaying] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (!movie) return;
    setExtras({ cast: [], rating: 0, runtime: 0, tagline: "", country: "" });
    setIsPlaying(false);
    setShowInfo(false);

    const fetchExtras = async () => {
      const tmdbId = await searchTMDBByTitle(movie.title);
      if (!tmdbId) return;

      const [cast, details] = await Promise.all([
        fetchTMDBCast(tmdbId),
        fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`)
          .then((r) => r.json()).catch(() => null),
      ]);

      setExtras({
        cast,
        rating: details?.vote_average || 0,
        runtime: details?.runtime || 0,
        tagline: details?.tagline || "",
        country: details?.production_countries?.[0]?.name || "",
      });
    };
    fetchExtras();
  }, [movie?.title, movie?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="w-full" style={{ aspectRatio: '2828 / 1676' }} />
        <div className="p-5 space-y-3">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Movie not found</p>
      </div>
    );
  }

  const forYou = allMovies.filter((m) => m.id !== movie.id).slice(0, 12);
  const moreLikeThis = similarMovies.filter((m) => m.id !== movie.id).slice(0, 10);

  const formatRuntime = (min: number) => {
    if (!min) return null;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // Build metadata dots
  const metaParts: string[] = [];
  if (extras.rating > 0) metaParts.push(`★ ${extras.rating.toFixed(1)}`);
  if (movie.year) metaParts.push(movie.year);
  if (extras.country) metaParts.push(extras.country);
  if (movie.genre) metaParts.push(movie.genre);
  if (extras.runtime > 0) metaParts.push(formatRuntime(extras.runtime)!);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Player area */}
      <div className="relative w-full bg-black" style={{ aspectRatio: '2828 / 1676' }}>
        {isPlaying && movie.video_url ? (
          <VideoPlayer
            url={movie.video_url}
            title={movie.title}
            poster={movie.backdrop_url || undefined}
          />
        ) : (
          <>
            {movie.backdrop_url && (
              <img
                src={movie.backdrop_url}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30 pointer-events-none" />
            {/* Back button */}
            <button
              onClick={() => {
                if (window.history.length > 2) navigate(-1);
                else navigate("/", { replace: true });
              }}
              className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            {/* Play overlay */}
            {movie.video_url && (
              <button
                onClick={() => setIsPlaying(true)}
                className="absolute inset-0 flex items-center justify-center z-[5]"
              >
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <Play className="w-7 h-7 fill-white text-white ml-0.5" />
                </div>
              </button>
            )}
          </>
        )}
      </div>

      {/* Content section */}
      <div className="px-5 pt-5">
        {/* Title + Info button */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground leading-tight">{movie.title}</h1>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Info className="w-3 h-3" />
            Info
          </button>
        </div>

        {/* Metadata row */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {metaParts.map((part, i) => (
            <span key={i} className="flex items-center">
              <span className={`text-sm ${i === 0 && extras.rating > 0 ? "font-semibold text-yellow-500" : "text-muted-foreground"}`}>
                {part}
              </span>
              {i < metaParts.length - 1 && (
                <span className="text-muted-foreground/50 mx-1.5">·</span>
              )}
            </span>
          ))}
        </div>

        {/* Action buttons row */}
        <div className="flex gap-2.5 mt-5">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-sm font-medium text-foreground transition-transform active:scale-95">
            <Heart className="w-4 h-4" />
            Add to list
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-sm font-medium text-foreground transition-transform active:scale-95">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

        {/* Info panel (expandable) */}
        {showInfo && (
          <div className="mt-4 p-4 rounded-2xl bg-secondary/50 border border-border/50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            {extras.tagline && (
              <p className="text-sm text-primary italic">"{extras.tagline}"</p>
            )}
            {movie.description && (
              <p className="text-sm text-foreground/70 leading-relaxed">{movie.description}</p>
            )}
            {/* Cast inside info */}
            {extras.cast.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Cast</p>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                  {extras.cast.slice(0, 10).map((c) => (
                    <div key={c.id} className="shrink-0 text-center w-14">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-muted mx-auto">
                        {c.profile_path ? (
                          <img src={`https://image.tmdb.org/t/p/w185${c.profile_path}`} alt={c.name} loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-medium">{c.name[0]}</div>
                        )}
                      </div>
                      <p className="text-[9px] text-foreground/80 mt-1 truncate">{c.name}</p>
                      <p className="text-[8px] text-muted-foreground truncate">{c.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* For You section */}
        {forYou.length > 0 && (
          <div className="mt-7">
            <h2 className="text-base font-semibold text-foreground mb-3">For you</h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {forYou.map((m) => (
                <button key={m.id} onClick={() => navigate(`/movie/${m.id}`)} className="shrink-0 focus:outline-none group">
                  <div className="w-[140px] aspect-[2/3] rounded-2xl overflow-hidden bg-secondary transition-transform duration-200 group-active:scale-95">
                    {m.poster_url ? (
                      <img src={m.poster_url} alt={m.title} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-2 text-center">{m.title}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* More Like This */}
        {moreLikeThis.length > 0 && (
          <div className="mt-7">
            <h2 className="text-base font-semibold text-foreground mb-3">More like this</h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {moreLikeThis.map((m) => (
                <button key={m.id} onClick={() => navigate(`/movie/${m.id}`)} className="shrink-0 focus:outline-none group">
                  <div className="w-[140px] aspect-[2/3] rounded-2xl overflow-hidden bg-secondary transition-transform duration-200 group-active:scale-95">
                    {m.poster_url ? (
                      <img src={m.poster_url} alt={m.title} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-2 text-center">{m.title}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieDetail;
