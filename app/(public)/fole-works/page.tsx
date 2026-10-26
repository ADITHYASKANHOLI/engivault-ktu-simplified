import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Briefcase,
  Cpu,
  Mail,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { WorksActivity } from "@/types";
import { getPublishedWorksActivities } from "@/lib/queries";
import { FoleWorksLogo } from "@/components/branding/FoleWorksLogo";
import { FoleWorksEventsView } from "@/components/works/FoleWorksEventsView";
import { WorksFilterView } from "@/components/works/WorksFilterView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "FOLE WORKS — Works, Events & Workshops | FOLE CEV",
  description:
    "Explore hands-on engineering workshops, internship programmes, technical bootcamps, and collaborative student projects organized by FOLE CEV at College of Engineering Vadakara.",
  openGraph: {
    title: "FOLE WORKS — Works, Events & Workshops | FOLE CEV",
    description:
      "Assembly Docket: Open-format academic laboratory sessions, peer hack sprints, and practitioner discourse held across decentralized physical nodes.",
    images: [{ url: "/branding/fole-works-logo.png", width: 1024, height: 1024, alt: "FOLE WORKS" }],
  },
};

export default async function FoleWorksPage() {
  let activities: WorksActivity[] = [];
  let fetchError: string | null = null;

  try {
    activities = await getPublishedWorksActivities();
  } catch (err: any) {
    console.error("[FOLE WORKS PAGE] Failed to retrieve published activities during SSR:", {
      message: err?.message || "Unknown error",
      timestamp: new Date().toISOString(),
    });
    fetchError = "We were unable to retrieve published activities from the vault. Please try reloading.";
  }

  return (
    <div className="min-h-screen bg-surface-canvas text-on-surface font-body pt-16 transition-colors">
      {/* Brand Hero Header */}
      <section className="relative pt-12 pb-8 sm:pt-16 sm:pb-12 border-b border-border-subtle bg-surface-warm/50">
        <div className="max-w-7xl mx-auto px-gutter relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <div className="mb-4 transform hover:scale-105 transition-transform duration-300">
              <FoleWorksLogo size="lg" showWordmark={false} href={null} priority />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-warm border border-border-firm text-secondary text-xs font-code-tabular font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-secondary" />
              <span>FOLE CEV Professional &amp; Operational Wing</span>
            </div>

            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold mb-2">
              FOLE <span className="font-code-tabular text-secondary font-bold">WORKS</span>
            </h1>

            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed max-w-2xl mb-6">
              The operational and professional engineering collective at <strong>College of Engineering Vadakara (CEV)</strong>.
              Peer-convened laboratory discourse, hackathons, and physical compute assembly across campus nodes.
            </p>

            {/* Value Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left">
              <div className="bg-surface-card p-3.5 rounded border border-border-subtle flex items-start gap-3">
                <div className="p-2 rounded bg-surface-warm text-primary shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-primary font-code-tabular uppercase">Hands-on Labs</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">Hardware &amp; bare-metal systems practice</p>
                </div>
              </div>

              <div className="bg-surface-card p-3.5 rounded border border-border-subtle flex items-start gap-3">
                <div className="p-2 rounded bg-surface-warm text-secondary shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-primary font-code-tabular uppercase">Internships</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">Project sprints with industry fellows</p>
                </div>
              </div>

              <div className="bg-surface-card p-3.5 rounded border border-border-subtle flex items-start gap-3">
                <div className="p-2 rounded bg-surface-warm text-primary shrink-0">
                  <span className="material-symbols-outlined text-base">groups</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-primary font-code-tabular uppercase">Collaborative Projects</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">Autonomous robotics &amp; open-source KTU codex</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stitch Design: Primary Works & Events Assembly Docket */}
      <FoleWorksEventsView initialActivities={activities} error={fetchError} />

      {/* Database Activities Catalog Explorer */}
      <section className="py-12 border-t border-border-subtle bg-surface-warm/40">
        <div className="max-w-7xl mx-auto px-gutter">
          <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-2">
            <div>
              <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest block mb-1">
                Database Catalog
              </span>
              <h2 className="font-headline-md text-headline-md text-primary font-bold">
                Archival Activities Directory
              </h2>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">
              Filtered lookup of registered workshops, project batches, and internships in the FOLE Works repository.
            </p>
          </div>

          <WorksFilterView initialActivities={activities} error={fetchError} />
        </div>
      </section>

      {/* Community Collaboration & Contact Banner */}
      <section className="py-12 border-t border-border-subtle bg-surface-card">
        <div className="max-w-4xl mx-auto px-gutter text-center">
          <div className="bg-surface-warm border border-border-firm p-6 sm:p-10 rounded shadow-xs">
            <h3 className="font-headline-sm text-headline-sm font-bold text-primary mb-2">
              Want to Host or Propose an Initiative?
            </h3>
            <p className="text-body-sm text-body-sm text-on-surface-variant max-w-2xl mx-auto mb-6 leading-relaxed">
              FOLE WORKS supports student and faculty-led initiatives at CEV. If you have an idea for a technical workshop,
              robotics competition, or open-source engineering project, reach out to the campus team.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="mailto:folecev@gmail.com"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded text-xs font-code-tabular font-bold text-on-primary bg-primary hover:bg-secondary transition-colors shadow-xs"
              >
                <Mail className="w-4 h-4" />
                <span>folecev@gmail.com</span>
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded text-xs font-code-tabular font-bold text-on-surface border border-border-firm bg-surface-card hover:bg-surface-warm transition-colors"
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
