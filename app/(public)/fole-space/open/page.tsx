import React from "react";
import type { Metadata } from "next";
import { spaceService } from "@/lib/space/service";
import { getAuthenticatedStudent } from "@/lib/space/permissions";
import { OpenSpaceClientHub } from "@/components/space/OpenSpaceClientHub";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Open Space Walk-in Hub — FOLE SPACE",
  description: "Live occupancy, seat availability, and study session check-in at FOLE SPACE.",
};

export default async function OpenSpacePage() {
  const [status, student] = await Promise.all([
    spaceService.getPublicSpaceStatus(),
    getAuthenticatedStudent(),
  ]);

  let activeSession = null;
  if (student) {
    activeSession = await spaceService.getActiveSessionForUser(student.id);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07111F] pt-24 pb-16 transition-colors">
      <OpenSpaceClientHub
        initialStatus={status}
        initialSession={activeSession}
        isAuthenticated={!!student}
        studentName={student?.display_name || student?.username}
      />
    </div>
  );
}
