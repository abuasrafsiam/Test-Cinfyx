import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import MovieRow from "@/components/MovieRow";
import ShowRow from "@/components/ShowRow";
import { useShows } from "@/hooks/useShows";
import appLogo from "@/assets/logo.png";

const categories = [
  { title: "🔥 Trending", category: "Trending" },
  { title: "🆕 Latest", category: "Latest" },
  { title: "💥 Action", category: "Action" },
  { title: "🎌 Anime", category: "Anime" },
];

const Index = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { data: shows = [], isLoading: showsLoading } = useShows();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="pb-16">
      {/* Header with logo + search */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-3">
        <img src={appLogo} alt="App logo" className="w-9 h-9 rounded-lg shrink-0" />
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies & shows..."
              className="w-full rounded-full bg-secondary pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none ring-1 ring-border focus:ring-primary transition-colors"
            />
          </div>
        </form>
      </div>

      <FeaturedCarousel />
      <div className="mt-6">
        {categories.map(({ title, category }) => (
          <MovieRow key={category} title={title} category={category} />
        ))}

        {/* Shows row */}
        <ShowRow title="📺 TV Shows" shows={shows} isLoading={showsLoading} />
      </div>
    </div>
  );
};

export default Index;
