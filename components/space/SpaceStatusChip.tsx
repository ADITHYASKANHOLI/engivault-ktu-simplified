import React from "react";
import { cn } from "@/lib/utils";
import type { SpaceAvailabilityState } from "@/lib/space/types";
import { DoorOpen, Users, Clock } from "lucide-react";

interface SpaceStatusChipProps {
  state: SpaceAvailabilityState;
  occupancy?: number;
  capacity?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function SpaceStatusChip({
  state,
  occupancy,
  capacity,
  className,
  size = "md",
}: SpaceStatusChipProps) {
  const configs = {
    available: {
      label: "Space Available",
      subtext: capacity ? `${occupancy || 0} / ${capacity} Occupied` : "Walk-in open",
      badgeColor: "bg-emerald-50 border-emerald-200 text-emerald-800",
      dotColor: "bg-emerald-500 animate-pulse",
      icon: DoorOpen,
    },
    occupied: {
      label: "At Full Capacity",
      subtext: `${capacity || 0} / ${capacity || 0} Seats Occupied`,
      badgeColor: "bg-amber-50 border-amber-200 text-amber-800",
      dotColor: "bg-amber-500",
      icon: Users,
    },
    unavailable: {
      label: "Currently Closed",
      subtext: "Check opening hours or schedule",
      badgeColor: "bg-slate-100 border-slate-200 text-slate-700",
      dotColor: "bg-slate-400",
      icon: Clock,
    },
  };

  const current = configs[state] || configs.unavailable;
  const Icon = current.icon;

  if (size === "sm") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
          current.badgeColor,
          className
        )}
      >
        <span className={cn("w-2 h-2 rounded-full", current.dotColor)} />
        <span>{current.label}</span>
      </span>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 px-3.5 py-2 rounded-xl border shadow-xs transition-all",
        current.badgeColor,
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        <span className={cn("w-2.5 h-2.5 rounded-full", current.dotColor)} />
      </div>
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5 font-bold text-sm leading-tight">
          <Icon className="w-4 h-4 opacity-75" />
          <span>{current.label}</span>
        </div>
        {current.subtext && (
          <span className="text-xs opacity-80 font-medium">{current.subtext}</span>
        )}
      </div>
    </div>
  );
}
