import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearchMovies, useMovies } from "@/hooks/useMovies";

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const { data: searchResults = [] } = useSearchMovies(query);
  const { data: allMovies = [] } = useMovies();
  const navigate = useNavigate();

  const movies = query.length > 0 ? searchResults : allMovies;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search movies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 bg-secondary border-0 rounded-xl h-11"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 px-4">
        {movies.map((movie) => (
          <button
            key={movie.id}
            onClick={() => navigate(`/movie/${movie.id}`)}
            className="focus:outline-none group"
          >
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-secondary">
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
            <p className="text-xs text-foreground/80 mt-1.5 truncate text-left">
              {movie.title}
            </p>
          </button>
        ))}
      </div>

      {movies.length === 0 && query.length > 0 && (
        <div className="flex items-center justify-center mt-20">
          <p className="text-muted-foreground text-sm">No results found</p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
