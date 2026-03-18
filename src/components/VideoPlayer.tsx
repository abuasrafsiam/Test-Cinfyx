import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play, Pause, ArrowLeft, Maximize, Minimize, RotateCcw, RotateCw,
  Settings, Lock, Unlock, Gauge, Subtitles, Ratio,
} from "lucide-react";

interface VideoPlayerProps {
  url: string;
  title: string;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const QUALITIES = ["Auto", "1080p", "720p", "480p"];
const ASPECTS: { label: string; value: string }[] = [
  { label: "Fit", value: "contain" },
  { label: "Fill", value: "cover" },
  { label: "Stretch", value: "fill" },
];

const VideoPlayer = ({ url, title }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [locked, setLocked] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [aspectIdx, setAspectIdx] = useState(0);
  const [activePanel, setActivePanel] = useState<"speed" | "quality" | null>(null);
  const [selectedQuality, setSelectedQuality] = useState("Auto");
  const [seekIndicator, setSeekIndicator] = useState<{ side: "left" | "right"; seconds: number } | null>(null);

  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const doubleTapTimer = useRef<ReturnType<typeof setTimeout>>();
  const tapCount = useRef(0);
  const seekIndicatorTimer = useRef<ReturnType<typeof setTimeout>>();
  const navigate = useNavigate();

  // Auto-play + landscape + fullscreen on mount
  useEffect(() => {
    const v = videoRef.current;
    if (v) {
      v.play().then(() => setPlaying(true)).catch(() => {});
    }
    try { screen.orientation?.lock?.("landscape").catch(() => {}); } catch {}
    const goFS = async () => {
      try {
        if (containerRef.current && !document.fullscreenElement) {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } catch {}
    };
    goFS();
    return () => { try { screen.orientation?.unlock?.(); } catch {} };
  }, []);

  const resetHideTimer = useCallback(() => {
    if (locked) return;
    setShowControls(true);
    clearTimeout(hideTimer.current);
    if (playing) {
      hideTimer.current = setTimeout(() => {
        setShowControls(false);
        setActivePanel(null);
      }, 3000);
    }
  }, [playing, locked]);

  useEffect(() => {
    resetHideTimer();
    return () => clearTimeout(hideTimer.current);
  }, [playing, resetHideTimer]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };

  const seek = (delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + delta));
    setCurrentTime(v.currentTime);
    // Show seek indicator
    const side = delta > 0 ? "right" : "left";
    setSeekIndicator({ side, seconds: Math.abs(delta) });
    clearTimeout(seekIndicatorTimer.current);
    seekIndicatorTimer.current = setTimeout(() => setSeekIndicator(null), 600);
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const time = parseFloat(e.target.value);
    v.currentTime = time;
    setCurrentTime(time);
  };

