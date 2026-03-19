import { User, ChevronRight } from "lucide-react";

const ProfilePage = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Guest User</h1>
            <p className="text-xs text-muted-foreground">Welcome to the app</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-2 space-y-1">
        {[
          { label: "Favorites", desc: "Your saved movies & shows" },
          { label: "Watchlist", desc: "Continue watching later" },
          { label: "Downloads", desc: "Offline content" },
          { label: "Settings", desc: "App preferences" },
        ].map((item) => (
          <button
            key={item.label}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfilePage;
