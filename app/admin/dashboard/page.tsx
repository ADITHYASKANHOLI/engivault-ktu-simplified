import React from "react";
import Link from "next/link";
import {
  BookOpen,
  Layers,
  Video,
  FileText,
  UploadCloud,
  Activity,
  ArrowRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { getAdminStats, getActivityLogs, getAllSubjects } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();
  const activities = await getActivityLogs();
  const subjects = await getAllSubjects();

  const statCards = [
    {
      label: "Total Subjects",
      value: stats.totalSubjects,
      sub: `${stats.publishedSubjects} active in catalog`,
      icon: BookOpen,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
    },
    {
      label: "Syllabus Modules",
      value: stats.totalModules,
      sub: "Curriculum modules",
      icon: Layers,
      iconColor: "text-cyan-600",
      iconBg: "bg-cyan-50",
    },
    {
      label: "Recorded Lectures",
      value: stats.totalLessons,
      sub: "Video class sessions",
      icon: Video,
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-50",
    },
    {
      label: "Study Materials",
      value: stats.totalMaterials,
      sub: "Notes & Question papers",
      icon: FileText,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
  ];

  const quickActions = [
    {
      title: "Manage Subjects",
      description: "Create new courses, edit descriptions, adjust display order, and toggle publishing.",
      href: "/admin/dashboard/subjects",
      icon: BookOpen,
      color: "text-blue-700 bg-blue-50",
    },
    {
      title: "Upload Wizard",
      description: "Attach recorded MP4 lecture videos or PDF note bundles directly to curriculum lessons.",
      href: "/admin/dashboard/uploads",
      icon: UploadCloud,
      color: "text-indigo-700 bg-indigo-50",
    },
    {
      title: "Activity & Audit Trail",
      description: "Review comprehensive chronological logs of logins, uploads, edits, and administrative operations.",
      href: "/admin/dashboard/activity",
      icon: Activity,
      color: "text-cyan-700 bg-cyan-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Dedicated Header Row */}
      <div className="pb-6 border-b border-slate-200/80">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Administrator Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
          Real-time control room for KTU curriculum structure, video lectures, and study media.
        </p>
      </div>

      {/* Standardized Metric Cards (Same height, padding, icon dimensions, typography hierarchy) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="h-32 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between transition-all hover:border-slate-300"
            >
              <div className="flex flex-col justify-between h-full">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.label}
                </span>
                <span className="text-3xl font-black text-slate-900 tracking-tight leading-none my-auto">
                  {card.value}
                </span>
                <span className="text-xs font-medium text-slate-600">
                  {card.sub}
                </span>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg} ${card.iconColor}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              href={action.href}
              className="group p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-500/40 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${action.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {action.description}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-1 text-xs font-semibold text-blue-700 group-hover:translate-x-0.5 transition-transform">
                <span>Launch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Two-Column Overview Panels with Standardized Typography */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Curriculum Overview */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Curriculum Overview
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Active subjects and module distributions
              </p>
            </div>
            <Link
              href="/admin/dashboard/subjects"
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 transition-colors"
            >
              Manage All →
            </Link>
          </div>

          <div className="space-y-3">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <div className="min-w-0 pr-3">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {sub.title}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    {sub.code || "KTU"} • {sub.modules_count || 0} Modules • {sub.lessons_count || 0} Lectures
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md shrink-0 ${
                    sub.published
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}
                >
                  {sub.published ? "PUBLISHED" : "DRAFT"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Admin Activity */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Recent Admin Activity
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit trail of administrative operations
              </p>
            </div>
            <Link
              href="/admin/dashboard/activity"
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 transition-colors"
            >
              Full Log →
            </Link>
          </div>

          <div className="space-y-3">
            {activities.slice(0, 5).map((act) => (
              <div
                key={act.id}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs"
              >
                <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900">{act.action}</div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">
                    {act.entity_type} {act.metadata ? `• ${JSON.stringify(act.metadata)}` : ""}
                  </div>
                </div>
                <span className="text-xs text-slate-500 shrink-0 font-medium">
                  {formatDate(act.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
