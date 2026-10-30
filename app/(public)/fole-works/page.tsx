import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Briefcase,
  Cpu,
  Users,
  Mail,
  ArrowRight,
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
    fetchError = "We could not load the published activities. Please try reloading.";
  }

  return (
    <div className="min-h-screen bg-[#f7f6ef] dark:bg-[#101a14] text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 sm:pt-36 sm:pb-20 overflow-hidden border-b border-slate-200 dark:border-slate-800/80 bg-[#f7f6ef]">
        {/* Subtle grid background */}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-start text-left max-w-3xl">
            {/* Official FOLE WORKS Brand Header */}
            <div className="mb-6">
              <FoleWorksLogo size="xl" showWordmark={false} href={null} priority />
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm bg-[#e8f0e8] border border-[#c7d8c9] text-[#176b45] text-xs font-semibold tracking-wide uppercase mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-[#176b45]" aria-hidden="true" />
              <span>FOLE CEV Professional & Operational Wing</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#17231c] tracking-tight mb-4">
              FOLE <span className="text-emerald-600 dark:text-emerald-400 font-mono">WORKS</span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-[#536157] leading-relaxed mb-8">
              The practical initiative wing of <strong>Free Open Learning & Education (FOLE CEV)</strong> at{" "}
              <strong>College of Engineering Vadakara</strong>. We organize student-driven technical workshops,
              industry internship programmes, collaborative robotics projects, and professional skill bootcamps.
            </p>

            {/* What FOLE WORKS does */}
            <div className="mb-8 grid w-full grid-cols-1 gap-x-8 gap-y-4 border-y border-[#dce2da] py-5 text-left sm:grid-cols-3">
              <div className="flex items-start gap-3">
                <Cpu className="mt-0.5 h-5 w-5 shrink-0 text-[#176b45]" />
                <div><h4 className="text-sm font-semibold text-[#17231c]">Hands-on labs</h4><p className="mt-1 text-xs leading-5 text-[#647168]">Hardware and software engineering practice.</p></div>
              </div>
              <div className="flex items-start gap-3">
                <Briefcase className="mt-0.5 h-5 w-5 shrink-0 text-[#176b45]" />
                <div><h4 className="text-sm font-semibold text-[#17231c]">Internships</h4><p className="mt-1 text-xs leading-5 text-[#647168]">Project work with industry mentors.</p></div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-5 w-5 shrink-0 text-[#176b45]" />
                <div><h4 className="text-sm font-semibold text-[#17231c]">Peer collaboration</h4><p className="mt-1 text-xs leading-5 text-[#647168]">Student teams working across branches.</p></div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-start gap-3">
              <a
                href="#activities"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md text-sm font-bold text-white bg-[#176b45] hover:bg-[#105437] transition-all  min-h-[48px]"
              >
                <span>Explore Activities</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 transition-all min-h-[48px]"
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
          <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 rounded-md ">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Want to Host or Propose an Initiative?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-6 leading-relaxed">
              FOLE WORKS supports student and faculty-led initiatives at CEV. If you have an idea for a technical workshop,
              robotics competition, or open-source engineering project, reach out to the team.
            </p>
            <div className="flex flex-wrap items-center justify-start gap-3">
              <a
                href="mailto:folecev@gmail.com"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-md text-xs font-bold text-white bg-[#176b45] hover:bg-[#105437] transition-colors  min-h-[44px]"
              >
                <Mail className="w-4 h-4" />
                <span>folecev@gmail.com</span>
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 px-4 py-3 rounded-md text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 transition-colors min-h-[44px]"
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
