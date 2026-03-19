import { useDownloads, type DownloadItem } from "@/hooks/useDownloads";
import { Download, Pause, Play, Trash2, CheckCircle2, AlertCircle, Film } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

const TABS = ["All", "Movies", "Shows"] as const;

const DownloadsPage = () => {
  const { downloads, pauseDownload, resumeDownload, cancelDownload } = useDownloads();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("All");

  const filtered = downloads.filter((d) => {
    if (activeTab === "Movies") return d.type === "movie";
    if (activeTab === "Shows") return d.type === "episode";
    return true;
  });

  const statusIcon = (d: DownloadItem) => {
    switch (d.status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Download className="w-5 h-5" /> Downloads
        </h1>
      </div>

      {/* Tabs */}
      <div className="px-4 flex gap-2 pb-3">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === t
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Film className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            No downloads yet. Download movies & episodes from their detail pages.
          </p>
        </div>
      ) : (
        <div className="px-4 space-y-2">
          {filtered.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 transition-colors"
            >
              {/* Poster */}
              <div className="w-14 h-20 rounded-lg overflow-hidden bg-secondary shrink-0">
                {d.posterUrl ? (
                  <img src={d.posterUrl} alt={d.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Film className="w-5 h-5" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {statusIcon(d)}
                  <p className="text-sm font-medium text-foreground truncate">{d.title}</p>
                </div>
                {d.subtitle && (
                  <p className="text-[10px] text-muted-foreground">{d.subtitle}</p>
                )}

                {(d.status === "downloading" || d.status === "paused") && (
                  <div className="mt-1.5">
                    <Progress value={d.progress} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {Math.round(d.progress)}% • {d.status === "paused" ? "Paused" : "Downloading"}
                    </p>
                  </div>
                )}

                {d.status === "completed" && (
                  <button
                    onClick={() =>
                      d.type === "movie"
                        ? navigate(`/watch/${d.id}`)
                        : navigate(`/watch/episode/${d.id}`)
                    }
                    className="mt-1 text-[11px] font-semibold text-primary"
                  >
                    ▶ Play offline
                  </button>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-col gap-1.5 shrink-0">
                {d.status === "downloading" && (
                  <button
                    onClick={() => pauseDownload(d.id)}
                    className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
                  >
                    <Pause className="w-3.5 h-3.5 text-foreground" />
                  </button>
                )}
                {d.status === "paused" && (
                  <button
                    onClick={() => resumeDownload(d.id)}
                    className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"
                  >
                    <Play className="w-3.5 h-3.5 text-primary" />
                  </button>
                )}
                <button
                  onClick={() => cancelDownload(d.id)}
                  className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center"
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DownloadsPage;
