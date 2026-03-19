import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Heart, Share2, Star, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMovie, useMoviesByCategory, useMovies } from "@/hooks/useMovies";
import { searchTMDBByTitle, fetchTMDBTrailer, fetchTMDBCast, type TMDBCastMember } from "@/hooks/useTMDB";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface TMDBExtras {
  trailerKey: string | null;
  cast: TMDBCastMember[];
  rating: number;
  runtime: number;
  tagline: string;
  backdropVariant: string | null;
}

const TMDB_API_KEY = "fc113ae7bdb111be9218caccbfb49bfe";

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: movie, isLoading } = useMovie(id!);
  const { data: similarMovies = [] } = useMoviesByCategory(movie?.category || "");
  const { data: allMovies = [] } = useMovies();
  const navigate = useNavigate();

  const [extras, setExtras] = useState<TMDBExtras>({
    trailerKey: null, cast: [], rating: 0, runtime: 0, tagline: "", backdropVariant: null,
  });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [playLoading, setPlayLoading] = useState(false);

  useEffect(() => {
    if (!movie) return;
    setExtras({ trailerKey: null, cast: [], rating: 0, runtime: 0, tagline: "", backdropVariant: null });
    setImageLoaded(false);

    const fetchExtras = async () => {
      const tmdbId = await searchTMDBByTitle(movie.title);
      if (!tmdbId) return;

      const [trailerKey, cast, details, imagesRes] = await Promise.all([
        fetchTMDBTrailer(tmdbId),
        fetchTMDBCast(tmdbId),
        fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`)
          .then((r) => r.json()).catch(() => null),
        fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/images?api_key=${TMDB_API_KEY}`)
          .then((r) => r.json()).catch(() => null),
      ]);

      // Get a different backdrop variation than the primary one
      let backdropVariant: string | null = null;
      if (imagesRes?.backdrops && imagesRes.backdrops.length > 1) {
        const primaryPath = movie.backdrop_url?.split("/").pop();
        const alt = imagesRes.backdrops.find(
          (b: { file_path: string }) => !b.file_path.endsWith(primaryPath || "___")
        );
        if (alt) {
          backdropVariant = `https://image.tmdb.org/t/p/original${alt.file_path}`;
        }
      }

      setExtras({
        trailerKey,
        cast,
        rating: details?.vote_average || 0,
        runtime: details?.runtime || 0,
        tagline: details?.tagline || "",
        backdropVariant,
      });
    };
    fetchExtras();
  }, [movie?.title, movie?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="w-full aspect-video" />
        <div className="p-5 space-y-3">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-full rounded-2xl" />
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

  // Use a different backdrop for details page — prefer variant, then primary backdrop. NEVER poster.
  const heroImage = extras.backdropVariant || movie.backdrop_url;

  const formatRuntime = (min: number) => {
    if (!min) return null;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero — Trailer or Backdrop (NEVER poster) */}
      <div className="relative w-full aspect-video overflow-hidden">
        {extras.trailerKey ? (
          <iframe
            src={`https://www.youtube.com/embed/${extras.trailerKey}?autoplay=1&mute=1&loop=1&playlist=${extras.trailerKey}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
            className="absolute inset-0 w-full h-full border-0 scale-[1.2] origin-center"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        ) : heroImage ? (
          <img
            src={heroImage}
            alt={movie.title}
            className={`w-full h-full object-cover transition-opacity duration-700 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setImageLoaded(true)}
          />
        ) : (
          <div className="w-full h-full bg-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent pointer-events-none" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-background/60 backdrop-blur-md flex items-center justify-center transition-transform active:scale-90"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="px-5 -mt-8 relative z-10">
        {/* Poster (small, left) + Title — poster ONLY used here */}
        <div className="flex gap-4 items-end">
          {movie.poster_url && (
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="w-24 h-36 rounded-2xl object-cover shadow-2xl shrink-0 border-2 border-secondary"
            />
          )}
          <div className="pb-1 min-w-0 flex-1">
            <h1 className="text-xl font-bold text-foreground leading-tight">{movie.title}</h1>
            {extras.tagline && (
              <p className="text-xs text-primary/80 italic mt-0.5 truncate">{extras.tagline}</p>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {extras.rating > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-yellow-500 bg-yellow-500/10 px-2.5 py-1 rounded-lg">
              <Star className="w-3.5 h-3.5 fill-current" />
              {extras.rating.toFixed(1)}
            </span>
          )}
          {movie.year && (
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg">
              <Calendar className="w-3 h-3" />
              {movie.year}
            </span>
          )}
          {extras.runtime > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg">
              <Clock className="w-3 h-3" />
              {formatRuntime(extras.runtime)}
            </span>
          )}
          {movie.genre && (
            <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg">
              {movie.genre}
            </span>
          )}
        </div>

        {/* Play + Actions */}
        <div className="flex gap-3 mt-5">
          <Button
            onClick={() => {
              setPlayLoading(true);
              navigate(`/watch/${movie.id}`);
            }}
            disabled={playLoading}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-2xl h-13 text-base font-semibold shadow-lg shadow-primary/20"
          >
            {playLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5 fill-current" />
            )}
            {playLoading ? "Loading…" : "Play Now"}
          </Button>
          <button className="w-13 h-13 rounded-2xl bg-secondary flex items-center justify-center transition-transform active:scale-90">
            <Heart className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="w-13 h-13 rounded-2xl bg-secondary flex items-center justify-center transition-transform active:scale-90">
            <Share2 className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-foreground/70 mt-5 leading-relaxed">
          {movie.description}
        </p>

        {/* Cast */}
        {extras.cast.length > 0 && (
          <div className="mt-7">
            <h2 className="text-base font-semibold text-foreground mb-3">Cast</h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2">
              {extras.cast.map((c) => (
                <div key={c.id} className="shrink-0 text-center w-16">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-secondary mx-auto ring-2 ring-secondary">
                    {c.profile_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w185${c.profile_path}`}
                        alt={c.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-medium">
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

        {/* More Like This — uses poster_url only */}
        {moreLikeThis.length > 0 && (
          <div className="mt-7">
            <h2 className="text-base font-semibold text-foreground mb-3">More Like This</h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2">
              {moreLikeThis.map((m) => (
                <button key={m.id} onClick={() => navigate(`/movie/${m.id}`)} className="shrink-0 focus:outline-none group">
                  <div className="w-28 h-40 rounded-2xl overflow-hidden bg-secondary transition-transform duration-200 group-active:scale-95">
                    {m.poster_url ? (
                      <img src={m.poster_url} alt={m.title} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-2 text-center">{m.title}</div>
                    )}
                  </div>
                  <p className="text-xs text-foreground/70 mt-1.5 w-28 truncate text-left">{m.title}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* For You — uses poster_url only */}
        {forYou.length > 0 && (
          <div className="mt-7">
            <h2 className="text-base font-semibold text-foreground mb-3">For You</h2>
            <div className="grid grid-cols-3 gap-3">
              {forYou.map((m) => (
                <button key={m.id} onClick={() => navigate(`/movie/${m.id}`)} className="focus:outline-none group text-left">
                  <div className="w-full aspect-[2/3] rounded-xl overflow-hidden bg-secondary transition-transform duration-200 group-active:scale-95">
                    {m.poster_url ? (
                      <img src={m.poster_url} alt={m.title} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-2 text-center">{m.title}</div>
                    )}
                  </div>
                  <p className="text-[11px] text-foreground/70 mt-1 truncate">{m.title}</p>
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
