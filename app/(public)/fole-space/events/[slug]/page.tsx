import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { spaceService } from "@/lib/space/service";
import { getAuthenticatedStudent } from "@/lib/space/permissions";
import { generateQrSvg, generateQrDataUrl, encodeTicketPayload } from "@/lib/space/tickets";
import { formatDateTimeIST } from "@/lib/space/time";
import { FlyerDisplay } from "@/components/space/FlyerDisplay";
import { EventDetailActions } from "@/components/space/EventDetailActions";
import {
  Calendar,
  Users,
  MapPin,
  ArrowLeft,
  ShieldCheck,
  DoorOpen,
  Clock,
  Award,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface EventDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await spaceService.getEventBySlug(slug, false);

  if (!event || event.deleted_at) {
    return { title: "Event Not Found — FOLE SPACE" };
  }

  const flyerProxyUrl = `/api/space/events/${event.slug}/flyer`;

  return {
    title: `${event.title} — FOLE SPACE`,
    description: event.description || "Join this collaborative engineering session at FOLE SPACE.",
    openGraph: {
      title: `${event.title} | FOLE SPACE CEV`,
      description: event.description || "Join this collaborative engineering session at FOLE SPACE.",
      images: event.flyer_path
        ? [{ url: flyerProxyUrl, width: event.flyer_width || 1200, height: event.flyer_height || 630, alt: event.title }]
        : [{ url: "/branding/fole-space-logo.png", width: 1024, height: 455, alt: "FOLE SPACE" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${event.title} | FOLE SPACE`,
      description: event.description || "Join this collaborative engineering session at FOLE SPACE.",
      images: event.flyer_path ? [flyerProxyUrl] : ["/branding/fole-space-logo.png"],
    },
  };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const event = await spaceService.getEventBySlug(slug, false);

  if (!event || event.deleted_at) {
    notFound();
  }

  const student = await getAuthenticatedStudent();

  let registration = null;
  let qrSvg: string | undefined = undefined;
  let qrDataUrl: string | undefined = undefined;

  if (student) {
    registration = await spaceService.getRegistration(event.id, student.id);
    if (registration && registration.ticket_code && registration.status === "registered") {
      const payload = encodeTicketPayload(registration.ticket_code);
      qrSvg = await generateQrSvg(payload);
      qrDataUrl = await generateQrDataUrl(payload);
    }
  }

  const flyerProxyUrl = event.flyer_path ? `/api/space/events/${event.slug}/flyer` : "";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07111F] pt-24 pb-16 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb / Navigation Bar with Routes Back to Calendar & Open Space Hub */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 text-xs font-bold">
            <Link
              href="/fole-space/events"
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>All Events</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Link
              href="/fole-space/calendar"
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Event Calendar</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Link
              href="/fole-space/open"
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
            >
              <DoorOpen className="w-3.5 h-3.5" />
              <span>Open Space Hub</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ref: {event.id.slice(0, 8)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Natural-Ratio Flyer and Session Specs */}
          <div className="lg:col-span-7 space-y-6">
            {flyerProxyUrl ? (
              <FlyerDisplay
                src={flyerProxyUrl}
                alt={event.title}
                width={event.flyer_width}
                height={event.flyer_height}
                priority
              />
            ) : null}

            {/* Session Specs Card */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Session Logistics & Requirements
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <Calendar className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-500 block">Date & Time (IST)</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {formatDateTimeIST(event.starts_at)} – {new Date(event.ends_at).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-500 block">Venue & Mode</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {event.blocks_open_space ? "FOLE SPACE Main Hub (Physical Room, Ground Floor)" : "FOLE SPACE Studio / Virtual Session"}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <Users className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-500 block">Capacity & Available Seats</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {event.capacity} Total Seats
                      {typeof event.seats_remaining === "number" && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1">
                          ({event.seats_remaining} seats remaining)
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-500 block">Host & Mentorship</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {event.organizer?.display_name || event.organizer_name || "Verified Organizer"}{" "}
                      <span className="text-slate-400">(@{event.organizer?.username || event.organizer_username || "organizer"})</span>
                    </span>
                  </div>
                </div>

                {event.registration_closes_at && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 sm:col-span-2">
                    <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-500 block">Registration Deadline</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {formatDateTimeIST(event.registration_closes_at)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 sm:col-span-2">
                  <Award className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-500 block">Eligibility & Entry Rules</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      Open to all enrolled students with active FOLE accounts. Entry requires scanning your personalized digital QR ticket or checking in via the verified organizer desk.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Description, and Interactive Ticket/Pass Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  {event.category}
                </span>

                {event.status === "live" && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>SESSION LIVE</span>
                  </span>
                )}

                {event.status === "completed" && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                    <span>CONCLUDED</span>
                  </span>
                )}

                {event.status === "cancelled" && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-100 dark:bg-rose-950/70 px-2.5 py-0.5 rounded-full">
                    <span>CANCELLED</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
                {event.title}
              </h1>

              <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3 mb-8 whitespace-pre-line">
                {event.description}
              </div>

              {/* Action Component */}
              <EventDetailActions
                event={event}
                isAuthenticated={!!student}
                registration={registration}
                qrSvg={qrSvg}
                qrDataUrl={qrDataUrl}
                studentName={student?.display_name || student?.username}
                studentUsername={student?.username}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
