import FeaturedCarousel from "@/components/FeaturedCarousel";
import MovieRow from "@/components/MovieRow";

const categories = [
  { title: "🔥 Trending", category: "Trending" },
  { title: "🆕 Latest", category: "Latest" },
  { title: "💥 Action", category: "Action" },
  { title: "🎌 Anime", category: "Anime" },
];

const Index = () => {
  return (
    <div className="pb-16">
      <FeaturedCarousel />
      <div className="-mt-10 relative z-10">
        {categories.map(({ title, category }) => (
          <MovieRow key={category} title={title} category={category} />
        ))}
      </div>
    </div>
  );
};

export default Index;
