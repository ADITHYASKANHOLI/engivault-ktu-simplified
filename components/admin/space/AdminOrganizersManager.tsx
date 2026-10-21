"use client";

import React, { useState } from "react";
import { SpaceOrganizer } from "@/lib/space/types";
import { formatDateTimeIST } from "@/lib/space/time";
import { UserCheck, UserPlus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";

interface AdminOrganizersManagerProps {
  initialOrganizers: SpaceOrganizer[];
}

export function AdminOrganizersManager({ initialOrganizers }: AdminOrganizersManagerProps) {
  const [organizers, setOrganizers] = useState<SpaceOrganizer[]>(initialOrganizers);
  const [usernameInput, setUsernameInput] = useState("");
  const [labelInput, setLabelInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const refreshList = async () => {
    try {
      const res = await fetch("/api/admin/space/organizers");
      if (res.ok) {
        const data = await res.json();
        setOrganizers(data.organizers);
      }
    } catch (err) {
      console.warn("Organizer reload failed:", err);
    }
  };

  const handleAddOrganizer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;

    setAdding(true);
    setActionMessage(null);

    try {
      const res = await fetch("/api/admin/space/organizers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameInput.trim(),
          label: labelInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: "error", text: data.error || "Failed to add organizer." });
      } else {
        setActionMessage({
          type: "success",
          text: data.message || `Organizer @${usernameInput} added successfully.`,
        });
        setUsernameInput("");
        setLabelInput("");
        await refreshList();
      }
    } catch (err) {
      setActionMessage({ type: "error", text: "Network error adding organizer." });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveOrganizer = async (userId: string, username: string) => {
    if (!window.confirm(`Revoke verified organizer privileges from @${username}?`)) return;

    try {
      const res = await fetch(`/api/admin/space/organizers/${userId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: "error", text: data.error || "Failed to remove organizer." });
      } else {
        setActionMessage({ type: "success", text: `Revoked organizer access for @${username}.` });
        await refreshList();
      }
    } catch (err) {
      setActionMessage({ type: "error", text: "Network error." });
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      {actionMessage && (
        <div
          className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between ${
            actionMessage.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-red-50 border-red-300 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>

          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-xs underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Add Verified Organizer Form */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-emerald-600" />
          <span>Add Verified Organizer by Username</span>
        </h2>
        <p className="text-xs text-slate-500">
          Search for an existing FOLE Web student account by username. Only verified organizers can create events and access the Check-In Desk.
        </p>

        <form onSubmit={handleAddOrganizer} className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="flex-1">
            <input
              type="text"
              required
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Student username (e.g. adithya, rahul_k)"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="sm:w-48">
            <input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder="Role tag (e.g. Robotics Lead)"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={adding}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0 disabled:opacity-50 min-h-[40px]"
          >
            <UserPlus className="w-4 h-4" />
            <span>{adding ? "Verifying..." : "Add Organizer"}</span>
          </button>
        </form>
      </div>

      {/* Verified Organizers Roster */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-600" />
          <span>Active Verified Organizers ({organizers.filter((o) => o.active).length})</span>
        </h2>

        <div className="divide-y divide-slate-100 text-xs">
          {organizers.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              No verified organizers configured yet.
            </div>
          ) : (
            organizers.map((org) => {
              const student = org.student;
              const username = student?.username || "unknown";
              const displayName = student?.display_name || "Student";

              return (
                <div
                  key={org.user_id}
                  className="py-3.5 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {displayName}
                      </span>
                      <span className="font-mono text-slate-400 text-xs">
                        @{username}
                      </span>
                      {org.added_by_label && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium text-[10px] border border-emerald-200">
                          {org.added_by_label}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Verified on {formatDateTimeIST(org.added_at)} • Status:{" "}
                      <span className={org.active ? "text-emerald-600 font-bold" : "text-slate-400"}>
                        {org.active ? "ACTIVE" : "REVOKED"}
                      </span>
                    </div>
                  </div>

                  {org.active && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOrganizer(org.user_id, username)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Revoke organizer privileges"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
