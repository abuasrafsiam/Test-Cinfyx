import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMovie } from "@/hooks/useMovies";
import { Skeleton } from "@/components/ui/skeleton";

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: movie, isLoading } = useMovie(id!);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-[50vh] w-full" />
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
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

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Backdrop */}
      <div className="relative h-[50vh]">
        <img
          src={movie.backdrop_url || movie.poster_url}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Info */}
      <div className="px-6 -mt-16 relative z-10">
        <div className="flex gap-4">
          {movie.poster_url && (
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="w-28 h-40 rounded-xl object-cover shadow-lg shrink-0"
            />
          )}
          <div className="pt-8">
            <h1 className="text-2xl font-bold text-foreground">{movie.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {movie.year} {movie.genre && `• ${movie.genre}`}
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={() => navigate(`/watch/${movie.id}`)}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl h-12"
          >
            <Play className="w-5 h-5 fill-current" />
            Play
          </Button>
          <Button
            variant="secondary"
            className="gap-2 rounded-xl h-12 px-6"
          >
            <Download className="w-5 h-5" />
            Download
          </Button>
        </div>

        <p className="text-sm text-foreground/70 mt-6 leading-relaxed">
          {movie.description}
        </p>
      </div>
    </div>
  );
};

export default MovieDetail;
