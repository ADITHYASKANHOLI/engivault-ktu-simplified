import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Briefcase,
  Cpu,
  Users,
  Mail,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { WorksActivity } from "@/types";
import { getPublishedWorksActivities } from "@/lib/queries";
import { FoleWorksLogo } from "@/components/branding/FoleWorksLogo";
import { WorksFilterView } from "@/components/works/WorksFilterView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "FOLE WORKS — Operational & Professional Activities | FOLE CEV",
  description:
    "Explore hands-on engineering workshops, internship programmes, technical bootcamps, and collaborative student projects organized by FOLE CEV at College of Engineering Vadakara.",
  openGraph: {
    title: "FOLE WORKS — Engineering Workshops & Professional Activities",
    description:
      "Operational & professional engineering activities by the Free Open Learning & Education community at College of Engineering Vadakara.",
    images: [{ url: "/branding/fole-works-logo.png", width: 1024, height: 1024, alt: "FOLE WORKS" }],
  },
};

export default async function FoleWorksPage() {
  let activities: WorksActivity[] = [];
  let fetchError: string | null = null;

  try {
    activities = await getPublishedWorksActivities();
  } catch (err: any) {
    // Record useful server-side diagnostics without exposing credentials to public visitors
    console.error("[FOLE WORKS PAGE] Failed to retrieve published activities during SSR:", {
      message: err?.message || "Unknown error",
      timestamp: new Date().toISOString(),
    });
    fetchError = "We were unable to retrieve published activities from the vault. Please try reloading.";
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07111F] text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-20 overflow-hidden border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-[#07111F] dark:to-slate-950">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-tech-grid-dark opacity-20 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            {/* Official FOLE WORKS Brand Header */}
            <div className="mb-6 transform hover:scale-105 transition-transform duration-300">
              <FoleWorksLogo size="xl" showWordmark={false} href={null} priority />
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-950/60 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase mb-4">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>FOLE CEV Professional & Operational Wing</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
              FOLE <span className="text-emerald-600 dark:text-emerald-400 font-mono">WORKS</span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
              The practical initiative wing of <strong>Free Open Learning & Education (FOLE CEV)</strong> at{" "}
              <strong>College of Engineering Vadakara</strong>. We organize student-driven technical workshops,
              industry internship programmes, collaborative robotics projects, and professional skill bootcamps.
            </p>

            {/* Value Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-8 text-left">
              <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs backdrop-blur-xs flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono">Hands-on Labs</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Hardware & software engineering practice</p>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs backdrop-blur-xs flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500 shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono">Internships</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Project sprints with industry mentors</p>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs backdrop-blur-xs flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono">Peer Collaboration</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Multi-branch student project squads</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="#activities"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-all shadow-xs min-h-[48px]"
              >
                <span>Explore Activities</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 transition-all min-h-[48px]"
              >
                <Mail className="w-4 h-4 text-emerald-500" />
                <span>Contact Organizers</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Activities Catalogue Section */}
      <section id="activities" className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                <Briefcase className="w-4 h-4" />
                <span>Activity Discovery</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Current & Upcoming Activities
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md">
              Browse workshops, project batches, and internships. Open to engineering students with interest in practical implementation.
            </p>
          </div>

          {/* Interactive Filter View */}
          <WorksFilterView initialActivities={activities} error={fetchError} />
        </div>
      </section>

      {/* Community Collaboration & Contact Banner */}
      <section className="py-12 border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 rounded-3xl shadow-xs">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Want to Host or Propose an Initiative?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-6 leading-relaxed">
              FOLE WORKS supports student and faculty-led initiatives at CEV. If you have an idea for a technical workshop,
              robotics competition, or open-source engineering project, reach out to the team.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="mailto:folecev@gmail.com"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors shadow-2xs min-h-[44px]"
              >
                <Mail className="w-4 h-4" />
                <span>folecev@gmail.com</span>
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 transition-colors min-h-[44px]"
              >
                <span>Submit Query via Contact Form</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
