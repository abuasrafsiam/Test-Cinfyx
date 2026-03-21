import { useParams } from "react-router-dom";
import { useEffect } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import { useMovie } from "@/hooks/useMovies";
import { logPlayEvent } from "@/hooks/usePlayEvents";

const Watch = () => {
  const { id } = useParams<{ id: string }>();
  const { data: movie, isLoading } = useMovie(id!);

  useEffect(() => {
    if (id) {
      logPlayEvent(id);
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!movie || !movie.video_url) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Video not available</p>
      </div>
    );
  }

  return <VideoPlayer url={movie.video_url} backupUrl1={movie.video_url_backup_1} backupUrl2={movie.video_url_backup_2} title={movie.title} videoId={movie.id} />;
};

export default Watch;
