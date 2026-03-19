import { useState, useEffect, useCallback } from "react";

export interface DownloadItem {
  id: string;
  type: "movie" | "episode";
  title: string;
  subtitle?: string; // e.g. "S1 E3"
  posterUrl?: string;
  videoUrl: string;
  progress: number; // 0-100
  status: "downloading" | "paused" | "completed" | "failed";
  addedAt: number;
  size?: string;
}

const STORAGE_KEY = "app_downloads";

function loadDownloads(): DownloadItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveDownloads(items: DownloadItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useDownloads() {
  const [downloads, setDownloads] = useState<DownloadItem[]>(loadDownloads);

  useEffect(() => {
    saveDownloads(downloads);
  }, [downloads]);

  // Simulate download progress for active downloads
  useEffect(() => {
    const active = downloads.filter((d) => d.status === "downloading");
    if (active.length === 0) return;

    const interval = setInterval(() => {
      setDownloads((prev) => {
        let changed = false;
        const next = prev.map((d) => {
          if (d.status !== "downloading") return d;
          const increment = Math.random() * 3 + 1;
          const newProgress = Math.min(d.progress + increment, 100);
          changed = true;
          return {
            ...d,
            progress: newProgress,
            status: newProgress >= 100 ? ("completed" as const) : d.status,
          };
        });
        return changed ? next : prev;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [downloads.filter((d) => d.status === "downloading").length]);

  const addDownload = useCallback((item: Omit<DownloadItem, "progress" | "status" | "addedAt">) => {
    setDownloads((prev) => {
      if (prev.some((d) => d.id === item.id)) return prev;
      return [
        { ...item, progress: 0, status: "downloading", addedAt: Date.now() },
        ...prev,
      ];
    });
  }, []);

  const pauseDownload = useCallback((id: string) => {
    setDownloads((prev) =>
      prev.map((d) => (d.id === id && d.status === "downloading" ? { ...d, status: "paused" } : d))
    );
  }, []);

  const resumeDownload = useCallback((id: string) => {
    setDownloads((prev) =>
      prev.map((d) => (d.id === id && d.status === "paused" ? { ...d, status: "downloading" } : d))
    );
  }, []);

  const cancelDownload = useCallback((id: string) => {
    setDownloads((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const isDownloaded = useCallback(
    (id: string) => downloads.some((d) => d.id === id),
    [downloads]
  );

  const getDownloadStatus = useCallback(
    (id: string) => downloads.find((d) => d.id === id),
    [downloads]
  );

  return { downloads, addDownload, pauseDownload, resumeDownload, cancelDownload, isDownloaded, getDownloadStatus };
}
