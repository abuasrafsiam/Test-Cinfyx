import { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useActiveAnnouncements } from "@/hooks/useAnnouncements";
import { useMovie } from "@/hooks/useMovies";
import { X, ExternalLink, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const AnnouncementPopup = () => {
  const { data: announcements = [] } = useActiveAnnouncements();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [current, setCurrent] = useState<string | null>(null);
  const location = useLocation();

  // Get current movie context if on a movie page
  const movieMatch = location.pathname.match(/\/movie\/([^/]+)/);
  const currentMovieId = movieMatch?.[1] || null;
  const { data: currentMovie } = useMovie(currentMovieId || "");

  // Determine current category from the page context
  const currentCategory = currentMovie?.category || null;

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("dismissed_announcements") || "[]");
    const dismissedSet = new Set<string>(stored);
    setDismissed(dismissedSet);

    // Filter announcements based on targeting
    const eligible = announcements.filter((a) => {
      if (dismissedSet.has(a.id)) return false;
      const type = a.target_type || "all";
      if (type === "all") return true;
      if (type === "category") return currentCategory && currentCategory.toLowerCase() === (a.target_value || "").toLowerCase();
      if (type === "movie") return currentMovieId === a.target_value;
      return true;
    });

    setCurrent(eligible[0]?.id || null);
  }, [announcements, currentMovieId, currentCategory]);

  const dismiss = (id: string) => {
    const updated = new Set(dismissed);
    updated.add(id);
    setDismissed(updated);
    localStorage.setItem("dismissed_announcements", JSON.stringify([...updated]));
    const eligible = announcements.filter((a) => {
      if (updated.has(a.id)) return false;
      const type = a.target_type || "all";
      if (type === "all") return true;
      if (type === "category") return currentCategory && currentCategory.toLowerCase() === (a.target_value || "").toLowerCase();
      if (type === "movie") return currentMovieId === a.target_value;
      return true;
    });
    setCurrent(eligible[0]?.id || null);
  };

  // Don't show on admin pages
  if (location.pathname.startsWith("/admin")) return null;

  const announcement = announcements.find((a) => a.id === current);
  if (!announcement) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-background/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-sm rounded-2xl p-5 border border-border shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-primary/10 shrink-0">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-foreground">{announcement.title}</h3>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{announcement.message}</p>
            {announcement.link && (
              <a
                href={announcement.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary mt-3 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Link
              </a>
            )}
          </div>
          <button onClick={() => dismiss(announcement.id)} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        <Button onClick={() => dismiss(announcement.id)} variant="secondary" className="w-full mt-4 h-9">
          Got it
        </Button>
      </div>
    </div>
  );
};

export default AnnouncementPopup;
