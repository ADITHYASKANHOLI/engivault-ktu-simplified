"use client";

import React, { useState } from "react";
import {
  SpaceUsageReport,
  SpaceDailySessionMetric,
  SpacePeakHourMetric,
  SpaceEventAttendanceMetric,
} from "@/lib/space/types";
import { Calendar, Clock, Users, ArrowDownToLine } from "lucide-react";

interface AdminReportsViewProps {
  initialReport: SpaceUsageReport;
}

export function AdminReportsView({ initialReport }: AdminReportsViewProps) {
  const [report, setReport] = useState<SpaceUsageReport>(initialReport);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (startDate) params.set("start", startDate);
      if (endDate) params.set("end", endDate);

      const res = await fetch(`/api/admin/space/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.warn("Report filter failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    const params = new URLSearchParams();
    if (startDate) params.set("start", startDate);
    if (endDate) params.set("end", endDate);
    params.set("format", "csv");
    const downloadUrl = `/api/admin/space/reports?${params.toString()}`;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `fole-space-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-8">
      {/* Filter and CSV Export Toolbar */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
          >
            {loading ? "Filtering..." : "Apply Range"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleDownloadCsv}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
        >
          <ArrowDownToLine className="w-4 h-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Daily Sessions Summary */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>Daily Walk-in Volume</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Total Sessions</th>
                <th className="py-3 px-4">Unique Students</th>
                <th className="py-3 px-4">Avg Duration (Mins)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.dailySessions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    No session data recorded for this period.
                  </td>
                </tr>
              ) : (
                report.dailySessions.map((d: SpaceDailySessionMetric) => (
                  <tr key={d.date} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">{d.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{d.count}</td>
                    <td className="py-3 px-4 text-slate-600">{d.uniqueUsers}</td>
                    <td className="py-3 px-4 text-slate-600">{d.avgDurationMinutes} m</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Peak Hours Grid */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-600" />
          <span>Peak Usage Hours (IST 24h)</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {report.peakHours.map((h: SpacePeakHourMetric) => (
            <div
              key={h.hour}
              className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex flex-col items-center justify-center text-center"
            >
              <span className="text-[11px] font-mono text-slate-500">
                {String(h.hour).padStart(2, "0")}:00
              </span>
              <span className="text-xl font-black text-slate-900 mt-1">{h.count}</span>
              <span className="text-[10px] text-slate-400">starts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Event Attendance Table */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-600" />
          <span>Workshop Attendance Rates</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Event Title</th>
                <th className="py-3 px-4">Date (IST)</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Registered</th>
                <th className="py-3 px-4">Checked In</th>
                <th className="py-3 px-4">Turnout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.eventAttendance.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No workshop attendance recorded.
                  </td>
                </tr>
              ) : (
                report.eventAttendance.map((e: SpaceEventAttendanceMetric) => (
                  <tr key={e.eventId} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{e.title}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{e.startsAt}</td>
                    <td className="py-3 px-4 text-slate-600">{e.capacity}</td>
                    <td className="py-3 px-4 text-slate-800">{e.registered}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">{e.checkedIn}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700">
                        {e.attendanceRate}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
