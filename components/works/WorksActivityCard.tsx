"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Laptop,
  Globe,
  Users,
} from "lucide-react";
import { WorksActivity } from "@/types";
import { cn } from "@/lib/utils";

interface WorksActivityCardProps {
  activity: WorksActivity;
}

export function WorksActivityCard({ activity }: WorksActivityCardProps) {
  // Format dates safely in Indian Standard Time (IST)
  const dateFormatted = React.useMemo(() => {
    if (!activity.start_at) return "Dates to be announced";
    try {
      const d = new Date(activity.start_at);
      return d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: activity.timezone || "Asia/Kolkata",
      });
    } catch {
      return "Dates to be announced";
    }
  }, [activity.start_at, activity.timezone]);

  const timeFormatted = React.useMemo(() => {
    if (!activity.start_at) return null;
    try {
      const d = new Date(activity.start_at);
      return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: activity.timezone || "Asia/Kolkata",
      });
    } catch {
      return null;
    }
  }, [activity.start_at, activity.timezone]);

  // Track client timestamp safely inside useEffect to avoid render impurity and hydration mismatches
  const [currentTime, setCurrentTime] = React.useState<number>(0);
  React.useEffect(() => {
    setCurrentTime(Date.now());
  }, []);

  // Determine registration status
  const regStatus = React.useMemo(() => {
    if (!currentTime) {
      return {
        label: activity.registration_url ? "Registration Open" : "Details Available",
        variant: "open" as const,
      };
    }
    const openTime = activity.registration_opens_at ? new Date(activity.registration_opens_at).getTime() : 0;
    const closeTime = activity.registration_closes_at ? new Date(activity.registration_closes_at).getTime() : 0;

    if (closeTime && currentTime > closeTime) {
      return { label: "Registration Closed", variant: "closed" as const };
    }
    if (openTime && currentTime < openTime) {
      return { label: "Registration Soon", variant: "upcoming" as const };
    }
    if (closeTime && closeTime - currentTime < 48 * 3600 * 1000) {
      return { label: "Closing Soon", variant: "urgent" as const };
    }
    if (activity.registration_url) {
      return { label: "Registration Open", variant: "open" as const };
    }
    return { label: "Details Available", variant: "info" as const };
  }, [currentTime, activity.registration_opens_at, activity.registration_closes_at, activity.registration_url]);

  // Delivery mode icon & label
  const deliveryInfo = React.useMemo(() => {
    switch (activity.delivery_mode) {
      case "online":
        return { label: "Online Session", icon: Laptop, color: "text-sky-500 bg-sky-950/60 border-sky-800/40" };
      case "hybrid":
        return { label: "Hybrid", icon: Globe, color: "text-purple-400 bg-purple-950/60 border-purple-800/40" };
      case "in_person":
      default:
        return { label: "In-Person", icon: MapPin, color: "text-emerald-400 bg-emerald-950/60 border-emerald-800/40" };
    }
  }, [activity.delivery_mode]);

  const DeliveryIcon = deliveryInfo.icon;

  return (
    <article className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden">
      {/* Top Banner Accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        {/* Badges: Category & Delivery Mode */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider font-mono bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700">
              {activity.category}
            </span>
            <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 border font-mono", deliveryInfo.color)}>
              <DeliveryIcon className="w-3 h-3 shrink-0" />
              <span>{deliveryInfo.label}</span>
            </span>
          </div>

          {/* Registration Status Pill */}
          <span
            className={cn(
              "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono shrink-0",
              regStatus.variant === "open" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
              regStatus.variant === "urgent" && "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse",
              regStatus.variant === "upcoming" && "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30",
              regStatus.variant === "closed" && "bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30",
              regStatus.variant === "info" && "bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20"
            )}
          >
            {regStatus.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 break-words leading-snug mb-2">
          <Link href={`/fole-works/${activity.slug}`} className="focus:outline-none focus-visible:underline">
            {activity.title}
          </Link>
        </h3>

        {/* Short Description */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed flex-1">
          {activity.short_description || activity.description.slice(0, 160)}
        </p>

        {/* Date, Time & Venue Meta Strip */}
        <div className="space-y-1.5 py-3 border-y border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
              {dateFormatted}
            </span>
            {timeFormatted && (
              <>
                <span className="text-slate-400">•</span>
                <span className="truncate flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400 inline" />
                  {timeFormatted}
                </span>
              </>
            )}
          </div>

          {activity.venue && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate text-slate-600 dark:text-slate-400">
                {activity.venue}
              </span>
            </div>
          )}

          {activity.capacity && (
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Capacity: {activity.capacity} seats</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Fee & View Action */}
      <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50/70 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-3">
        {/* Fee Indicator */}
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400">
            Participation Fee
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-mono">
            {!activity.fee_amount || activity.fee_amount === 0
              ? "Free / Open"
              : `${activity.currency || "INR"} ${activity.fee_amount}`}
          </span>
        </div>

        {/* Action Link (min 44px touch target) */}
        <Link
          href={`/fole-works/${activity.slug}`}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-900 hover:text-white bg-slate-200/80 hover:bg-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-600 dark:text-slate-200 dark:hover:text-white transition-all shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[44px]"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </article>
  );
}
