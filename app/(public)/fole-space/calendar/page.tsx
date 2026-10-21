import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { spaceService } from "@/lib/space/service";
import { formatDateTimeIST } from "@/lib/space/time";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Events Calendar — FOLE SPACE",
  description: "Monthly calendar of engineering workshops, study jams, and sessions at FOLE SPACE.",
};

interface CalendarPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function SpaceCalendarPage({ searchParams }: CalendarPageProps) {
  const { month } = await searchParams;

  // Resolve target year & month in Asia/Kolkata
  const now = new Date();
  let targetYear = now.getFullYear();
  let targetMonth = now.getMonth() + 1; // 1-12

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    if (y >= 2024 && y <= 2030 && m >= 1 && m <= 12) {
      targetYear = y;
      targetMonth = m;
    }
  }

  const calendarEvents = await spaceService.getCalendarEvents(targetYear, targetMonth);

  // Month navigation calculation
  const prevDate = new Date(targetYear, targetMonth - 2, 1);
  const nextDate = new Date(targetYear, targetMonth, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const nextMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;

  const monthLabel = new Date(targetYear, targetMonth - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Calculate grid days for month
  const firstDayOfWeek = new Date(targetYear, targetMonth - 1, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();

  // Map events to days
  const eventsByDay: { [day: number]: typeof calendarEvents } = {};
  calendarEvents.forEach((evt) => {
    const d = new Date(evt.starts_at);
    // Convert to day of month in IST
    const istDayStr = d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD
    const [_, m, dayNum] = istDayStr.split("-").map(Number);
    if (m === targetMonth) {
      if (!eventsByDay[dayNum]) eventsByDay[dayNum] = [];
      eventsByDay[dayNum].push(evt);
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07111F] pt-24 pb-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation & Title Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Asia/Kolkata Time (IST)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              FOLE SPACE Calendar
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/fole-space/calendar?month=${prevMonthStr}`}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>

            <span className="font-bold text-base sm:text-lg min-w-[160px] text-center text-slate-900 dark:text-white">
              {monthLabel}
            </span>

            <Link
              href={`/fole-space/calendar?month=${nextMonthStr}`}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              aria-label="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Desktop Calendar Grid (Hidden on Mobile) */}
        <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-12">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-xs font-bold text-slate-500 uppercase tracking-wider text-center py-3">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800/60">
            {/* Blank leading cells */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`lead-${i}`} className="min-h-[120px] bg-slate-50/50 dark:bg-slate-950/20 p-2" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = eventsByDay[day] || [];
              const isToday =
                now.getFullYear() === targetYear &&
                now.getMonth() + 1 === targetMonth &&
                now.getDate() === day;

              return (
                <div
                  key={`day-${day}`}
                  className={`min-h-[120px] p-2 flex flex-col justify-between transition-colors ${
                    isToday ? "bg-emerald-50/40 dark:bg-emerald-950/20" : "hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                        isToday
                          ? "bg-emerald-600 text-white"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {day}
                    </span>

                    {dayEvents.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {dayEvents.length} {dayEvents.length === 1 ? "session" : "sessions"}
                      </span>
                    )}
                  </div>

                  {/* Event Chips */}
                  <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[100px]">
                    {dayEvents.map((evt) => (
                      <Link
                        key={evt.id}
                        href={`/fole-space/events/${evt.slug}`}
                        className="block p-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 truncate transition-colors"
                        title={evt.title}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1.5" />
                        <span>{evt.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Agenda List (Visible only on small screens) */}
        <div className="md:hidden space-y-4 mb-12">
          <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
            Agenda for {monthLabel}
          </h2>

          {calendarEvents.length === 0 ? (
            <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 text-sm">
              No sessions currently scheduled for this month.
            </div>
          ) : (
            calendarEvents.map((evt) => (
              <Link
                key={evt.id}
                href={`/fole-space/events/${evt.slug}`}
                className="block p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span className="font-semibold text-emerald-600 uppercase text-[10px]">
                    {evt.category}
                  </span>
                  <span>{formatDateTimeIST(evt.starts_at)}</span>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
                  {evt.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                  {evt.description}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Capacity: {evt.capacity} seats</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <span>View & Register</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
