import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShows } from "@/hooks/useShows";
import { Skeleton } from "@/components/ui/skeleton";

const FILTERS = ["All", "Drama", "Comedy", "Action", "Thriller"];

const ShowsPage = () => {
  const { data: shows = [], isLoading } = useShows();
  const [filter, setFilter] = useState("All");
  const navigate = useNavigate();

  const filtered = filter === "All" ? shows : shows.filter((s) => s.genre?.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-foreground">TV Shows</h1>
      </div>

      {/* Filter pills */}
      <div className="px-4 flex gap-2 overflow-x-auto no-scrollbar pb-3">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="px-4 grid grid-cols-3 gap-3">
        {isLoading &&
          Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] rounded-xl" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        {shows.length > 0 && filtered.map((show) => (
          <button
            key={show.id}
            onClick={() => navigate(`/show/${show.id}`)}
            className="text-left group"
          >
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-secondary">
              {show.poster_url ? (
                <img
                  src={show.poster_url}
                  alt={show.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  No poster
                </div>
              )}
            </div>
            <p className="text-xs font-medium text-foreground mt-1.5 truncate">{show.title}</p>
            {show.release_year && (
              <p className="text-[10px] text-muted-foreground">{show.release_year}</p>
            )}
          </button>
        ))}
      </div>

      {!isLoading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">No shows found</p>
      )}
    </div>
  );
};

export default ShowsPage;
