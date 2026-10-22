"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  History,
  Loader2,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";

interface StudentLoginSession {
  id: string;
  userId: string | null;
  username: string;
  displayName: string;
  loginAt: string;
  endedAt: string | null;
  endReason: "logout" | "new_login" | null;
  loginSource: "password" | "signup";
  status: "ended" | "not_ended";
}

interface SessionResponse {
  sessions: StudentLoginSession[];
  totalCount: number;
  openRecordCount: number;
  page: number;
  pageSize: number;
}

function formatIst(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function StudentLoginSessionsView() {
  const [data, setData] = useState<SessionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "not_ended" | "ended">("all");
  const [page, setPage] = useState(0);

  const loadSessions = useCallback(async (requestedPage = 0, asRefresh = false) => {
    if (asRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/student-sessions?page=${requestedPage}`, {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load student login history.");
      }

      setData(result as SessionResponse);
      setPage(result.page ?? requestedPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load student login history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions(0);
  }, [loadSessions]);

  const filteredSessions = useMemo(() => {
    const records = data?.sessions ?? [];
    const needle = query.trim().toLowerCase();
    return records.filter((record) => {
      const matchesQuery =
        !needle ||
        record.username.toLowerCase().includes(needle) ||
        record.displayName.toLowerCase().includes(needle);
      const matchesStatus = statusFilter === "all" || record.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [data, query, statusFilter]);

  const pageCount = Math.max(1, Math.ceil((data?.totalCount ?? 0) / (data?.pageSize ?? 50)));
  const firstRow = (data?.totalCount ?? 0) === 0 ? 0 : page * (data?.pageSize ?? 50) + 1;
  const lastRow = Math.min((page + 1) * (data?.pageSize ?? 50), data?.totalCount ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-xl font-bold text-white sm:text-2xl">
            <History className="h-6 w-6 text-emerald-400" />
            Student Login History
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-400 sm:text-sm">
            Each successful student sign-in is linked to the same account used by the Students Directory and FOLE SPACE organizer verification.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadSessions(page, true)}
          disabled={loading || refreshing}
          className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 disabled:opacity-50 sm:self-center"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-800/60 bg-red-950/30 p-4 text-xs text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Could not load login history</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Users className="h-4 w-4 text-emerald-400" /> Student sign-in records
          </div>
          <p className="mt-3 text-3xl font-bold tabular-nums text-white">{data?.totalCount ?? "—"}</p>
          <p className="mt-1 text-[11px] text-slate-500">Total recorded sign-ins</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Clock3 className="h-4 w-4 text-emerald-400" /> Records not yet ended
          </div>
          <p className="mt-3 text-3xl font-bold tabular-nums text-white">{data?.openRecordCount ?? "—"}</p>
          <p className="mt-1 text-[11px] text-slate-500">Not a live-online count; a record closes on logout or a later login in the same browser.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-lg flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search this page by username or display name"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as "all" | "not_ended" | "ended")}
          className="min-h-10 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Filter session record status"
        >
          <option value="all">All records</option>
          <option value="not_ended">Not ended</option>
          <option value="ended">Ended</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center gap-3 p-12 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
            <p className="text-xs">Loading student session records…</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="space-y-2 p-12 text-center text-slate-400">
            {data?.sessions.length ? <Search className="mx-auto h-8 w-8 text-slate-600" /> : <Users className="mx-auto h-8 w-8 text-slate-600" />}
            <p className="text-sm font-semibold text-slate-200">
              {data?.sessions.length ? "No records match these filters" : "No student login records yet"}
            </p>
            <p className="text-xs text-slate-500">
              New records are created after a student successfully signs in once the feature is deployed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-800/60 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Login time (IST)</th>
                  <th className="px-4 py-3">End time (IST)</th>
                  <th className="px-4 py-3">Login source</th>
                  <th className="px-4 py-3">Record status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredSessions.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-white">{record.displayName || record.username}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-slate-400">@{record.username}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">{formatIst(record.loginAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3.5">{formatIst(record.endedAt)}</td>
                    <td className="px-4 py-3.5">{record.loginSource === "signup" ? "Account creation" : "Password sign-in"}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold ${record.status === "ended" ? "border-slate-700 bg-slate-800 text-slate-300" : "border-emerald-800/70 bg-emerald-950/40 text-emerald-300"}`}>
                        {record.status === "ended" ? <CheckCircle2 className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
                        {record.status === "ended" ? (record.endReason === "new_login" ? "New login" : "Logged out") : "Not ended"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing {firstRow}–{lastRow} of {data?.totalCount ?? 0} records. Search and status filters apply to this page.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadSessions(Math.max(0, page - 1))}
            disabled={page <= 0 || loading}
            className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </button>
          <span className="px-1 tabular-nums">Page {page + 1} of {pageCount}</span>
          <button
            type="button"
            onClick={() => void loadSessions(Math.min(pageCount - 1, page + 1))}
            disabled={page >= pageCount - 1 || loading}
            className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-40"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <p className="text-[10px] leading-relaxed text-slate-500">
        Login history stores the student username and login/logout times. It does not store passwords, authentication tokens, or IP addresses. Browser closure, device loss, or expired tokens may leave a record marked “Not ended”; this is not a reliable indicator that the student is currently online.
      </p>
    </div>
  );
}
