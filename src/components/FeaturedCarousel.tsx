import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFeaturedMovies } from "@/hooks/useMovies";
import { searchTMDBByTitle, fetchTMDBTrailer } from "@/hooks/useTMDB";

const FeaturedCarousel = () => {
  const { data: movies = [] } = useFeaturedMovies();
  const [current, setCurrent] = useState(0);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Auto-rotate
  useEffect(() => {
    if (movies.length <= 1) return;
    const interval = trailerKey ? 15000 : 5000;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % movies.length);
    }, interval);
    return () => clearInterval(timer);
  }, [movies.length, trailerKey]);

  // Fetch trailer
  useEffect(() => {
    if (movies.length === 0) return;
    const movie = movies[current];
    setTrailerKey(null);
    setIframeReady(false);

    const fetchTrailer = async () => {
      try {
        const tmdbId = await searchTMDBByTitle(movie.title);
        if (tmdbId) {
          const key = await fetchTMDBTrailer(tmdbId);
          setTrailerKey(key);
        }
      } catch {}
    };
    fetchTrailer();
  }, [current, movies]);

  if (movies.length === 0) {
    return (
      <div className="relative h-[42vh] bg-gradient-to-b from-secondary to-background flex items-center justify-center">
        <p className="text-muted-foreground">No featured movies yet. Add movies in the Admin panel.</p>
      </div>
    );
  }

  const movie = movies[current];

  return (
    <div ref={heroRef} className="relative h-[42vh] overflow-hidden">
      {/* Trailer iframe — scaled to fill and cover, no black bars */}
      {trailerKey && (
        <iframe
          key={trailerKey}
          src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&loop=1&playlist=${trailerKey}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&disablekb=1`}
          className={`absolute inset-[-20%] w-[140%] h-[140%] border-0 transition-opacity duration-1000 ${iframeReady ? "opacity-100" : "opacity-0"}`}
          style={{ pointerEvents: "none" }}
          allow="autoplay; encrypted-media"
          onLoad={() => setIframeReady(true)}
        />
      )}

      {/* Backdrop fallback — only when no trailer */}
      {(!trailerKey || !iframeReady) && movie.backdrop_url && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
          style={{ backgroundImage: `url(${movie.backdrop_url})` }}
        />
      )}

      {/* Bottom gradient — subtle, doesn't shrink video */}
      <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-background via-background/50 to-transparent pointer-events-none" />

      {/* Content — pinned to bottom ~30% */}
      <div className="absolute inset-x-0 bottom-0 p-5 pb-6 max-w-lg">
        <h1 className="text-2xl font-bold text-foreground mb-1 drop-shadow-lg leading-tight">
          {movie.title}
        </h1>
        <p className="text-xs text-muted-foreground mb-3">
          {movie.year} {movie.genre && `• ${movie.genre}`}
        </p>
        <div className="flex gap-2.5">
          <Button
            onClick={() => navigate(`/movie/${movie.id}`)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-lg px-5 h-9 text-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Play
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(`/movie/${movie.id}`)}
            className="gap-2 rounded-lg px-5 h-9 text-sm"
          >
            <Info className="w-3.5 h-3.5" />
            Info
          </Button>
        </div>
      </div>

      {/* Dots */}
      {movies.length > 1 && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {movies.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === current ? "bg-primary w-5" : "bg-foreground/30 w-1.5"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FeaturedCarousel;
