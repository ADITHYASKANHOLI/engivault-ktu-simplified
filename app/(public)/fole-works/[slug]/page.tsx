import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Globe,
  Users,
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  Mail,
  Phone,
  FileText,
  AlertCircle,
} from "lucide-react";
import { getWorksActivityBySlug } from "@/lib/queries";
import { WorksRegistrationCTA } from "@/components/works/WorksRegistrationCTA";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const activity = await getWorksActivityBySlug(slug, true);

  if (!activity) {
    return {
      title: "Activity Not Found | FOLE WORKS",
    };
  }

  return {
    title: `${activity.title} — FOLE WORKS | FOLE CEV`,
    description: activity.short_description || activity.description.slice(0, 160),
    openGraph: {
      title: `${activity.title} | FOLE WORKS`,
      description: activity.short_description || activity.description.slice(0, 160),
      images: [{ url: activity.cover_image || "/branding/fole-works-logo.png" }],
    },
  };
}

export default async function WorksActivityDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const activity = await getWorksActivityBySlug(slug, true);

  if (!activity) {
    notFound();
  }

  // Format start & end timestamps
  const startDateStr = activity.start_at
    ? new Date(activity.start_at).toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: activity.timezone || "Asia/Kolkata",
      })
    : null;

  const startTimeStr = activity.start_at
    ? new Date(activity.start_at).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: activity.timezone || "Asia/Kolkata",
      })
    : null;

  const endDateStr = activity.end_at
    ? new Date(activity.end_at).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: activity.timezone || "Asia/Kolkata",
      })
    : null;

  const regDeadlineStr = activity.registration_closes_at
    ? new Date(activity.registration_closes_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: activity.timezone || "Asia/Kolkata",
      })
    : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07111F] text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white pt-24 pb-16 sm:pt-32 sm:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 mb-6 flex-wrap">
          <Link href="/" className="hover:text-emerald-500 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/fole-works" className="hover:text-emerald-500 transition-colors">
            FOLE WORKS
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium truncate max-w-xs sm:max-w-md">
            {activity.title}
          </span>
        </nav>

        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/fole-works"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Activities Catalogue</span>
          </Link>
        </div>

        {/* Main Grid: Left Content (2 cols) & Right Action Card (1 col) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header / Hero Card */}
            <header className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider font-mono bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  {activity.category}
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                  {activity.activity_type}
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/30">
                  {activity.delivery_mode === "in_person" ? "In-Person" : activity.delivery_mode === "online" ? "Online" : "Hybrid"}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight break-words leading-tight">
                {activity.title}
              </h1>

              {activity.short_description && (
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {activity.short_description}
                </p>
              )}

              {activity.organizer_details && (
                <div className="pt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Host:</span>
                  <span>{activity.organizer_details}</span>
                </div>
              )}
            </header>

            {/* Detailed Description */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                <span>About this Activity</span>
              </h2>
              <div className="prose dark:prose-invert max-w-none text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {activity.description}
              </div>
            </section>

            {/* Learning Outcomes */}
            {activity.learning_outcomes && activity.learning_outcomes.length > 0 && (
              <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span>Key Learning Outcomes & Skills</span>
                </h2>
                <ul className="grid grid-cols-1 gap-3 pt-2">
                  {activity.learning_outcomes.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Supporting Resources & Documents */}
            {activity.supporting_resources && activity.supporting_resources.length > 0 && (
              <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-500" />
                  <span>Supporting Resources & Guidelines</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {activity.supporting_resources.map((res, i) => (
                    <a
                      key={i}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/70 transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-500 transition-colors">
                          {res.title}
                        </span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition-colors shrink-0" />
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Sticky Action & Schedule Card */}
          <aside className="space-y-6 lg:sticky lg:top-28">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-md space-y-6">
              {/* Fee and Register CTA */}
              <WorksRegistrationCTA
                feeAmount={activity.fee_amount || 0}
                currency={activity.currency || "INR"}
                registrationUrl={activity.registration_url}
                registrationOpensAt={activity.registration_opens_at}
                registrationClosesAt={activity.registration_closes_at}
              />

              {/* Key Event Details List */}
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                {/* Date */}
                {startDateStr && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">Date</span>
                      <span>{startDateStr}</span>
                      {endDateStr && endDateStr !== startDateStr && <span> to {endDateStr}</span>}
                    </div>
                  </div>
                )}

                {/* Time */}
                {startTimeStr && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">Time & Zone</span>
                      <span>{startTimeStr} ({activity.timezone || "IST"})</span>
                    </div>
                  </div>
                )}

                {/* Venue / Delivery Mode */}
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">Venue</span>
                    <span>{activity.venue || (activity.delivery_mode === "online" ? "Online meeting link provided to registered participants" : "Campus Location TBD")}</span>
                  </div>
                </div>

                {/* Capacity */}
                {activity.capacity && (
                  <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">Batch Capacity</span>
                      <span>{activity.capacity} Participants</span>
                    </div>
                  </div>
                )}

                {/* Registration Deadline */}
                {regDeadlineStr && (
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">Registration Closes</span>
                      <span className="text-amber-600 dark:text-amber-400 font-medium">{regDeadlineStr}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Information */}
              {(activity.contact_email || activity.contact_phone) && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white block uppercase tracking-wider font-mono text-[10px]">
                    Queries & Assistance
                  </span>
                  {activity.contact_email && (
                    <a
                      href={`mailto:${activity.contact_email}`}
                      className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="truncate">{activity.contact_email}</span>
                    </a>
                  )}
                  {activity.contact_phone && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{activity.contact_phone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
