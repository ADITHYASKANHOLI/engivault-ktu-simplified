"use client";

import React, { useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, VideoOff } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { extractYouTubeVideoId, getYouTubeEmbedUrl } from "@/lib/utils/youtube";

interface VideoPlayerProps {
  youtubeUrl?: string | null;
  youtubeVideoId?: string | null;
  playbackUrl?: string | null;
  title: string;
  durationSeconds?: number | null;
  posterUrl?: string | null;
}

export function VideoPlayer({
  youtubeUrl,
  youtubeVideoId,
  playbackUrl,
  title,
  durationSeconds,
  posterUrl,
}: VideoPlayerProps) {
  // Extract and sanitize YouTube video ID
  const resolvedVideoId =
    (youtubeVideoId && /^[a-zA-Z0-9_-]{11}$/.test(youtubeVideoId))
      ? youtubeVideoId
      : extractYouTubeVideoId(youtubeUrl || playbackUrl);

  // State for legacy HTML5 fallback player if an old uploaded MP4 is present
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);

  // 1. PRIMARY: YouTube Embedded Player
  if (resolvedVideoId) {
    const embedUrl = getYouTubeEmbedUrl(resolvedVideoId);
    return (
      <div className="relative aspect-video w-full rounded-2xl bg-black border border-slate-800 shadow-2xl overflow-hidden select-none">
        <iframe
          src={`${embedUrl}?rel=0&modestbranding=1&enablejsapi=1`}
          title={title}
          className="w-full h-full border-0 rounded-2xl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  // 2. BACKWARD COMPATIBILITY: Legacy uploaded MP4 video playback
  const isDirectVideoUrl =
    Boolean(playbackUrl) &&
    !hasError &&
    (playbackUrl!.includes(".mp4") ||
      playbackUrl!.includes(".webm") ||
      playbackUrl!.includes("storage.googleapis.com") ||
      playbackUrl!.includes("supabase.co/storage"));

  if (isDirectVideoUrl && playbackUrl) {
    const togglePlay = () => {
      if (!videoRef.current) return;
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setHasError(true));
      }
    };

    const handleTimeUpdate = () => {
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (videoRef.current && videoRef.current.duration) {
        setDuration(videoRef.current.duration);
      }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = parseFloat(e.target.value);
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        setCurrentTime(time);
      }
    };

    const toggleMute = () => {
      if (!videoRef.current) return;
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    };

    const toggleFullscreen = () => {
      if (!videoRef.current) return;
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    };

    const resetPlayhead = () => {
      if (!videoRef.current) return;
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
    };

    return (
      <div className="group relative aspect-video w-full rounded-2xl bg-black border border-slate-800 shadow-2xl overflow-hidden select-none">
        <video
          ref={videoRef}
          src={playbackUrl}
          poster={posterUrl || undefined}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          onError={() => setHasError(true)}
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
          playsInline
        />

        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-2xl hover:scale-110 hover:bg-cyan-500 transition-all duration-200 border border-white/20 backdrop-blur-sm"
            aria-label="Play video"
          >
            <Play className="w-7 h-7 ml-1" />
          </button>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-90 transition-opacity duration-200">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none mb-3"
            aria-label="Seek video progress"
          />

          <div className="flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="p-1 hover:text-cyan-400 transition-colors focus:outline-none"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              <button
                onClick={resetPlayhead}
                className="p-1 hover:text-cyan-400 transition-colors focus:outline-none"
                aria-label="Restart lecture"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={toggleMute}
                className="p-1 hover:text-cyan-400 transition-colors focus:outline-none"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              <span className="font-mono text-[11px] text-slate-300">
                {formatDuration(currentTime)} / {formatDuration(duration)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded">
                Legacy Playback
              </span>
              <button
                onClick={toggleFullscreen}
                className="p-1 hover:text-cyan-400 transition-colors focus:outline-none"
                aria-label="Toggle fullscreen"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. EMPTY / ERROR STATE: Section 12
  // "If a lecture has no valid YouTube video: Show: 'Lecture video unavailable.' Do not render a broken iframe."
  return (
    <div className="relative aspect-video w-full rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-6 text-center shadow-xl overflow-hidden">
      <div className="absolute inset-0 bg-tech-grid-dark opacity-30 pointer-events-none" />
      <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-4 text-slate-400">
        <VideoOff className="w-6 h-6" />
      </div>
      <h4 className="text-base sm:text-lg font-bold text-white mb-2">{title}</h4>
      <p className="text-xs sm:text-sm font-semibold text-rose-400 mb-1">
        Lecture video unavailable.
      </p>
      <p className="text-xs text-slate-400 max-w-md">
        No active YouTube video stream is linked to this lecture. Please review the syllabus notes and study materials below.
      </p>
    </div>
  );
}
