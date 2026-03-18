import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFeaturedMovies } from "@/hooks/useMovies";
import { searchTMDBByTitle, fetchTMDBTrailer } from "@/hooks/useTMDB";

const FeaturedCarousel = () => {
  const { data: movies = [] } = useFeaturedMovies();
  const [current, setCurrent] = useState(0);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [trailerLoading, setTrailerLoading] = useState(false);
  const navigate = useNavigate();

  // Auto-rotate (only when no trailer playing, or longer interval with trailer)
  useEffect(() => {
    if (movies.length <= 1) return;
    const interval = trailerKey ? 15000 : 5000;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % movies.length);
    }, interval);
    return () => clearInterval(timer);
  }, [movies.length, trailerKey]);

  // Fetch trailer for current movie
  useEffect(() => {
    if (movies.length === 0) return;
    const movie = movies[current];
    setTrailerKey(null);
    setTrailerLoading(true);

    const fetchTrailer = async () => {
      try {
        const tmdbId = await searchTMDBByTitle(movie.title);
        if (tmdbId) {
          const key = await fetchTMDBTrailer(tmdbId);
          setTrailerKey(key);
        }
      } catch {}
      setTrailerLoading(false);
    };
    fetchTrailer();
  }, [current, movies]);

  if (movies.length === 0) {
    return (
      <div className="relative h-[70vh] bg-gradient-to-b from-secondary to-background flex items-center justify-center">
        <p className="text-muted-foreground">No featured movies yet. Add movies in the Admin panel.</p>
      </div>
    );
  }

  const movie = movies[current];

  return (
    <div className="relative h-[70vh] overflow-hidden">
      {/* Background: Trailer or Backdrop (NEVER poster) */}
      {trailerKey ? (
        <iframe
          key={trailerKey}
          src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&loop=1&playlist=${trailerKey}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
          className="absolute inset-0 w-full h-full border-0 scale-[1.3] origin-center"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      ) : (
        movie.backdrop_url && (
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-700"
            style={{ backgroundImage: `url(${movie.backdrop_url})` }}
          />
        )
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-6 pb-12 max-w-lg">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-3 drop-shadow-lg">
          {movie.title}
        </h1>
        <p className="text-sm text-muted-foreground mb-1">
          {movie.year} {movie.genre && `• ${movie.genre}`}
        </p>
        <p className="text-sm text-foreground/80 mb-5 line-clamp-3">
          {movie.description}
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => navigate(`/movie/${movie.id}`)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-lg px-6"
          >
            <Play className="w-4 h-4 fill-current" />
            Play
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(`/movie/${movie.id}`)}
            className="gap-2 rounded-lg px-6"
          >
            <Info className="w-4 h-4" />
            More Info
          </Button>
        </div>
      </div>

      {/* Dots */}
      {movies.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {movies.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === current ? "bg-primary w-6" : "bg-foreground/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FeaturedCarousel;
