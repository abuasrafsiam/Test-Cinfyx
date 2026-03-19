import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import VideoPlayer from "@/components/VideoPlayer";
import { supabase } from "@/integrations/supabase/client";
import type { Episode } from "@/hooks/useShows";
import { getProxiedVideoUrl } from "@/lib/videoProxy";

const WatchEpisode = () => {
  const { id } = useParams<{ id: string }>();

  const { data: episode, isLoading } = useQuery({
    queryKey: ["episode", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Episode;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!episode || !episode.video_url) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <p className="text-muted-foreground">Video not available</p>
      </div>
    );
  }

  return <VideoPlayer url={getProxiedVideoUrl(episode.video_url)} title={episode.title} />;
};

export default WatchEpisode;
