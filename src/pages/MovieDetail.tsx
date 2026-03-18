import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMovie } from "@/hooks/useMovies";
import { Skeleton } from "@/components/ui/skeleton";
import VideoPlayer from "@/components/VideoPlayer";

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: movie, isLoading } = useMovie(id!);
  const navigate = useNavigate();
  const [playing, setPlaying] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="w-full aspect-video" />
        <div className="p-5 space-y-4">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-16 w-full" />
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
    <div className="min-h-screen bg-background pb-24">
      {/* Video / Backdrop area at the top */}
      <div className="relative w-full aspect-video bg-black">
        {playing && movie.video_url ? (
          <VideoPlayer
            url={movie.video_url}
            title={movie.title}
          />
        ) : (
          <>
            <img
              src={movie.backdrop_url || movie.poster_url}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <button
                onClick={() => setPlaying(true)}
                className="w-16 h-16 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
              >
                <Play className="w-7 h-7 text-primary-foreground fill-current ml-1" />
              </button>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Movie info */}
      <div className="px-5 pt-5">
        <h1 className="text-xl font-bold text-foreground">{movie.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {movie.year}{movie.genre ? ` • ${movie.genre}` : ""}
        </p>

        {/* Action buttons */}
        <div className="flex gap-3 mt-5">
          <Button
            onClick={() => movie.video_url ? setPlaying(true) : navigate(`/watch/${movie.id}`)}
            className="flex-1 gap-2 rounded-xl h-12"
          >
            <Play className="w-5 h-5 fill-current" />
            Play
          </Button>
          <Button variant="secondary" className="rounded-xl h-12 px-5">
            <Download className="w-5 h-5" />
          </Button>
          <Button variant="secondary" className="rounded-xl h-12 px-5">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>

        {/* Description */}
        {movie.description && (
          <p className="text-sm text-foreground/70 mt-5 leading-relaxed">
            {movie.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default MovieDetail;
