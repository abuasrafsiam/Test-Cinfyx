import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Calendar, Star, Clock } from "lucide-react";
import { useMovie, useMoviesByCategory, useMovies } from "@/hooks/useMovies";
import { searchTMDBByTitle, fetchTMDBTrailer, fetchTMDBCast, type TMDBCastMember } from "@/hooks/useTMDB";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import VideoPlayer from "@/components/VideoPlayer";

interface TMDBExtras {
  cast: TMDBCastMember[];
  rating: number;
  runtime: number;
  tagline: string;
}

const TMDB_API_KEY = "fc113ae7bdb111be9218caccbfb49bfe";

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: movie, isLoading } = useMovie(id!);
  const { data: similarMovies = [] } = useMoviesByCategory(movie?.category || "");
  const { data: allMovies = [] } = useMovies();
  const navigate = useNavigate();

  const [extras, setExtras] = useState<TMDBExtras>({ cast: [], rating: 0, runtime: 0, tagline: "" });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!movie) return;
    setExtras({ cast: [], rating: 0, runtime: 0, tagline: "" });
    setImageLoaded(false);
    setIsPlaying(false);

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
      });
    };
    fetchExtras();
  }, [movie?.title, movie?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="w-full" style={{ aspectRatio: '2828 / 1676' }} />
        <div className="p-4 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-12 w-full" />
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

  const moreLikeThis = similarMovies.filter((m) => m.id !== movie.id).slice(0, 10);
  const forYou = allMovies.filter((m) => m.id !== movie.id && !moreLikeThis.some((s) => s.id === m.id)).slice(0, 12);

  const formatRuntime = (min: number) => {
    if (!min) return null;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Player / Hero area */}
      {isPlaying && movie.video_url ? (
        <div className="w-full bg-black relative" style={{ aspectRatio: '2828 / 1676' }}>
          <VideoPlayer
            url={movie.video_url}
            title={movie.title}
            poster={movie.backdrop_url || undefined}
          />
        </div>
      ) : (
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: '2828 / 1676' }}>
          {movie.backdrop_url ? (
            <img
              src={movie.backdrop_url}
              alt={movie.title}
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
          {/* Play overlay */}
          {movie.video_url && (
            <button
              onClick={() => setIsPlaying(true)}
              className="absolute inset-0 flex items-center justify-center z-[5]"
            >
              <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/30">
                <Play className="w-6 h-6 fill-current text-primary-foreground ml-0.5" />
              </div>
            </button>
          )}
        </div>
      )}

      {/* Movie info */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-3">
          {movie.poster_url && !isPlaying && (
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="w-16 h-24 rounded-xl object-cover shadow-lg shrink-0 border border-border -mt-10 relative z-10"
            />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-foreground leading-tight truncate">{movie.title}</h1>
            {extras.tagline && (
              <p className="text-[10px] text-primary/80 italic mt-0.5 truncate">{extras.tagline}</p>
            )}
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {extras.rating > 0 && (
                <span className="flex items-center gap-0.5 text-[11px] font-semibold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-md">
                  <Star className="w-3 h-3 fill-current" />
                  {extras.rating.toFixed(1)}
                </span>
              )}
              {movie.year && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                  <Calendar className="w-3 h-3" />{movie.year}
                </span>
              )}
              {extras.runtime > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                  <Clock className="w-3 h-3" />{formatRuntime(extras.runtime)}
                </span>
              )}
              {movie.genre && (
                <span className="text-[11px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">{movie.genre}</span>
              )}
            </div>
          </div>
        </div>

        {/* Now playing indicator */}
        {isPlaying && (
          <div className="mt-3 p-2.5 rounded-xl bg-secondary/50 border border-border/50">
            <p className="text-xs font-semibold text-primary">Now Playing</p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{movie.title}</p>
          </div>
        )}

        {movie.description && !isPlaying && (
          <p className="text-xs text-foreground/60 mt-2 leading-relaxed line-clamp-3">{movie.description}</p>
        )}

        {/* Cast */}
        {extras.cast.length > 0 && (
          <div className="mt-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Cast</h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {extras.cast.map((c) => (
                <div key={c.id} className="shrink-0 text-center w-14">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary mx-auto ring-2 ring-secondary">
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

        {/* More Like This */}
        {moreLikeThis.length > 0 && (
          <div className="mt-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">More Like This</h2>
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2">
              {moreLikeThis.map((m) => (
                <button key={m.id} onClick={() => navigate(`/movie/${m.id}`)} className="shrink-0 focus:outline-none group">
                  <div className="w-24 h-36 rounded-xl overflow-hidden bg-secondary transition-transform duration-200 group-active:scale-95">
                    {m.poster_url ? (
                      <img src={m.poster_url} alt={m.title} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-2 text-center">{m.title}</div>
                    )}
                  </div>
                  <p className="text-[10px] text-foreground/70 mt-1 w-24 truncate text-left">{m.title}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* For You */}
        {forYou.length > 0 && (
          <div className="mt-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">For You</h2>
            <div className="grid grid-cols-3 gap-2.5">
              {forYou.map((m) => (
                <button key={m.id} onClick={() => navigate(`/movie/${m.id}`)} className="focus:outline-none group text-left">
                  <div className="w-full aspect-[2/3] rounded-xl overflow-hidden bg-secondary transition-transform duration-200 group-active:scale-95">
                    {m.poster_url ? (
                      <img src={m.poster_url} alt={m.title} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-2 text-center">{m.title}</div>
                    )}
                  </div>
                  <p className="text-[10px] text-foreground/70 mt-1 truncate">{m.title}</p>
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
