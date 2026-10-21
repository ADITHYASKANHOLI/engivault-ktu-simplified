import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { spaceService } from "@/lib/space/service";
import { Calendar, Users, ArrowRight, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Events & Workshops — FOLE SPACE",
  description: "Browse hands-on student workshops, study sessions, and tech events at FOLE SPACE.",
};

interface EventsPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function SpaceEventsCatalogPage({ searchParams }: EventsPageProps) {
  const { category } = await searchParams;
  const events = await spaceService.getPublicEvents({ category, limit: 100 });

  const categories = ["All", "Workshop", "Study Jam", "Hack Sprint", "Discussion", "Talk"];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07111F] pt-24 pb-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-950/60 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Community Sessions</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
            Events & Workshops
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Organized by verified student creators and mentors at College of Engineering Vadakara. Free digital QR passes for all registered members.
          </p>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
          {categories.map((cat) => {
            const isActive = (!category && cat === "All") || category === cat;
            return (
              <Link
                key={cat}
                href={cat === "All" ? "/fole-space/events" : `/fole-space/events?category=${cat}`}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
                }`}
              >
                {cat}
              </Link>
            );
          })}
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md mx-auto">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3 stroke-1" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              No sessions found
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              There are no published events in this category yet.
            </p>
            <Link
              href="/fole-space/calendar"
              className="text-xs font-bold text-emerald-600 hover:underline"
            >
              Check the full calendar
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => (
              <Link
                key={evt.id}
                href={`/fole-space/events/${evt.slug}`}
                className="group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                    <span className="font-bold text-emerald-600 uppercase tracking-wider text-[11px] bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      {evt.category}
                    </span>
                    <span>{formatDateTimeIST(evt.starts_at)}</span>
                  </div>

                  <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 mb-2">
                    {evt.title}
                  </h2>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4">
                    {evt.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{evt.capacity} Capacity</span>
                  </span>

                  <span className="font-bold text-emerald-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <span>View Session</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
