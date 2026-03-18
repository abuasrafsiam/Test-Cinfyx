import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFeaturedMovies } from "@/hooks/useMovies";

const FeaturedCarousel = () => {
  const { data: movies = [] } = useFeaturedMovies();
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (movies.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % movies.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [movies.length]);

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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{
          backgroundImage: movie.backdrop_url
            ? `url(${movie.backdrop_url})`
            : `url(${movie.poster_url})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
      </div>

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