  const handleBack = async () => {
    const v = videoRef.current;
    if (v) { v.pause(); setPlaying(false); }
    if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch {} }
    try { screen.orientation?.unlock?.(); } catch {}
    navigate(-1);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) await containerRef.current.requestFullscreen();
    else await document.exitFullscreen();
  };

  const changeSpeed = (s: number) => {
    setSpeed(s);
    if (videoRef.current) videoRef.current.playbackRate = s;
    setActivePanel(null);
  };

  const cycleAspect = () => {
    setAspectIdx((prev) => (prev + 1) % ASPECTS.length);
  };

  const toggleLock = () => {
    setLocked((prev) => {
      if (!prev) {
        setShowControls(false);
        setActivePanel(null);
      } else {
        setShowControls(true);
      }
      return !prev;
    });
  };

  // Double-tap detection for seek gestures
  const handleAreaTap = (side: "left" | "right") => {
    tapCount.current += 1;
    if (tapCount.current === 1) {
      doubleTapTimer.current = setTimeout(() => {
        tapCount.current = 0;
        // Single tap — toggle controls
        if (!locked) {
          setShowControls((p) => !p);
          if (!showControls) resetHideTimer();
        }
      }, 250);
    } else if (tapCount.current >= 2) {
      clearTimeout(doubleTapTimer.current);
      tapCount.current = 0;
      if (!locked) {
        seek(side === "left" ? -10 : 10);
      }
    }
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-background flex items-center justify-center select-none"
      onMouseMove={() => { if (!locked) resetHideTimer(); }}
    >
      <video
        ref={videoRef}
        src={url}
        className="w-full h-full"
        style={{ objectFit: ASPECTS[aspectIdx].value as any }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => { if (videoRef.current) setDuration(videoRef.current.duration); }}
        onEnded={() => setPlaying(false)}
        playsInline
      />

      {/* Double-tap zones */}
      <div className="absolute inset-0 flex">
        <div className="flex-1" onClick={() => handleAreaTap("left")} />
        <div className="flex-1" onClick={() => handleAreaTap("right")} />
      </div>

      {/* Seek indicator */}
      {seekIndicator && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 ${seekIndicator.side === "left" ? "left-16" : "right-16"} flex flex-col items-center animate-fade-in`}
        >
          {seekIndicator.side === "left" ? (
            <RotateCcw className="w-8 h-8 text-foreground/80" />
          ) : (
            <RotateCw className="w-8 h-8 text-foreground/80" />
          )}
          <span className="text-xs text-foreground/80 mt-1">{seekIndicator.seconds}s</span>
        </div>
      )}

      {/* Locked state — just show unlock button */}
      {locked && (
        <button
          onClick={toggleLock}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-background/40 backdrop-blur-sm flex items-center justify-center"
        >
          <Lock className="w-5 h-5 text-foreground/80" />
        </button>
      )}

      {/* Controls overlay */}
      {!locked && (
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-background/40 pointer-events-none" />

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 px-4 py-3 flex items-center justify-between z-10">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={handleBack} className="shrink-0 w-9 h-9 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform">
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <span className="text-sm font-medium text-foreground truncate">{title}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleLock}
                className="w-9 h-9 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
              >
                <Unlock className="w-4 h-4 text-foreground/80" />
              </button>
              <button
                onClick={() => setActivePanel(activePanel === "speed" ? null : "speed")}
                className="w-9 h-9 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
              >
                <Settings className="w-4 h-4 text-foreground/80" />
              </button>
            </div>
          </div>

          {/* Center controls */}
          <div className="absolute inset-0 flex items-center justify-center gap-12 z-10 pointer-events-none">
            <button
              onClick={() => seek(-10)}
              className="pointer-events-auto w-12 h-12 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
            >
              <RotateCcw className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={togglePlay}
              className="pointer-events-auto w-16 h-16 rounded-full bg-foreground/20 backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform"
            >
              {playing ? (
                <Pause className="w-8 h-8 text-foreground" />
              ) : (
                <Play className="w-8 h-8 text-foreground ml-1" />
              )}
            </button>
            <button
              onClick={() => seek(10)}
              className="pointer-events-auto w-12 h-12 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
            >
              <RotateCw className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 z-10">
            {/* Time row */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] text-foreground/70 tabular-nums w-12">{formatTime(currentTime)}</span>
              <div className="flex-1 relative h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                <div
                  className="absolute h-full bg-foreground/20 rounded-full"
                  style={{ width: `${bufferedPct}%` }}
                />
                <div
                  className="absolute h-full bg-primary rounded-full"
                  style={{ width: `${progress}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <span className="text-[11px] text-foreground/70 tabular-nums w-12 text-right">{formatTime(duration)}</span>
            </div>

            {/* Bottom icon row */}
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-1">
                <button onClick={togglePlay} className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform">
                  {playing ? <Pause className="w-4 h-4 text-foreground" /> : <Play className="w-4 h-4 text-foreground ml-0.5" />}
                </button>
              </div>
              <div className="flex items-center gap-1">
                {/* Speed */}
                <button
                  onClick={() => setActivePanel(activePanel === "speed" ? null : "speed")}
                  className="h-8 px-2.5 rounded-lg bg-background/30 backdrop-blur-sm flex items-center gap-1 active:scale-95 transition-transform"
                >
                  <Gauge className="w-3.5 h-3.5 text-foreground/70" />
                  <span className="text-[11px] text-foreground/80 font-medium">{speed}x</span>
                </button>
                {/* Aspect */}
                <button
                  onClick={cycleAspect}
                  className="h-8 px-2.5 rounded-lg bg-background/30 backdrop-blur-sm flex items-center gap-1 active:scale-95 transition-transform"
                >
                  <Ratio className="w-3.5 h-3.5 text-foreground/70" />
                  <span className="text-[11px] text-foreground/80 font-medium">{ASPECTS[aspectIdx].label}</span>
                </button>
                {/* Quality */}
                <button
                  onClick={() => setActivePanel(activePanel === "quality" ? null : "quality")}
                  className="h-8 px-2.5 rounded-lg bg-background/30 backdrop-blur-sm flex items-center gap-1 active:scale-95 transition-transform"
                >
                  <span className="text-[11px] text-foreground/80 font-medium">{selectedQuality}</span>
                </button>
                {/* Fullscreen */}
                <button onClick={toggleFullscreen} className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform">
                  {isFullscreen ? <Minimize className="w-4 h-4 text-foreground" /> : <Maximize className="w-4 h-4 text-foreground" />}
                </button>
              </div>
            </div>
          </div>

          {/* Speed panel */}
          {activePanel === "speed" && (
            <div className="absolute bottom-20 right-4 z-20 bg-card/95 backdrop-blur-md rounded-2xl p-2 shadow-xl border border-border animate-scale-in">
              <p className="text-[11px] text-muted-foreground px-3 py-1.5">Playback Speed</p>
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => changeSpeed(s)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    speed === s ? "text-primary bg-primary/10 font-semibold" : "text-foreground/80 hover:bg-secondary"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          )}

          {/* Quality panel */}
          {activePanel === "quality" && (
            <div className="absolute bottom-20 right-4 z-20 bg-card/95 backdrop-blur-md rounded-2xl p-2 shadow-xl border border-border animate-scale-in">
              <p className="text-[11px] text-muted-foreground px-3 py-1.5">Quality</p>
              {QUALITIES.map((q) => (
                <button
                  key={q}
                  onClick={() => { setSelectedQuality(q); setActivePanel(null); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedQuality === q ? "text-primary bg-primary/10 font-semibold" : "text-foreground/80 hover:bg-secondary"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
