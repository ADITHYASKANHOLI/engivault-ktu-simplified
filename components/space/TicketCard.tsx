"use client";

import React, { useState } from "react";
import { formatDateTimeIST } from "@/lib/space/time";
import { Download, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketCardProps {
  eventTitle: string;
  startsAt: string;
  endsAt: string;
  attendeeName: string;
  username: string;
  ticketCode: string;
  qrSvg: string;
  qrDataUrl: string;
  status: "registered" | "cancelled" | "checked_in";
  checkinMethod?: "qr" | "virtual" | "manual";
  checkedInAt?: string;
  className?: string;
}

export function TicketCard({
  eventTitle,
  startsAt,
  endsAt,
  attendeeName,
  username,
  ticketCode,
  qrSvg,
  qrDataUrl,
  status,
  checkinMethod,
  checkedInAt,
  className,
}: TicketCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(ticketCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy ticket code:", err);
    }
  };

  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `ticket-${ticketCode.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isCancelled = status === "cancelled";
  const isCheckedIn = status === "checked_in";

  return (
    <div
      className={cn(
        "relative rounded-2xl border bg-white shadow-sm overflow-hidden flex flex-col md:flex-row transition-all",
        isCancelled
          ? "border-slate-300 opacity-70"
          : isCheckedIn
          ? "border-emerald-300"
          : "border-slate-200 hover:border-emerald-300",
        className
      )}
    >
      {/* Left side: Ticket Details */}
      <div className="flex-1 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-dashed border-slate-200">
        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              FOLE SPACE PASS
            </span>

            {isCheckedIn && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Checked In ({checkinMethod?.toUpperCase() || "OK"})</span>
              </span>
            )}

            {isCancelled && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Cancelled</span>
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold text-slate-900 leading-snug line-clamp-2">
            {eventTitle}
          </h3>

          <div className="mt-4 space-y-2 text-xs text-slate-600">
            <div>
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">
                Session Time (IST)
              </span>
              <span className="font-medium text-slate-800 text-sm">
                {formatDateTimeIST(startsAt)} – {new Date(endsAt).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            <div>
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">
                Attendee
              </span>
              <span className="font-medium text-slate-800">
                {attendeeName} <span className="text-slate-400">(@{username})</span>
              </span>
            </div>

            {isCheckedIn && checkedInAt && (
              <div>
                <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">
                  Arrival Timestamp
                </span>
                <span className="text-emerald-700 font-medium">
                  {formatDateTimeIST(checkedInAt)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Short Text Code Fallback */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Ticket Code
            </span>
            <code className="text-xs font-mono font-bold text-slate-800 select-all">
              {ticketCode}
            </code>
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            title="Copy ticket code"
            aria-label="Copy ticket code"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Right side: Scannable QR and Actions */}
      <div className="p-6 flex flex-col items-center justify-center bg-slate-50/60 md:w-56 shrink-0">
        <div className="relative p-3 bg-white rounded-xl shadow-xs border border-slate-200">
          {/* Render Vector SVG directly for razor-sharp scanning */}
          <div
            className="w-36 h-36 [&>svg]:w-full [&>svg]:h-full"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />

          {isCancelled && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center rounded-xl p-2 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mb-1" />
              <span className="text-xs font-bold text-red-700">Ticket Void</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleDownloadPng}
          disabled={isCancelled}
          className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 active:bg-slate-200 rounded-lg border border-slate-200 transition-colors shadow-xs disabled:opacity-50 disabled:pointer-events-none"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Save PNG</span>
        </button>
      </div>
    </div>
  );
}
