import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveHeroItems } from "@/hooks/useHeroItems";

const FeaturedCarousel = () => {
  const { data: heroes = [] } = useActiveHeroItems();
  const [current, setCurrent] = useState(0);
  const [iframeReady, setIframeReady] = useState(false);
  const navigate = useNavigate();

  // Auto-rotate every 6s
  useEffect(() => {
    if (heroes.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroes.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroes.length]);

  // Reset iframe state on slide change
  useEffect(() => {
    setIframeReady(false);
  }, [current]);

  if (heroes.length === 0) {
    return (
      <div className="relative h-[42vh] bg-gradient-to-b from-secondary to-background flex items-center justify-center">
        <p className="text-muted-foreground">No hero items configured. Add them in the Admin panel.</p>
      </div>
    );
  }

  const hero = heroes[current];

  // Detect if video_url is a YouTube URL and extract embed src
  const getVideoEmbed = (url: string) => {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) {
      const id = ytMatch[1];
      return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&disablekb=1`;
    }
    return url; // Direct video URL
  };

  const embedSrc = getVideoEmbed(hero.video_url);
  const isYoutube = hero.video_url && /youtube|youtu\.be/.test(hero.video_url);

  return (
    <div className="relative h-[42vh]">
      {/* Video */}
      {embedSrc && isYoutube && (
        <iframe
          key={`${hero.id}-${current}`}
          src={embedSrc}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] h-[300%] border-0 transition-opacity duration-1000 ${iframeReady ? "opacity-100" : "opacity-0"}`}
          style={{ pointerEvents: "none" }}
          allow="autoplay; encrypted-media"
          onLoad={() => setIframeReady(true)}
        />
      )}

      {embedSrc && !isYoutube && (
        <video
          key={`${hero.id}-${current}`}
          src={embedSrc}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          onLoadedData={() => setIframeReady(true)}
        />
      )}

      {/* Dark fallback when no video */}
      {!embedSrc && (
        <div className="absolute inset-0 bg-secondary" />
      )}

      {/* Gradient */}
      <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-background via-background/50 to-transparent pointer-events-none" />

      {/* Content */}
      {(hero.title || hero.description) && (
        <div className="absolute inset-x-0 bottom-0 p-5 pb-6 max-w-lg">
          {hero.title && (
            <h1 className="text-2xl font-bold text-foreground mb-1 drop-shadow-lg leading-tight">
              {hero.title}
            </h1>
          )}
          {hero.description && (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              {hero.description}
            </p>
          )}
        </div>
      )}

      {/* Dots */}
      {heroes.length > 1 && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {heroes.map((_, i) => (
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
