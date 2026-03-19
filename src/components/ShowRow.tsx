import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useShows, type Show } from "@/hooks/useShows";
import { Skeleton } from "@/components/ui/skeleton";

interface ShowRowProps {
  title: string;
  shows: Show[];
  isLoading?: boolean;
}

const ShowRow = ({ title, shows, isLoading }: ShowRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="px-4 mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-3">{title}</h2>
        <div className="flex gap-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="w-32 h-48 rounded-xl shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (shows.length === 0) return null;

  return (
    <div className="mb-8 group">
      <h2 className="text-lg font-semibold text-foreground mb-3 px-4">{title}</h2>
      <div className="relative">
        <button onClick={() => scroll("left")} className="absolute left-0 top-0 bottom-0 z-10 w-10 bg-gradient-to-r from-background to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto no-scrollbar px-4">
          {shows.map((show) => (
            <button key={show.id} onClick={() => navigate(`/show/${show.id}`)} className="shrink-0 group/card focus:outline-none">
              <div className="w-32 h-48 rounded-xl overflow-hidden bg-secondary relative transition-transform duration-300 group-hover/card:scale-105">
                {show.poster_url ? (
                  <img src={show.poster_url} alt={show.title} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-2 text-center">{show.title}</div>
                )}
              </div>
              <p className="text-xs text-foreground/80 mt-2 w-32 truncate text-left">{show.title}</p>
            </button>
          ))}
        </div>
        <button onClick={() => scroll("right")} className="absolute right-0 top-0 bottom-0 z-10 w-10 bg-gradient-to-l from-background to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-6 h-6 text-foreground" />
        </button>
      </div>
    </div>
  );
};

export default ShowRow;
