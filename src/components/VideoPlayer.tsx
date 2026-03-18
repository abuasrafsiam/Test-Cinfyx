import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Pause, ArrowLeft, Maximize, Minimize } from "lucide-react";

interface VideoPlayerProps {
  url: string;
  title: string;
}

const VideoPlayer = ({ url, title }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const navigate = useNavigate();

  // Auto-play and request landscape on mount
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const playVideo = async () => {
      try {
        await v.play();
        setPlaying(true);
      } catch {
        // Autoplay blocked by browser, user will tap play
      }
    };
    playVideo();

    // Request landscape orientation
    try {
      screen.orientation?.lock?.("landscape").catch(() => {});
    } catch {}

    // Request fullscreen
    const goFullscreen = async () => {
      try {
        if (containerRef.current && !document.fullscreenElement) {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } catch {}
    };
    goFullscreen();

    return () => {
      // Unlock orientation on unmount
      try {
        screen.orientation?.unlock?.();
      } catch {}
    };
  }, []);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    if (playing) {
      hideTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [playing]);

  useEffect(() => {
    resetHideTimer();
    return () => clearTimeout(hideTimer.current);
  }, [playing, resetHideTimer]);

  // Listen for fullscreen exit
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    if (v.buffered.length > 0) {
      setBuffered(v.buffered.end(v.buffered.length - 1));
    }
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
    if (v) {
      v.pause();
      setPlaying(false);
    }
    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch {}
    }
    try { screen.orientation?.unlock?.(); } catch {}
    navigate(-1);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-background flex items-center justify-center"
      onClick={resetHideTimer}
      onMouseMove={resetHideTimer}
    >
      <video
        ref={videoRef}
        src={url}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (videoRef.current) setDuration(videoRef.current.duration);
        }}
        onEnded={() => setPlaying(false)}
        onClick={togglePlay}
        playsInline
      />

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-background/80 to-transparent flex items-center gap-3">
          <button onClick={handleBack} className="text-foreground transition-transform active:scale-90">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <span className="text-sm font-medium text-foreground truncate">{title}</span>
        </div>

        {/* Center play button */}
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-16 h-16 rounded-full bg-primary/80 flex items-center justify-center backdrop-blur-sm transition-transform active:scale-90">
            {playing ? (
              <Pause className="w-7 h-7 text-primary-foreground" />
            ) : (
              <Play className="w-7 h-7 text-primary-foreground ml-1" />
            )}
          </div>
        </button>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/80 to-transparent">
          {/* Progress bar */}
          <div className="relative w-full h-1 bg-muted rounded-full mb-3">
            <div
              className="absolute h-full bg-muted-foreground/30 rounded-full"
              style={{ width: duration ? `${(buffered / duration) * 100}%` : "0%" }}
            />
            <div
              className="absolute h-full bg-primary rounded-full"
              style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
            />
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <button onClick={togglePlay} className="transition-transform active:scale-90">
              {playing ? (
                <Pause className="w-5 h-5 text-foreground" />
              ) : (
                <Play className="w-5 h-5 text-foreground" />
              )}
            </button>

            <span className="text-xs text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <button onClick={toggleFullscreen} className="transition-transform active:scale-90">
              {isFullscreen ? (
                <Minimize className="w-5 h-5 text-foreground" />
              ) : (
                <Maximize className="w-5 h-5 text-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
