import React from "react";
import Link from "next/link";
import {
  Briefcase,
  PlusCircle,
  Calendar,
  CheckCircle2,
  FileEdit,
  Archive,
  ArrowRight,
  ExternalLink,
  Clock,
} from "lucide-react";
import { getWorksActivityMetrics, getAllWorksActivitiesForAdmin } from "@/lib/queries";
import { FoleWorksLogo } from "@/components/branding/FoleWorksLogo";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminWorksOverviewPage() {
  const [metrics, activities] = await Promise.all([
    getWorksActivityMetrics(),
    getAllWorksActivitiesForAdmin({ limit: 5 }),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center p-1 border border-emerald-500/30 shrink-0">
            <FoleWorksLogo size="sm" showWordmark={false} href={null} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                FOLE WORKS
              </h1>
              <span className="text-[10px] font-bold tracking-wider font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                Operations
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Manage workshops, student internships, collaborative robotics projects, and technical bootcamps.
            </p>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Link
            href="/fole-works"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[44px]"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
            <span>Public Site</span>
          </Link>

          <Link
            href="/admin/dashboard/works/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-all shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Activity</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Total</span>
            <Briefcase className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {metrics.total}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">All recorded items</div>
        </div>

        {/* Published */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Published</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {metrics.published}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Live on website</div>
        </div>

        {/* Upcoming */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-cyan-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Upcoming</span>
            <Calendar className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
            {metrics.upcoming}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Scheduled events</div>
        </div>

        {/* Drafts */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Drafts</span>
            <FileEdit className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {metrics.draft}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">In preparation</div>
        </div>

        {/* Archived */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Archived</span>
            <Archive className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-600 dark:text-slate-400 font-mono">
            {metrics.archived}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Historical records</div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/dashboard/works/activities"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 shadow-2xs flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                Activities Catalogue
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                View, filter, edit, publish, archive, or delete all activities.
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0" />
        </Link>

        <Link
          href="/admin/dashboard/works/create"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 shadow-2xs flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-500">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                Create New Activity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Post a new workshop, internship programme, or student project.
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0" />
        </Link>
      </div>

      {/* Recent Activities Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Activities
            </h2>
          </div>
          <Link
            href="/admin/dashboard/works/activities"
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activities.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {activities.map((act) => (
              <div
                key={act.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {act.category}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded-full",
                        act.status === "published" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                        act.status === "draft" && "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                        act.status === "archived" && "bg-slate-500/15 text-slate-500"
                      )}
                    >
                      {act.status}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {act.delivery_mode}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-500 transition-colors">
                    {act.title}
                  </h4>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/admin/dashboard/works/${act.id}/preview`}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors min-h-[36px] flex items-center"
                  >
                    Preview
                  </Link>
                  <Link
                    href={`/admin/dashboard/works/${act.id}/edit`}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors min-h-[36px] flex items-center"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-500">
            No activities created yet. Click &quot;Create Activity&quot; to get started.
          </div>
        )}
      </div>
    </div>
  );
}
