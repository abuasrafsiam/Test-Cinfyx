import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, X, Clock, TrendingUp, Trash2, Film, Tv } from "lucide-react";
import { useSearchMovies, useMovies } from "@/hooks/useMovies";
import { useShows, useSearchShows } from "@/hooks/useShows";

const RECENT_KEY = "cinefyx_recent_searches";
const MAX_RECENT = 10;

const getRecent = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveRecent = (term: string) => {
  const list = getRecent().filter((t) => t !== term);
  list.unshift(term);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
};

const clearRecent = () => localStorage.removeItem(RECENT_KEY);

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecent());
  const { data: searchMovies = [] } = useSearchMovies(query);
  const { data: searchShows = [] } = useSearchShows(query);
  const { data: allMovies = [] } = useMovies();
  const { data: allShows = [] } = useShows();
  const navigate = useNavigate();

  // Combine search results from movies and shows
  const searchResults = [...searchMovies, ...searchShows];

  // "Everyone Searching" — trending: pick movies and shows with featured flag
  const trendingMovies = allMovies.filter((m) => m.featured).slice(0, 3);
  const trendingShows = allShows.filter((s) => s.featured).slice(0, 3);
  const trendingFallback = [...trendingMovies, ...trendingShows].length > 0 ? [...trendingMovies, ...trendingShows] : [...allMovies.slice(0, 3), ...allShows.slice(0, 3)];

  const handleSearch = useCallback(
    (term: string) => {
      setQuery(term);
      if (term.trim()) {
        saveRecent(term.trim());
        setRecentSearches(getRecent());
      }
    },
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecent(query.trim());
      setRecentSearches(getRecent());
    }
  };

  const handleClearRecent = () => {
    clearRecent();
    setRecentSearches([]);
  };

  const results = query.length > 0 ? searchResults : [];
  const showEmpty = query.length > 0 && results.length === 0;
  const showIdleState = query.length === 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Search header */}
      <form onSubmit={handleSubmit} className="px-3 pt-3 pb-3 sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/")}
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
              onBlur={() => {
                if (query.trim()) {
                  saveRecent(query.trim());
                  setRecentSearches(getRecent());
                }
              }}
              placeholder="Search movies & shows..."
              autoFocus
              className="w-full rounded-full bg-secondary pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none ring-1 ring-border focus:ring-primary transition-colors"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Idle state: Recent + Trending */}
      {showIdleState && (
        <div className="px-4 pt-4 space-y-6">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-foreground">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Recent</h3>
                </div>
                <button
                  onClick={handleClearRecent}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSearch(term)}
                    className="px-3 py-1.5 rounded-full bg-secondary text-xs text-foreground font-medium hover:bg-accent transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Everyone Searching */}
          <section>
            <div className="flex items-center gap-2 mb-3 text-foreground">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Everyone Searching</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {trendingFallback.map((item) => {
                const isMovie = 'video_url' in item;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(isMovie ? `/movie/${item.id}` : `/show/${item.id}`)}
                    className="focus:outline-none group text-left"
                  >
                    <div className="aspect-[2/3] rounded-xl overflow-hidden bg-secondary shadow-md relative">
                      {item.poster_url ? (
                        <img
                          src={item.poster_url}
                          alt={item.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-2 text-center">
                          {item.title}
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 bg-black/80 rounded-full p-1.5">
                        {isMovie ? <Film className="w-3 h-3 text-yellow-400" /> : <Tv className="w-3 h-3 text-blue-400" />}
                      </div>
                    </div>
                    <p className="text-xs text-foreground/80 mt-1.5 truncate font-medium">{item.title}</p>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* Search results */}
      {!showIdleState && results.length > 0 && (
        <div className="grid grid-cols-3 gap-3 p-4">
          {results.map((item) => {
            const isMovie = 'video_url' in item;
            return (
            <button
              key={item.id}
              onClick={() => navigate(isMovie ? `/movie/${item.id}` : `/show/${item.id}`)}
              className="focus:outline-none group text-left"
            >
              <div className="aspect-[2/3] rounded-xl overflow-hidden bg-secondary shadow-md relative">
                {item.poster_url ? (
                  <img
                    src={item.poster_url}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-2 text-center">
                    {item.title}
                  </div>
                )}
                <div className="absolute bottom-2 right-2 bg-black/80 rounded-full p-1.5">
                  {isMovie ? <Film className="w-3 h-3 text-yellow-400" /> : <Tv className="w-3 h-3 text-blue-400" />}
                </div>
              </div>
              <p className="text-xs text-foreground/80 mt-1.5 truncate font-medium">{item.title}</p>
            </button>
            );
          })}
        </div>
      )}

      {/* No results */}
      {showEmpty && (
        <div className="flex flex-col items-center justify-center mt-20 gap-2">
          <Search className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No results for "{query}"</p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
