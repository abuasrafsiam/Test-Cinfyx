import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMovie, useMoviesByCategory } from "@/hooks/useMovies";
import { searchTMDBByTitle, fetchTMDBTrailer, fetchTMDBCast, type TMDBCastMember } from "@/hooks/useTMDB";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, useRef } from "react";

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: movie, isLoading } = useMovie(id!);
  const { data: similarMovies = [] } = useMoviesByCategory(movie?.category || "");
  const navigate = useNavigate();

  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [cast, setCast] = useState<TMDBCastMember[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch trailer + cast from TMDB by searching movie title
  useEffect(() => {
    if (!movie) return;
    setTrailerKey(null);
    setCast([]);
    setImageLoaded(false);

    const fetchExtras = async () => {
      const tmdbId = await searchTMDBByTitle(movie.title);
      if (!tmdbId) return;
      const [key, castData] = await Promise.all([
        fetchTMDBTrailer(tmdbId),
        fetchTMDBCast(tmdbId),
      ]);
      setTrailerKey(key);
      setCast(castData);
    };
    fetchExtras();
  }, [movie?.title, movie?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="w-full aspect-video" />
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
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

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero - Trailer or Backdrop */}
      <div className="relative w-full aspect-video overflow-hidden">
        {trailerKey ? (
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&loop=1&playlist=${trailerKey}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
            className="absolute inset-0 w-full h-full border-0 scale-[1.2] origin-center"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        ) : (
          <img
            src={movie.backdrop_url || movie.poster_url}
            alt={movie.title}
            className={`w-full h-full object-cover transition-opacity duration-700 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setImageLoaded(true)}
          />
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent pointer-events-none" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-background/60 backdrop-blur-md flex items-center justify-center transition-transform active:scale-90"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="px-5 -mt-6 relative z-10">
        {/* Poster + Info */}
        <div className="flex gap-4 items-end">
          {movie.poster_url && (
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="w-24 h-36 rounded-2xl object-cover shadow-2xl shrink-0 border-2 border-secondary"
            />
          )}
          <div className="pb-1">
            <h1 className="text-xl font-bold text-foreground leading-tight">
              {movie.title}
            </h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {movie.year && (
                <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-md">
                  {movie.year}
                </span>
              )}
              {movie.genre && (
                <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-md">
                  {movie.genre}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-foreground/70 mt-4 leading-relaxed line-clamp-4">
          {movie.description}
        </p>

        {/* Action buttons */}
        <div className="flex gap-3 mt-5">
          <Button
            onClick={() => navigate(`/watch/${movie.id}`)}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-2xl h-13 text-base font-semibold shadow-lg shadow-primary/20"
          >
            <Play className="w-5 h-5 fill-current" />
            Play Now
          </Button>
          <button className="w-13 h-13 rounded-2xl bg-secondary flex items-center justify-center transition-transform active:scale-90">
            <Heart className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="w-13 h-13 rounded-2xl bg-secondary flex items-center justify-center transition-transform active:scale-90">
            <Share2 className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Cast */}
        {cast.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-foreground mb-3">Cast</h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2">
              {cast.map((c) => (
                <div key={c.id} className="shrink-0 text-center w-16">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-secondary mx-auto">
                    {c.profile_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w185${c.profile_path}`}
                        alt={c.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        {c.name[0]}
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-foreground/80 mt-1.5 truncate">{c.name}</p>
                  <p className="text-[9px] text-muted-foreground truncate">{c.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* More Like This */}
        {moreLikeThis.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-foreground mb-3">More Like This</h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2">
              {moreLikeThis.map((m) => (
                <button
                  key={m.id}
                  onClick={() => navigate(`/movie/${m.id}`)}
                  className="shrink-0 focus:outline-none group"
                >
                  <div className="w-28 h-40 rounded-2xl overflow-hidden bg-secondary transition-transform duration-200 group-active:scale-95">
                    {m.poster_url ? (
                      <img
                        src={m.poster_url}
                        alt={m.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-2 text-center">
                        {m.title}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-foreground/70 mt-1.5 w-28 truncate text-left">
                    {m.title}
                  </p>
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
