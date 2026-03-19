import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import MovieRow from "@/components/MovieRow";
import ShowRow from "@/components/ShowRow";
import { useShows } from "@/hooks/useShows";
import appLogo from "@/assets/cinefyx-logo.png";

const categories = [
  { title: "🔥 Trending", category: "Trending" },
  { title: "🆕 Latest", category: "Latest" },
  { title: "💥 Action", category: "Action" },
  { title: "🎌 Anime", category: "Anime" },
];

const Index = () => {
  const navigate = useNavigate();
  const { data: shows = [], isLoading: showsLoading } = useShows();

  return (
    <div className="pb-16">
      {/* Header with logo + search */}
      <div className="px-3 pt-1.5 pb-1 flex items-center gap-2">
        <img src={appLogo} alt="App logo" className="w-10 h-auto shrink-0" />
        <div
          onClick={() => navigate("/search")}
          className="flex-1 relative cursor-pointer"
        >
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <div className="w-full rounded-full bg-secondary pl-8 pr-3 py-1.5 text-xs text-muted-foreground ring-1 ring-border">
            Search movies &amp; shows...
          </div>
        </div>
        <button onClick={() => navigate("/search")} className="shrink-0 p-1.5 text-foreground">
          <Search className="w-4 h-4" />
        </button>
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
