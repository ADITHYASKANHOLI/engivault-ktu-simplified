import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { spaceService } from "@/lib/space/service";
import { formatDateTimeIST } from "@/lib/space/time";
import { getAuthenticatedStudent } from "@/lib/space/permissions";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Ticket,
  Layers,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Events Calendar — FOLE SPACE",
  description: "Monthly calendar of engineering workshops, study jams, and sessions at FOLE SPACE.",
};

interface CalendarPageProps {
  searchParams: Promise<{ month?: string; view?: string }>;
}

export default async function SpaceCalendarPage({ searchParams }: CalendarPageProps) {
  const { month, view } = await searchParams;

  // Resolve current date parts in Asia/Kolkata (IST)
  const istFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const now = new Date();
  const parts = istFormatter.formatToParts(now);
  const currentIstYear = Number(parts.find((p) => p.type === "year")?.value);
  const currentIstMonth = Number(parts.find((p) => p.type === "month")?.value);
  const currentIstDay = Number(parts.find((p) => p.type === "day")?.value);

  let targetYear = currentIstYear;
  let targetMonth = currentIstMonth;

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    if (y >= 2024 && y <= 2030 && m >= 1 && m <= 12) {
      targetYear = y;
      targetMonth = m;
    }
  }

  // Resolve student context for registered event tracking
  const student = await getAuthenticatedStudent();
  const currentUserId = student?.id;

  // Query published calendar events for the target month with registration status
  let calendarEvents: Awaited<ReturnType<typeof spaceService.getCalendarEvents>> = [];
  let queryError: string | null = null;
  try {
    calendarEvents = await spaceService.getCalendarEvents(targetYear, targetMonth, currentUserId);
  } catch (err: any) {
    console.error("Calendar query error:", err);
    queryError = err?.message || "Failed to load events for this month.";
  }

  // Calculate registered events and active view
  const isRegisteredView = Boolean(student && view === "registered");
  const registeredEvents = calendarEvents.filter((e) => e.is_registered);
  const displayedEvents = isRegisteredView ? registeredEvents : calendarEvents;

  // Month navigation calculation
  const prevDate = new Date(targetYear, targetMonth - 2, 1);
  const nextDate = new Date(targetYear, targetMonth, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const nextMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
  const currentMonthStr = `${targetYear}-${String(targetMonth).padStart(2, "0")}`;

  const monthLabel = new Date(targetYear, targetMonth - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Calculate grid days for month
  const firstDayOfWeek = new Date(targetYear, targetMonth - 1, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();

  // Map events to days in IST
  const eventsByDay: { [day: number]: typeof displayedEvents } = {};
  displayedEvents.forEach((evt) => {
    const d = new Date(evt.starts_at);
    // Convert to day of month in IST
    const istDayStr = d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD
    const [_, m, dayNum] = istDayStr.split("-").map(Number);
    if (m === targetMonth) {
      if (!eventsByDay[dayNum]) eventsByDay[dayNum] = [];
      eventsByDay[dayNum].push(evt);
    }
  });

  // Build query string helper for links
  const getNavUrl = (targetMonthVal: string, targetView?: string) => {
    const v = targetView ?? (isRegisteredView ? "registered" : "all");
    return `/fole-space/calendar?month=${targetMonthVal}${v === "registered" ? "&view=registered" : ""}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07111F] pt-24 pb-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation & Title Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
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
              href={getNavUrl(prevMonthStr)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>

            <span className="font-bold text-base sm:text-lg min-w-[160px] text-center text-slate-900 dark:text-white">
              {monthLabel}
            </span>

            <Link
              href={getNavUrl(nextMonthStr)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              aria-label="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* View Toggle Bar (All Sessions vs My Registered Sessions) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Link
              href={getNavUrl(currentMonthStr, "all")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                !isRegisteredView
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Sessions ({calendarEvents.length})</span>
            </Link>

            {student ? (
              <Link
                href={getNavUrl(currentMonthStr, "registered")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isRegisteredView
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>My Registered ({registeredEvents.length})</span>
              </Link>
            ) : (
              <Link
                href="/login?redirect=/fole-space/calendar"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                title="Log in to view your registered sessions"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Log in to track registered sessions</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Published Session</span>
            </span>
            {student && (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                <span>Your Registration</span>
              </span>
            )}
            <Link
              href="/fole-space/events"
              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline ml-2"
            >
              Browse Catalog &rarr;
            </Link>
          </div>
        </div>

        {/* Query Error Notice */}
        {queryError && (
          <div className="p-4 mb-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-xs font-medium">
            <strong>Unable to load calendar events:</strong> {queryError}
          </div>
        )}

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
                currentIstYear === targetYear &&
                currentIstMonth === targetMonth &&
                currentIstDay === day;

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
                    {dayEvents.map((evt) => {
                      const isReg = evt.is_registered;
                      return (
                        <Link
                          key={evt.id}
                          href={`/fole-space/events/${evt.slug}`}
                          className={`block p-1.5 rounded-lg text-xs font-semibold truncate transition-colors ${
                            isReg
                              ? "bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-300 dark:border-blue-700 text-blue-950 dark:text-blue-200"
                              : "bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                          }`}
                          title={`${evt.title}${isReg ? " (Registered)" : ""}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full inline-block mr-1.5 ${
                              isReg ? "bg-blue-500" : "bg-emerald-500"
                            }`}
                          />
                          <span>
                            {isReg && "✓ "}
                            {evt.title}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Empty State when no events exist in current view */}
        {displayedEvents.length === 0 && (
          <div className="p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center max-w-lg mx-auto mb-12 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-500">
              {isRegisteredView ? (
                <Ticket className="w-6 h-6 text-blue-500 stroke-1" />
              ) : (
                <CalendarIcon className="w-6 h-6 text-slate-400 stroke-1" />
              )}
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              {isRegisteredView
                ? `No registered sessions in ${monthLabel}`
                : `No sessions scheduled for ${monthLabel}`}
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6 max-w-sm mx-auto">
              {isRegisteredView
                ? "You haven't registered for any events scheduled in this month. Browse community sessions and grab your free digital pass."
                : "There are no engineering workshops or community sessions scheduled for this month yet. Check back soon or browse the full event catalog."}
            </p>

            <div className="flex items-center justify-center gap-3">
              {isRegisteredView && calendarEvents.length > 0 && (
                <Link
                  href={getNavUrl(currentMonthStr, "all")}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  View All Sessions ({calendarEvents.length})
                </Link>
              )}
              <Link
                href="/fole-space/events"
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Browse Full Catalog
              </Link>
            </div>
          </div>
        )}

        {/* Mobile Agenda List (Visible only on small screens) */}
        <div className="md:hidden space-y-4 mb-12">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
              Agenda for {monthLabel}
            </h2>
            <span className="text-xs text-slate-500">
              {displayedEvents.length} {displayedEvents.length === 1 ? "session" : "sessions"}
            </span>
          </div>

          {displayedEvents.length === 0 ? (
            <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 text-sm">
              {isRegisteredView
                ? `You have no registered sessions in ${monthLabel}.`
                : `No sessions currently scheduled for ${monthLabel}.`}
            </div>
          ) : (
            displayedEvents.map((evt) => {
              const isReg = evt.is_registered;
              return (
                <Link
                  key={evt.id}
                  href={`/fole-space/events/${evt.slug}`}
                  className={`block p-5 bg-white dark:bg-slate-900 rounded-2xl border shadow-sm transition-all ${
                    isReg
                      ? "border-blue-300 dark:border-blue-800/80 hover:border-blue-400"
                      : "border-slate-200 dark:border-slate-800 hover:border-emerald-400"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-semibold text-emerald-600 uppercase text-[10px] bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      {evt.category}
                    </span>
                    <span className="font-mono text-[11px]">{formatDateTimeIST(evt.starts_at)}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5 flex items-center gap-1.5">
                    {isReg && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 inline-block" />
                    )}
                    <span>{evt.title}</span>
                  </h3>

                  {evt.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                      {evt.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span>Capacity: {evt.capacity} seats</span>
                      {isReg && (
                        <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                          Pass Confirmed
                        </span>
                      )}
                    </div>
                    <span
                      className={`font-bold flex items-center gap-1 ${
                        isReg ? "text-blue-600 dark:text-blue-400" : "text-emerald-600"
                      }`}
                    >
                      <span>{isReg ? "View Pass" : "View & Register"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
