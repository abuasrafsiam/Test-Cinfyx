import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMovies } from "@/hooks/useMovies";
import { Skeleton } from "@/components/ui/skeleton";

const FILTERS = ["All", "Trending", "Latest", "Action", "Anime"];

const MoviesPage = () => {
  const { data: movies = [], isLoading } = useMovies();
  const [filter, setFilter] = useState("All");
  const navigate = useNavigate();

  const filtered = filter === "All" ? movies : movies.filter((m) => m.category === filter || m.genre?.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-foreground">Movies</h1>
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
        {filtered.map((movie) => (
          <button
            key={movie.id}
            onClick={() => navigate(`/movie/${movie.id}`)}
            className="text-left group"
          >
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-secondary">
              {movie.poster_url ? (
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  No poster
                </div>
              )}
            </div>
            <p className="text-xs font-medium text-foreground mt-1.5 truncate">{movie.title}</p>
            {movie.category && (
              <p className="text-[10px] text-muted-foreground truncate">{movie.category}</p>
            )}
          </button>
        ))}
      </div>

      {!isLoading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">No movies found</p>
      )}
    </div>
  );
};

export default MoviesPage;
