import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { spaceService } from "@/lib/space/service";
import { formatDateTimeIST } from "@/lib/space/time";
import { Calendar, Users, ArrowRight, Sparkles } from "lucide-react";
import { EventsParticlesBackground } from "@/components/space/EventsParticlesBackground";

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
    <div className="relative isolate min-h-screen bg-[#07111F] text-slate-100">
      <EventsParticlesBackground />
      <main className="page-content-relative flex-1 pt-24 sm:pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Community Sessions</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">
              Events &amp; Workshops
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
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
                      ? "bg-emerald-600 text-white shadow-sm border border-emerald-500"
                      : "bg-slate-900/70 backdrop-blur-sm text-slate-300 hover:bg-slate-800/80 border border-slate-700/70"
                  }`}
                >
                  {cat}
                </Link>
              );
            })}
          </div>

          {/* Events Grid */}
          {events.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-800 max-w-md mx-auto">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3 stroke-1" />
              <h3 className="text-base font-bold text-white mb-1">
                No sessions found
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                There are no published events in this category yet.
              </p>
              <Link
                href="/fole-space/calendar"
                className="text-xs font-bold text-emerald-400 hover:underline"
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
                  className="group p-6 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-900/80 transition-all shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                      <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] bg-emerald-950/70 px-2 py-0.5 rounded-md border border-emerald-800/70">
                        {evt.category}
                      </span>
                      <span>{formatDateTimeIST(evt.starts_at)}</span>
                    </div>

                    <h2 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 mb-2">
                      {evt.title}
                    </h2>

                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-4">
                      {evt.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{evt.capacity} Capacity</span>
                    </span>

                    <span className="font-bold text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      <span>View Session</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
