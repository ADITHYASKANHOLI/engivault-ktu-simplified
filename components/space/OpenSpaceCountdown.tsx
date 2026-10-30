"use client";

import React, { useEffect, useState, useRef } from "react";
import { calculateRemainingSeconds, formatCountdown } from "@/lib/space/time";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface OpenSpaceCountdownProps {
  expiresAt: string;
  serverNow: string;
  onExpire?: () => void;
  className?: string;
  size?: "md" | "lg";
}

export function OpenSpaceCountdown({
  expiresAt,
  serverNow,
  onExpire,
  className,
  size = "lg",
}: OpenSpaceCountdownProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() =>
    calculateRemainingSeconds(expiresAt, serverNow)
  );
  const [ariaAnnouncement, setAriaAnnouncement] = useState<string>("");
  const announcedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    // Record client start time to offset drift
    const clientStartTime = Date.now();
    const serverStartTime = new Date(serverNow).getTime();
    const serverOffsetMs = serverStartTime - clientStartTime;

    const tick = () => {
      const nowEstimatedServer = Date.now() + serverOffsetMs;
      const targetTime = new Date(expiresAt).getTime();
      const diffSeconds = Math.max(0, Math.floor((targetTime - nowEstimatedServer) / 1000));

      setRemainingSeconds(diffSeconds);

      // Milestone accessibility announcements
      if (diffSeconds === 300 && !announcedRef.current.has(300)) {
        announcedRef.current.add(300);
        setAriaAnnouncement("5 minutes remaining in your study session.");
      } else if (diffSeconds === 60 && !announcedRef.current.has(60)) {
        announcedRef.current.add(60);
        setAriaAnnouncement("1 minute remaining in your study session.");
      } else if (diffSeconds === 0 && !announcedRef.current.has(0)) {
        announcedRef.current.add(0);
        setAriaAnnouncement("Your study session has ended.");
        if (onExpire) onExpire();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);

    // Re-sync immediately when tab regains focus or visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        tick();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [expiresAt, serverNow, onExpire]);

  const countdownText = formatCountdown(remainingSeconds);
  const isExpiringSoon = remainingSeconds > 0 && remainingSeconds <= 300; // <= 5 mins
  const isExpired = remainingSeconds === 0;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-6 rounded-2xl border transition-all",
        isExpired
          ? "bg-slate-100 border-slate-300 text-slate-700"
          : isExpiringSoon
          ? "bg-amber-50/80 border-amber-300 text-amber-900 animate-pulse"
          : "bg-emerald-50/70 border-emerald-200 text-emerald-950",
        className
      )}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold mb-2">
        {isExpiringSoon ? (
          <AlertTriangle className="w-4 h-4 text-amber-600 animate-bounce" />
        ) : (
          <Clock className="w-4 h-4 text-emerald-700" />
        )}
        <span>
          {isExpired
            ? "Session Concluded"
            : isExpiringSoon
            ? "Ending Soon"
            : "Active Session"}
        </span>
      </div>

      <div
        className={cn(
          "font-mono font-black tracking-tight",
          size === "lg" ? "text-5xl sm:text-6xl" : "text-3xl sm:text-4xl"
        )}
        aria-hidden="true"
      >
        {countdownText}
      </div>

      <div className="mt-2 text-xs text-slate-600 font-medium">
        {isExpired
          ? "Your 30-minute allocation has expired."
          : `Session automatically completes at countdown zero.`}
      </div>

      {/* Screen reader aria-live announcements for milestones */}
      <span className="sr-only" aria-live="polite">
        {ariaAnnouncement}
      </span>
    </div>
  );
}
