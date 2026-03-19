import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMovies } from "@/hooks/useMovies";
import { useShows } from "@/hooks/useShows";
import { Skeleton } from "@/components/ui/skeleton";

const FILTERS = ["All", "Movies", "Shows", "Trending", "Action", "Anime"];

const MoviesPage = () => {
  const { data: movies = [], isLoading: moviesLoading } = useMovies();
  const { data: shows = [], isLoading: showsLoading } = useShows();
  const [filter, setFilter] = useState("All");
  const navigate = useNavigate();

  const isLoading = moviesLoading || showsLoading;

  // Normalize into a unified list
  const allItems = [
    ...movies.map((m) => ({ ...m, type: "movie" as const })),
    ...shows.map((s) => ({ id: s.id, title: s.title, poster_url: s.poster_url, category: s.genre, genre: s.genre, year: s.release_year, type: "show" as const })),
  ];

  const filtered = (() => {
    if (filter === "All") return allItems;
    if (filter === "Movies") return allItems.filter((i) => i.type === "movie");
    if (filter === "Shows") return allItems.filter((i) => i.type === "show");
    return allItems.filter((i) => i.category?.toLowerCase().includes(filter.toLowerCase()) || i.genre?.toLowerCase().includes(filter.toLowerCase()));
  })();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-foreground">Movies & Shows</h1>
      </div>

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

      <div className="px-4 grid grid-cols-3 gap-3">
        {isLoading &&
          Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] rounded-xl" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.type === "movie" ? `/movie/${item.id}` : `/show/${item.id}`)}
            className="text-left group"
          >
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-secondary">
              {item.poster_url ? (
                <img
                  src={item.poster_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  No poster
                </div>
              )}
            </div>
            <p className="text-xs font-medium text-foreground mt-1.5 truncate">{item.title}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {item.type === "show" ? "TV Show" : item.category || "Movie"}
            </p>
          </button>
        ))}
      </div>

      {!isLoading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">No content found</p>
      )}
    </div>
  );
};

export default MoviesPage;
