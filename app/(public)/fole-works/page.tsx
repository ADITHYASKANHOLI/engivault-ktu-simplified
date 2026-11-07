import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Briefcase,
  Cpu,
  Users,
  Mail,
  ArrowRight,
  ArrowDown,
  Sparkles,
  Layers,
} from "lucide-react";
import { WorksActivity } from "@/types";
import { getPublishedWorksActivities } from "@/lib/queries";
import { FoleWorksLogo } from "@/components/branding/FoleWorksLogo";
import { FoleWorksAuroraBackground } from "@/components/works/FoleWorksAuroraBackground";
import { FoleWorksWhatIs } from "@/components/works/FoleWorksWhatIs";
import { WorksFilterView } from "@/components/works/WorksFilterView";
import { FoleWorksWhyParticipate } from "@/components/works/FoleWorksWhyParticipate";
import { FoleWorksFinalCTA } from "@/components/works/FoleWorksFinalCTA";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "FOLE WORKS — Engineering Workshops, Internships & Activities | FOLE CEV",
  description:
    "Explore hands-on engineering workshops, internship programmes, technical bootcamps, hackathons, and collaborative student projects organized by FOLE CEV at College of Engineering Vadakara.",
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#070e1b] text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      {/* Section A: Redesigned Hero with React Bits Aurora Background */}
      <section className="relative min-h-[640px] sm:min-h-[680px] lg:min-h-[720px] overflow-hidden bg-[#050811] text-white pt-28 pb-16 sm:pt-36 sm:pb-24 flex items-center justify-center border-b border-slate-800/80">
        <FoleWorksAuroraBackground />

        {/* Hero Foreground Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pointer-events-auto">
          {/* Emblem & Eyebrow Badge */}
          <div className="flex flex-col items-center mb-6">
            <div className="mb-5 transition-transform duration-300 hover:scale-105 drop-shadow-[0_0_35px_rgba(82,39,255,0.45)]">
              <FoleWorksLogo size="xl" showWordmark={false} href={null} priority />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-mono font-bold tracking-wider uppercase text-emerald-400 shadow-[0_0_20px_rgba(124,255,103,0.15)]">
              <Sparkles className="w-3.5 h-3.5 text-[#7cff67]" />
              <span>FOLE — FREE OPEN LEARNING & EDUCATION</span>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white mb-3">
            FOLE{" "}
            <span className="font-mono text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-[#7cff67] to-cyan-300">
              WORKS
            </span>
          </h1>

          {/* Supporting Headline */}
          <p className="text-lg sm:text-2xl md:text-3xl font-semibold tracking-tight text-slate-200 mb-5">
            Ideas. Skills. Opportunities. Impact.
          </p>

          {/* Description */}
          <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 font-normal">
            Discover workshops, technical training, internships, hackathons and collaborative opportunities that turn knowledge into real-world experience.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-12">
            <a
              href="#activities"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-[#00A86B] hover:from-emerald-500 hover:to-[#00c57d] transition-all shadow-[0_0_25px_rgba(0,168,107,0.35)] hover:shadow-[0_0_35px_rgba(124,255,103,0.45)] active:scale-[0.98] min-h-[48px]"
            >
              <span>Explore Activities</span>
              <ArrowDown className="w-4 h-4 animate-bounce" />
            </a>

            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 backdrop-blur-md transition-all active:scale-[0.98] min-h-[48px]"
            >
              <span>Discover FOLE</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </Link>
          </div>

          {/* Value Micro-Pillars (including Hands-on Labs) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 max-w-4xl mx-auto text-left">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white font-mono uppercase">Hands-on Labs</div>
                <div className="text-[11px] text-slate-400">Hardware & Software</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#5227FF]/20 text-[#a38cff] shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white font-mono uppercase">Internships</div>
                <div className="text-[11px] text-slate-400">Project Sprints</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#7cff67]/15 text-[#7cff67] shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white font-mono uppercase">Projects</div>
                <div className="text-[11px] text-slate-400">Multi-Branch Teams</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-400 shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white font-mono uppercase">Open Access</div>
                <div className="text-[11px] text-slate-400">100% Free for CEV</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section B: What is FOLE WORKS? (6 Core Pathways) */}
      <FoleWorksWhatIs />

      {/* Section C & D: Main Activities Catalogue & Interactive Filters */}
      <section id="activities" className="py-16 sm:py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
                <Briefcase className="w-4 h-4" />
                <span>Activities Discovery</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Current &amp; Upcoming Activities
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
              Explore workshops, project batches, hackathons, and internship tracks. Open to engineering students with interest in practical implementation.
            </p>
          </div>

          {/* Interactive Filter View (Search, Categories, Delivery Mode, Activity Cards) */}
          <WorksFilterView initialActivities={activities} error={fetchError} />
        </div>
      </section>

      {/* Section E: Why Participate? (Practical Experience, Skills, Mentorship) */}
      <FoleWorksWhyParticipate />

      {/* Section F: Final Concluding Call to Action with Aurora Echoes */}
      <FoleWorksFinalCTA />

      {/* Community Contact Backstop */}
      <div className="hidden" aria-hidden="true">
        <a href="mailto:folecev@gmail.com">
          <Mail className="w-4 h-4" />
          <span>folecev@gmail.com</span>
        </a>
      </div>
    </div>
  );
}
