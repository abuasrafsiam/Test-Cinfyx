import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useActiveAnnouncements, type Announcement } from "@/hooks/useAnnouncements";
import { useMovie } from "@/hooks/useMovies";
import { X, Bell, ArrowUpCircle, ExternalLink } from "lucide-react";

const AnnouncementPopup = () => {
  const { data: announcements = [] } = useActiveAnnouncements();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [current, setCurrent] = useState<Announcement | null>(null);
  const [visible, setVisible] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const autoDismissTimer = useRef<ReturnType<typeof setTimeout>>();
  const location = useLocation();

  const movieMatch = location.pathname.match(/\/movie\/([^/]+)/);
  const currentMovieId = movieMatch?.[1] || null;
  const { data: currentMovie } = useMovie(currentMovieId || "");
  const currentCategory = currentMovie?.category || null;

  const dismiss = useCallback((id: string) => {
    setVisible(false);
    setTimeout(() => {
      setDismissed((prev) => {
        const updated = new Set(prev);
        updated.add(id);
        localStorage.setItem("dismissed_announcements", JSON.stringify([...updated]));
        return updated;
      });
      setCurrent(null);
      setDragOffset(0);
    }, 300);
  }, []);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("dismissed_announcements") || "[]");
    setDismissed(new Set<string>(stored));
  }, []);

  useEffect(() => {
    const eligible = announcements.filter((a) => {
      if (dismissed.has(a.id)) return false;
      const type = a.target_type || "all";
      if (type === "all") return true;
      if (type === "category") return currentCategory?.toLowerCase() === (a.target_value || "").toLowerCase();
      if (type === "movie") return currentMovieId === a.target_value;
      return true;
    });
    const next = eligible[0] || null;
    setCurrent(next);
    if (next) {
      setTimeout(() => setVisible(true), 100);
    }
  }, [announcements, dismissed, currentMovieId, currentCategory]);

  // Auto-dismiss
  useEffect(() => {
    clearTimeout(autoDismissTimer.current);
    if (current && current.auto_dismiss_seconds > 0 && visible) {
      autoDismissTimer.current = setTimeout(() => dismiss(current.id), current.auto_dismiss_seconds * 1000);
    }
    return () => clearTimeout(autoDismissTimer.current);
  }, [current, visible, dismiss]);

  if (location.pathname.startsWith("/admin")) return null;
  if (location.pathname.startsWith("/watch")) return null;
  if (!current) return null;

  const isUpdate = current.notification_type === "update";

  const handleTouchStart = (e: React.TouchEvent) => setTouchStartY(e.touches[0].clientY);
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const delta = e.touches[0].clientY - touchStartY;
    if (delta < 0) setDragOffset(delta);
  };
  const handleTouchEnd = () => {
    if (dragOffset < -80) {
      dismiss(current.id);
    }
    setDragOffset(0);
    setTouchStartY(null);
  };

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-background/40 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
        onClick={() => dismiss(current.id)}
      />

      {/* Card */}
      <div
        className={`absolute top-6 left-4 right-4 pointer-events-auto transition-all duration-300 ease-out ${visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}
        style={{ transform: `translateY(${visible ? dragOffset : -200}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="bg-card/95 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl shadow-background/80 overflow-hidden">
          {/* Optional image */}
          {current.image_url && (
            <img src={current.image_url} alt="" className="w-full h-28 object-cover" />
          )}

          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl shrink-0 ${isUpdate ? "bg-blue-500/15" : "bg-primary/10"}`}>
                {isUpdate ? <ArrowUpCircle className="w-5 h-5 text-blue-400" /> : <Bell className="w-5 h-5 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-foreground leading-tight">{current.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{current.message}</p>
              </div>
              <button
                onClick={() => dismiss(current.id)}
                className="shrink-0 w-7 h-7 rounded-full bg-secondary/80 flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-3">
              {isUpdate && current.link ? (
                <a
                  href={current.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => dismiss(current.id)}
                  className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold text-center transition-colors"
                >
                  Update Now
                </a>
              ) : current.link ? (
                <a
                  href={current.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" /> Learn more
                </a>
              ) : null}
              <button
                onClick={() => dismiss(current.id)}
                className={`py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium transition-colors ${isUpdate && current.link ? "px-5" : "flex-1"}`}
              >
                Dismiss
              </button>
            </div>
          </div>

          {/* Swipe hint */}
          <div className="flex justify-center pb-2">
            <div className="w-8 h-1 rounded-full bg-muted-foreground/20" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementPopup;
