"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Calendar,
  Search,
  PlusCircle,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Archive,
  AlertCircle,
  Loader2,
  RotateCcw,
  ExternalLink,
  Image as ImageIcon,
  ShieldAlert,
} from "lucide-react";
import { WorksActivity, WorksActivityStatus } from "@/types";
import { cn } from "@/lib/utils";

export default function AdminWorksActivitiesPage() {
  const [activities, setActivities] = useState<WorksActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Status confirmation modal state
  const [statusModal, setStatusModal] = useState<{
    activity: WorksActivity;
    targetStatus: WorksActivityStatus;
    title: string;
    description: string;
  } | null>(null);

  // Delete modal state
  const [deletingActivity, setDeletingActivity] = useState<WorksActivity | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/works?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load activities");
      }
      const data = await res.json();
      setActivities(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load activities");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const executeStatusChange = async (id: string, newStatus: WorksActivityStatus) => {
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/admin/works/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update status");
      }
      const updated = await res.json();
      setActivities((prev) => prev.map((a) => (a.id === id ? updated : a)));
      setStatusModal(null);
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStatusChangeRequest = (act: WorksActivity, targetStatus: WorksActivityStatus) => {
    if (targetStatus === "archived") {
      setStatusModal({
        activity: act,
        targetStatus,
        title: "Archive Activity?",
        description: `Are you sure you want to archive "${act.title}"? It will be removed from public listings and stored as a historical record.`,
      });
      return;
    }

    if (targetStatus === "draft" && act.status === "published") {
      setStatusModal({
        activity: act,
        targetStatus,
        title: "Unpublish Activity?",
        description: `Unpublishing "${act.title}" will instantly hide it from public visitors on the website.`,
      });
      return;
    }

    executeStatusChange(act.id, targetStatus);
  };

  const confirmDelete = async () => {
    if (!deletingActivity) return;
    try {
      setDeleteLoading(true);
      const res = await fetch(`/api/admin/works/${deletingActivity.id}?hard=false`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete activity");
      }
      setActivities((prev) => prev.filter((a) => a.id !== deletingActivity.id));
      setDeletingActivity(null);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            FOLE WORKS Activities
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage student workshops, internships, flyer posters, registration fees, and platform links.
          </p>
        </div>

        <Link
          href="/admin/dashboard/works/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-all shadow-xs min-h-[44px]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Activity</span>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activities by title, category, or venue..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[40px]"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-start">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[40px]"
            aria-label="Filter activities by publication status"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
            <option value="archived">Archived</option>
          </select>

          <button
            type="button"
            onClick={fetchActivities}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Refresh list"
            aria-label="Refresh activities"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto mb-2" />
          <span className="text-xs text-slate-500 font-medium">Loading activities...</span>
        </div>
      ) : activities.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No activities found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No activities match the current filters. Create a new activity or reset your search.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table (hidden md:block) */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-3 font-bold w-14">Flyer</th>
                  <th className="py-3 px-4 font-bold">Activity</th>
                  <th className="py-3 px-3 font-bold">Category</th>
                  <th className="py-3 px-3 font-bold">Fee</th>
                  <th className="py-3 px-3 font-bold">Platform Link</th>
                  <th className="py-3 px-3 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {activities.map((act) => {
                  const isBusy = actionLoadingId === act.id;
                  const feeDisplay = !act.fee_amount || act.fee_amount === 0 ? "Free / ₹0" : `₹${act.fee_amount}`;
                  return (
                    <tr key={act.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Flyer Thumbnail */}
                      <td className="py-3 px-3">
                        {act.cover_image ? (
                          <a
                            href={act.cover_image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-12 h-8 rounded-lg overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700 hover:opacity-80 transition-opacity"
                            title="View flyer image"
                          >
                            <img
                              src={act.cover_image}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </a>
                        ) : (
                          <div className="w-12 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                      </td>

                      {/* Title & Slug */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {act.title}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate">
                          /{act.slug}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {act.category}
                        </span>
                      </td>

                      {/* Fee */}
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {feeDisplay}
                        </span>
                      </td>

                      {/* Platform Link Verification */}
                      <td className="py-3 px-3">
                        {act.registration_url ? (
                          <a
                            href={act.registration_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 transition-colors"
                            title={`Open platform link: ${act.registration_url}`}
                          >
                            <span>Open Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[11px] font-mono text-slate-400">
                            None
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase",
                            act.status === "published" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                            act.status === "draft" && "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                            act.status === "archived" && "bg-slate-500/15 text-slate-500"
                          )}
                        >
                          {act.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {/* Publish toggle */}
                          {act.status === "draft" && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleStatusChangeRequest(act, "published")}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                              title="Publish activity"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Unpublish to draft */}
                          {act.status === "published" && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleStatusChangeRequest(act, "draft")}
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                              title="Unpublish to draft"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}

                          {/* Archive toggle */}
                          {act.status !== "archived" && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleStatusChangeRequest(act, "archived")}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Archive activity"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}

                          {/* Preview link */}
                          <Link
                            href={`/admin/dashboard/works/${act.id}/preview`}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Preview activity"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Edit link */}
                          <Link
                            href={`/admin/dashboard/works/${act.id}/edit`}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit activity"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>

                          {/* Delete action */}
                          <button
                            type="button"
                            onClick={() => setDeletingActivity(act)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Delete activity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards (block md:hidden) */}
          <div className="block md:hidden space-y-3.5">
            {activities.map((act) => {
              const isBusy = actionLoadingId === act.id;
              const feeDisplay = !act.fee_amount || act.fee_amount === 0 ? "Free / ₹0" : `₹${act.fee_amount}`;
              return (
                <div
                  key={act.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3"
                >
                  {/* Card Header: Flyer + Badges */}
                  <div className="flex items-start gap-3">
                    {act.cover_image ? (
                      <div className="w-16 h-12 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200 dark:border-slate-700">
                        <img src={act.cover_image} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {act.category}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase",
                            act.status === "published" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                            act.status === "draft" && "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                            act.status === "archived" && "bg-slate-500/15 text-slate-500"
                          )}
                        >
                          {act.status}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white break-words line-clamp-2">
                        {act.title}
                      </h3>
                    </div>
                  </div>

                  {/* Fee & Platform link metadata */}
                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">Fee:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{feeDisplay}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">Platform Link:</span>
                      {act.registration_url ? (
                        <a
                          href={act.registration_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          <span>Open Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400 font-mono">None</span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar (44px min touch target) */}
                  <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/dashboard/works/${act.id}/preview`}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 min-h-[44px] flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </Link>
                      <Link
                        href={`/admin/dashboard/works/${act.id}/edit`}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 min-h-[44px] flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </Link>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {act.status === "draft" && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleStatusChangeRequest(act, "published")}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 min-h-[44px]"
                        >
                          Publish
                        </button>
                      )}

                      {act.status === "published" && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleStatusChangeRequest(act, "draft")}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 min-h-[44px]"
                        >
                          Draft
                        </button>
                      )}

                      {act.status !== "archived" && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleStatusChangeRequest(act, "archived")}
                          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title="Archive"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setDeletingActivity(act)}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label="Delete activity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Confirmation Modal for Unpublishing / Archiving */}
      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {statusModal.title}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {statusModal.description}
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStatusModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(actionLoadingId)}
                onClick={() => executeStatusChange(statusModal.activity.id, statusModal.targetStatus)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors min-h-[44px] flex items-center gap-1.5"
              >
                {actionLoadingId && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Status Change</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Confirm Deletion
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete <strong>{deletingActivity.title}</strong>? This action will remove it from active listings.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingActivity(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors min-h-[44px] flex items-center gap-1.5"
              >
                {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Activity</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
