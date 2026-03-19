import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useSearchMovies, useMovies } from "@/hooks/useMovies";
import appLogo from "@/assets/cinefyx-logo.png";

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const { data: searchResults = [] } = useSearchMovies(query);
  const { data: allMovies = [] } = useMovies();
  const navigate = useNavigate();

  const movies = query.length > 0 ? searchResults : allMovies;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-3 pb-2 sticky top-0 z-10 bg-background/95 backdrop-blur-sm flex items-center gap-3">
        <img src={appLogo} alt="App logo" className="w-14 h-auto shrink-0" onClick={() => navigate("/")} />
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies & shows..."
            autoFocus
            className="w-full rounded-full bg-secondary pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none ring-1 ring-border focus:ring-primary transition-colors"
          />
        </div>
        <button className="shrink-0 p-2 text-foreground">
          <Search className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 px-4">
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
