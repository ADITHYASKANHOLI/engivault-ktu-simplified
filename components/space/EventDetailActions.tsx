"use client";

import React, { useState } from "react";
import { SpaceEvent, SpaceEventRegistration } from "@/lib/space/types";
import { TicketCard } from "@/components/space/TicketCard";
import {
  CheckCircle2,
  QrCode,
  Share2,
  Check,
  AlertCircle,
  LogIn,
} from "lucide-react";

interface EventDetailActionsProps {
  event: SpaceEvent;
  isAuthenticated: boolean;
  registration: SpaceEventRegistration | null;
  qrSvg?: string;
  qrDataUrl?: string;
  studentName?: string;
  studentUsername?: string;
}

export function EventDetailActions({
  event,
  isAuthenticated,
  registration: initialRegistration,
  qrSvg,
  qrDataUrl,
  studentName = "Student",
  studentUsername = "student",
}: EventDetailActionsProps) {
  const [registration, setRegistration] = useState<SpaceEventRegistration | null>(initialRegistration);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isVirtualCheckingIn, setIsVirtualCheckingIn] = useState(false);

  // Trigger login modal
  const handleOpenLogin = () => {
    window.dispatchEvent(
      new CustomEvent("fole:open-login", {
        detail: { returnTo: `/fole-space/events/${event.slug}` },
      })
    );
  };

  // Register
  const handleRegister = async () => {
    if (!isAuthenticated) {
      handleOpenLogin();
      return;
    }

    setLoading(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/space/events/${event.id}/registration`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Registration failed.");
        return;
      }

      setRegistration(data.registration);
      // Reload page to generate ticket SVG & QR server-side
      window.location.reload();
    } catch (err) {
      setActionError("Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Cancel Registration
  const handleCancelRegistration = async () => {
    if (!window.confirm("Are you sure you want to cancel your seat for this event?")) return;

    setLoading(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/space/events/${event.id}/registration`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Failed to cancel.");
        return;
      }

      setRegistration(null);
      window.location.reload();
    } catch (err) {
      setActionError("Error cancelling registration.");
    } finally {
      setLoading(false);
    }
  };

  // Virtual Check-In
  const handleVirtualCheckin = async () => {
    setIsVirtualCheckingIn(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/space/events/${event.id}/checkin/virtual`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Virtual check-in failed.");
        return;
      }

      window.location.reload();
    } catch (err) {
      setActionError("Virtual check-in encountered an error.");
    } finally {
      setIsVirtualCheckingIn(false);
    }
  };

  // Copy share link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const isLive = event.status === "live";
  const isRegistered = !!registration && registration.status === "registered";
  const isCheckedIn = Boolean(registration?.checked_in || registration?.checkin);

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Notice: </span>
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TICKET SECTION (IF REGISTERED) */}
      {isRegistered && registration?.ticket_code && qrSvg ? (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-600" />
            <span>Your Event Pass</span>
          </h3>

          <TicketCard
            eventTitle={event.title}
            startsAt={event.starts_at}
            endsAt={event.ends_at}
            attendeeName={studentName}
            username={studentUsername}
            ticketCode={registration.ticket_code}
            qrSvg={qrSvg}
            qrDataUrl={qrDataUrl || ""}
            status={isCheckedIn ? "checked_in" : "registered"}
            checkinMethod={(registration.checkin_method || registration.checkin?.method) as "qr" | "virtual" | "manual" | undefined}
            checkedInAt={registration.checked_in_at || registration.checkin?.checked_in_at || undefined}
          />

          {/* Virtual Check-in Section */}
          {!isCheckedIn && (
            <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
                  Virtual Check-in Available
                </h4>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-400 mt-0.5">
                  {isLive
                    ? "The session is currently LIVE! Click below to confirm your presence."
                    : "Waiting for the organizer to start the session before virtual check-in unlocks."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleVirtualCheckin}
                disabled={!isLive || isVirtualCheckingIn}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 disabled:pointer-events-none shrink-0"
              >
                {isVirtualCheckingIn
                  ? "Verifying..."
                  : isLive
                  ? "Check in without QR"
                  : "Session Not Live"}
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleCancelRegistration}
              disabled={loading}
              className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
            >
              Cancel My Registration
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? "Link Copied" : "Share Event"}</span>
            </button>
          </div>
        </div>
      ) : (
        /* REGISTRATION CALL TO ACTION */
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Participation Pass
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Free Student Registration
              </h3>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 transition-colors"
              title="Share event link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            All tickets are 100% free for verified FOLE Web student community members. Reserve your seat to get a digital QR ticket.
          </p>

          {!isAuthenticated ? (
            <button
              type="button"
              onClick={handleOpenLogin}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md transition-all min-h-[48px]"
            >
              <LogIn className="w-4 h-4" />
              <span>Log in with Student Account to Register</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRegister}
              disabled={loading || event.status === "cancelled" || event.status === "completed"}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold shadow-md transition-all min-h-[48px] disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {loading
                  ? "Securing Ticket..."
                  : event.status === "cancelled"
                  ? "Event Cancelled"
                  : event.status === "completed"
                  ? "Event Concluded"
                  : "Register for Free Ticket"}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
