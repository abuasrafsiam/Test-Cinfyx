import { useParams } from "react-router-dom";
import VideoPlayer from "@/components/VideoPlayer";
import { useMovie } from "@/hooks/useMovies";

const Watch = () => {
  const { id } = useParams<{ id: string }>();
  const { data: movie, isLoading } = useMovie(id!);

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!movie || !movie.video_url) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <p className="text-muted-foreground">Video not available</p>
      </div>
    );
  }

  return <VideoPlayer url={movie.video_url} title={movie.title} />;
};

export default Watch;
