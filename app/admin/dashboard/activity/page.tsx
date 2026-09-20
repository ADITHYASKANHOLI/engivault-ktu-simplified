import React from "react";
import { Activity, ShieldCheck, Clock } from "lucide-react";
import { getActivityLogs } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export default async function AdminActivityPage() {
  const logs = await getActivityLogs();

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-slate-200/80">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Activity & Audit Logs</h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Complete chronological record of logins, uploads, curriculum edits, and publishing events.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="p-4">Action</th>
                <th className="p-4">Entity Type</th>
                <th className="p-4">Metadata Payload</th>
                <th className="p-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-500" />
                      <span>{log.action}</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-600 uppercase text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-slate-100">
                      {log.entity_type || "SYSTEM"}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-[11px] text-slate-500 max-w-md truncate">
                    {log.metadata ? JSON.stringify(log.metadata) : "—"}
                  </td>
                  <td className="p-4 font-mono text-slate-500 text-right">
                    {formatDate(log.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
