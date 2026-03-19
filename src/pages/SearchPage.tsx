import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, X } from "lucide-react";
import { useSearchMovies, useMovies } from "@/hooks/useMovies";

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const { data: searchResults = [] } = useSearchMovies(query);
  const { data: allMovies = [] } = useMovies();
  const navigate = useNavigate();

  const movies = query.length > 0 ? searchResults : allMovies;

  return (
    <div className="min-h-screen bg-background">
      {/* Search header */}
      <div className="px-3 pt-3 pb-3 sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-foreground hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies & shows..."
              autoFocus
              className="w-full rounded-full bg-secondary pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none ring-1 ring-border focus:ring-primary transition-colors"
            />
            {query.length > 0 && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-3 gap-3 p-4">
        {movies.map((movie) => (
          <button
            key={movie.id}
            onClick={() => navigate(`/movie/${movie.id}`)}
            className="focus:outline-none group text-left"
          >
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-secondary shadow-md">
              {movie.poster_url ? (
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-2 text-center">
                  {movie.title}
                </div>
              )}
            </div>
            <p className="text-xs text-foreground/80 mt-1.5 truncate font-medium">
              {movie.title}
            </p>
          </button>
        ))}
      </div>

      {movies.length === 0 && query.length > 0 && (
        <div className="flex flex-col items-center justify-center mt-20 gap-2">
          <Search className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No results for "{query}"</p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
