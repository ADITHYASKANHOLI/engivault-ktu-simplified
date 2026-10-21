import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedStudent, isVerifiedOrganizer } from "@/lib/space/permissions";
import { SpaceEventForm } from "@/components/space/SpaceEventForm";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Create Event — FOLE SPACE",
  description: "Schedule a collaborative workshop or study jam at FOLE SPACE.",
};

export default async function NewSpaceEventPage() {
  const student = await getAuthenticatedStudent();
  if (!student) {
    redirect("/fole-space/organizer");
  }

  const isOrganizer = await isVerifiedOrganizer(student.id);
  if (!isOrganizer) {
    redirect("/fole-space/organizer");
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07111F] pt-24 pb-16 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <Link
            href="/fole-space/organizer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Organizer Hub</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Schedule a New Event
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Publish an engineering workshop, study jam, or maker build for the FOLE student community.
          </p>
        </div>

        <SpaceEventForm mode="create" />
      </div>
    </div>
  );
}
