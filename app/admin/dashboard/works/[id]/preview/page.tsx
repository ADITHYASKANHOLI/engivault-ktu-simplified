import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Edit2,
  ExternalLink,
  ShieldAlert,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { getWorksActivityById } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminWorksPreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;
  const activity = await getWorksActivityById(id);

  if (!activity) {
    notFound();
  }

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

  return (
    <div className="space-y-6">
      {/* Admin Preview Control Banner */}
      <div className="bg-amber-500/10 dark:bg-amber-950/50 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider font-mono text-amber-600 dark:text-amber-400">
                Admin Preview Mode
              </span>
              <span
                className={cn(
                  "text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded-full",
                  activity.status === "published" && "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
                  activity.status === "draft" && "bg-amber-500/20 text-amber-600 dark:text-amber-400",
                  activity.status === "archived" && "bg-slate-500/20 text-slate-500"
                )}
              >
                Status: {activity.status}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {activity.status === "published"
                ? "This activity is published and publicly visible on the FOLE WORKS website."
                : "This activity is private. Students cannot see or access it until published."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/dashboard/works/activities"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors min-h-[40px] flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Activities</span>
          </Link>

          <Link
            href={`/admin/dashboard/works/${activity.id}/edit`}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors min-h-[40px] flex items-center gap-1.5 shadow-2xs"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Activity</span>
          </Link>
        </div>
      </div>

      {/* Render the Exact Student Activity Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <header className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider font-mono bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                {activity.category}
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                {activity.activity_type}
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/30">
                {activity.delivery_mode.replace("_", " ")}
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

          <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-500" />
              <span>About this Activity</span>
            </h2>
            <div className="prose dark:prose-invert max-w-none text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {activity.description}
            </div>
          </section>

          {activity.learning_outcomes && activity.learning_outcomes.length > 0 && (
            <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Key Learning Outcomes</span>
              </h2>
              <ul className="grid grid-cols-1 gap-2.5 pt-1">
                {activity.learning_outcomes.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs sm:text-sm text-slate-700 dark:text-slate-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-md space-y-5">
            <div className="flex items-baseline justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Registration Fee
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                {!activity.fee_amount || activity.fee_amount === 0
                  ? "Free / Open"
                  : `${activity.currency || "INR"} ${activity.fee_amount}`}
              </span>
            </div>

            {activity.registration_url && (
              <a
                href={activity.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-emerald-600 dark:bg-emerald-600 transition-all min-h-[44px]"
              >
                <span>Test Registration Link</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
              {startDateStr && (
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-slate-900 dark:text-white">Date & Time</span>
                    <span>{startDateStr} {startTimeStr ? `at ${startTimeStr}` : ""}</span>
                  </div>
                </div>
              )}

              {activity.venue && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-slate-900 dark:text-white">Venue</span>
                    <span>{activity.venue}</span>
                  </div>
                </div>
              )}

              {activity.capacity && (
                <div className="flex items-start gap-2.5">
                  <Users className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-slate-900 dark:text-white">Capacity</span>
                    <span>{activity.capacity} seats</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
