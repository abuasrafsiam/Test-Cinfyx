import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMovies } from "@/hooks/useMovies";
import { useShows } from "@/hooks/useShows";
import { Skeleton } from "@/components/ui/skeleton";

const CONTENT_TABS = ["Movies", "Shows"] as const;
const MOVIE_FILTERS = ["All", "Trending", "Latest", "Action", "Anime"];
const SHOW_FILTERS = ["All"];

const MoviesPage = () => {
  const { data: movies = [], isLoading: moviesLoading } = useMovies();
  const { data: shows = [], isLoading: showsLoading } = useShows();
  const [contentTab, setContentTab] = useState<(typeof CONTENT_TABS)[number]>("Movies");
  const [movieFilter, setMovieFilter] = useState("All");
  const navigate = useNavigate();

  const filteredMovies =
    movieFilter === "All"
      ? movies
      : movies.filter(
          (m) => m.category === movieFilter || m.genre?.toLowerCase().includes(movieFilter.toLowerCase())
        );

  const isLoading = contentTab === "Movies" ? moviesLoading : showsLoading;
  const filters = contentTab === "Movies" ? MOVIE_FILTERS : SHOW_FILTERS;
  const activeFilter = contentTab === "Movies" ? movieFilter : "All";

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-foreground">Browse</h1>
      </div>

      {/* Content tabs */}
      <div className="px-4 flex gap-2 pb-2">
        {CONTENT_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setContentTab(t)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              contentTab === t
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Sub-filters */}
      {filters.length > 1 && (
        <div className="px-4 flex gap-2 overflow-x-auto no-scrollbar pb-3">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setMovieFilter(f)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                activeFilter === f
                  ? "bg-foreground/10 text-foreground"
                  : "bg-secondary/40 text-muted-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="px-4 grid grid-cols-3 gap-3">
        {isLoading &&
          Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] rounded-xl" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}

        {contentTab === "Movies" &&
          filteredMovies.map((movie) => (
            <button key={movie.id} onClick={() => navigate(`/movie/${movie.id}`)} className="text-left group">
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
              {movie.category && <p className="text-[10px] text-muted-foreground truncate">{movie.category}</p>}
            </button>
          ))}

        {contentTab === "Shows" &&
          shows.map((show) => (
            <button key={show.id} onClick={() => navigate(`/show/${show.id}`)} className="text-left group">
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
              {show.release_year && <p className="text-[10px] text-muted-foreground truncate">{show.release_year}</p>}
            </button>
          ))}
      </div>

      {!isLoading && contentTab === "Movies" && filteredMovies.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">No movies found</p>
      )}
      {!isLoading && contentTab === "Shows" && shows.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">No shows found</p>
      )}
    </div>
  );
};

export default MoviesPage;
