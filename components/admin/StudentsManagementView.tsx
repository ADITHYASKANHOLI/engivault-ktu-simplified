"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  KeyRound,
  ShieldAlert,
  Trash2,

  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  X,
  Eye,
  EyeOff,
  UserX,
  UserCheck,
} from "lucide-react";

interface StudentRecord {
  id: string;
  username: string;
  createdAt: string;
  isSuspended: boolean;
}

export function StudentsManagementView() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal states
  const [resetModalStudent, setResetModalStudent] = useState<StudentRecord | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/students");
      const data = await res.json();
      if (res.ok) {
        setStudents(data.students || []);
        setIsOffline(Boolean(data.isOffline));
      } else {
        setNotification({ type: "error", message: data.error || "Failed to load students." });
      }
    } catch {
      setNotification({ type: "error", message: "Network error loading student directory." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalStudent || actionLoading) return;

    setActionLoading(true);
    setNotification(null);

    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset_password",
          userId: resetModalStudent.id,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setNotification({ type: "error", message: data.error || "Failed to reset password." });
        setActionLoading(false);
        return;
      }

      setNotification({ type: "success", message: data.message });
      setResetModalStudent(null);
      setNewPassword("");
      setActionLoading(false);
    } catch {
      setNotification({ type: "error", message: "Network error during password reset." });
      setActionLoading(false);
    }
  };

  const handleToggleSuspension = async (student: StudentRecord) => {
    const action = student.isSuspended ? "reactivate" : "suspend";
    if (!confirm(`Are you sure you want to ${action} account for @${student.username}?`)) {
      return;
    }

    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_suspension",
          userId: student.id,
          suspend: !student.isSuspended,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setNotification({ type: "success", message: data.message });
        fetchStudents();
      } else {
        setNotification({ type: "error", message: data.error || "Failed to update suspension status." });
      }
    } catch {
      setNotification({ type: "error", message: "Network error updating student." });
    }
  };

  const handleDeleteStudent = async (student: StudentRecord) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete @${student.username}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_student",
          userId: student.id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setNotification({ type: "success", message: data.message });
        fetchStudents();
      } else {
        setNotification({ type: "error", message: data.error || "Failed to delete student." });
      }
    } catch {
      setNotification({ type: "error", message: "Network error deleting student." });
    }
  };

  const filteredStudents = students.filter((s) =>
    s.username.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-emerald-400" />
            <span>Students Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage student registrations, perform administrative password resets, and audit member activity.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchStudents}
          disabled={loading}
          className="self-start sm:self-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-2 focus:outline-none"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Offline Mode Alert Banner */}
      {isOffline && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Offline / Local Store Mode</p>
            <p className="text-[11px] text-amber-300/80">
              Supabase credentials are not configured or are placeholder. Live student accounts require a production Supabase project with migration 010 applied.
            </p>
          </div>
        </div>
      )}

      {/* Notifications */}
      {notification && (
        <div
          role="alert"
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
            notification.type === "success"
              ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
              : "bg-red-950/40 border-red-800/60 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by student username..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <p className="text-xs">Loading students directory...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">No students found</p>
            <p className="text-xs text-slate-500">
              {searchQuery ? "No accounts match your search filter." : "No student accounts registered yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400 font-bold">
                          {student.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white">@{student.username}</p>
                          <p className="text-[10px] text-slate-500 font-mono">ID: {student.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(student.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      {student.isSuspended ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-950/60 text-red-400 border border-red-800/60">
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setResetModalStudent(student);
                            setNewPassword("");
                            setShowPassword(false);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-900/60 text-slate-200 hover:text-emerald-300 border border-slate-700 transition-colors flex items-center gap-1 text-[11px]"
                          title="Reset student password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Reset PW</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleSuspension(student)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            student.isSuspended
                              ? "bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border-emerald-800/60"
                              : "bg-slate-800 hover:bg-amber-950/60 text-amber-400 border-slate-700"
                          }`}
                          title={student.isSuspended ? "Reactivate student" : "Suspend student"}
                        >
                          {student.isSuspended ? (
                            <UserCheck className="w-3.5 h-3.5" />
                          ) : (
                            <UserX className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(student)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/60 text-red-400 border border-slate-700 transition-colors"
                          title="Delete student account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Password Reset Modal Dialog */}
      {resetModalStudent && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={() => setResetModalStudent(null)}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 text-white z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm">Reset Password: @{resetModalStudent.username}</h3>
              </div>
              <button
                type="button"
                onClick={() => setResetModalStudent(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Enter a temporary or new password for this student. Since there is no email recovery, you will need to convey this password to the student.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (8-72 characters)"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Resetting...</span>
                    </>
                  ) : (
                    <span>Save New Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
