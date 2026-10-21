import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAuthenticatedStudent } from "@/lib/space/permissions";
import { spaceService } from "@/lib/space/service";
import { OpenSpaceCountdown } from "@/components/space/OpenSpaceCountdown";
import { TicketCard } from "@/components/space/TicketCard";
import { generateQrSvg, generateQrDataUrl, encodeTicketPayload } from "@/lib/space/tickets";
import { formatDateTimeIST } from "@/lib/space/time";
import {
  QrCode,
  DoorOpen,
  History,
  LogIn,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "My Tickets & Sessions — FOLE SPACE",
  description: "View active study sessions, upcoming workshop QR tickets, and attendance history.",
};

export default async function MySpacePage() {
  const student = await getAuthenticatedStudent();

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#07111F] pt-28 pb-16 flex items-center justify-center px-4">
        <div className="max-w-md w-full p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            My Space Passes
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            Sign in with your FOLE Web student account to access your active open-space passes, upcoming event tickets, and attendance history.
          </p>
          <Link
            href="/fole-space/open"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign in to Continue</span>
          </Link>
        </div>
      </div>
    );
  }

  const spaceData = await spaceService.getMySpaceData(student.id);

  // Generate QR svgs and data URLs for all upcoming registrations
  const upcomingList = (spaceData as any).upcomingRegistrations || spaceData.upcomingTickets || [];
  const ticketsWithQr = await Promise.all(
    upcomingList.map(async (reg: any) => {
      let qrSvg = "";
      let qrDataUrl = "";
      if (reg.ticket_code) {
        const payload = encodeTicketPayload(reg.ticket_code);
        qrSvg = await generateQrSvg(payload);
        qrDataUrl = await generateQrDataUrl(payload);
      }
      return { ...reg, qrSvg, qrDataUrl };
    })
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07111F] pt-24 pb-16 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-600 uppercase tracking-wider mb-1">
              <span>Student Pass Hub</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              My Tickets & Study Sessions
            </h1>
            <p className="text-xs text-slate-500">
              Logged in as {student.display_name} (@{student.username})
            </p>
          </div>

          <Link
            href="/fole-space/open"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold transition-colors"
          >
            <DoorOpen className="w-4 h-4" />
            <span>Open Space Hub</span>
          </Link>
        </div>

        {/* Section 1: Active Open Space Session (if any) */}
        {spaceData.activeSession && (
          <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-300 dark:border-emerald-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-emerald-600" />
                <span>Active Open Space Session</span>
              </h2>

              <Link
                href="/fole-space/open"
                className="text-xs font-bold text-emerald-600 hover:underline"
              >
                Manage in Open Hub →
              </Link>
            </div>

            <OpenSpaceCountdown
              expiresAt={spaceData.activeSession.expires_at}
              serverNow={(spaceData as any).serverNow || new Date().toISOString()}
            />
          </div>
        )}

        {/* Section 2: Upcoming Event Tickets */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-600" />
              <span>Upcoming Event Tickets ({ticketsWithQr.length})</span>
            </h2>

            <Link
              href="/fole-space/events"
              className="text-xs font-bold text-emerald-600 hover:underline"
            >
              Browse more events →
            </Link>
          </div>

          {ticketsWithQr.length === 0 ? (
            <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 text-xs">
              You do not have any upcoming event registrations.
            </div>
          ) : (
            <div className="space-y-6">
              {ticketsWithQr.map((t: any) => (
                <TicketCard
                  key={t.id}
                  eventTitle={t.event?.title || "Event Pass"}
                  startsAt={t.event?.starts_at || ""}
                  endsAt={t.event?.ends_at || ""}
                  attendeeName={student.display_name || student.username}
                  username={student.username}
                  ticketCode={t.ticket_code}
                  qrSvg={t.qrSvg}
                  qrDataUrl={t.qrDataUrl}
                  status={t.checked_in || t.checkin ? "checked_in" : "registered"}
                  checkinMethod={(t.checkin_method || t.checkin?.method) as "qr" | "virtual" | "manual" | undefined}
                  checkedInAt={t.checked_in_at || t.checkin?.checked_in_at || undefined}
                />
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Past History */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-slate-400" />
            <span>Past Attendance & Sessions</span>
          </h2>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {spaceData.recentSessions.map((s) => (
              <div key={s.id} className="p-4 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Open Space Session ({s.status})
                  </span>
                  <span className="text-slate-500">
                    {formatDateTimeIST(s.started_at)} – {s.ended_at ? formatDateTimeIST(s.ended_at) : "Concluded"}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px] uppercase">
                  {s.source}
                </span>
              </div>
            ))}

            {spaceData.attendedEvents.map((ae: any) => (
              <div key={ae.id} className="p-4 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    {ae.event?.title || "Event"}
                  </span>
                  <span className="text-slate-500">
                    Checked in: {ae.checked_in_at ? formatDateTimeIST(ae.checked_in_at) : "Confirmed"} ({((ae.checkin_method || ae.method || "attended") as string).toUpperCase()})
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px] uppercase font-bold">
                  Attended
                </span>
              </div>
            ))}

            {spaceData.recentSessions.length === 0 && spaceData.attendedEvents.length === 0 && (
              <div className="p-6 text-center text-slate-400">
                No past session history recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
