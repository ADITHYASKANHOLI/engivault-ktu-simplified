import React from "react";
import type { Metadata } from "next";
import { spaceService } from "@/lib/space/service";
import { getAuthenticatedStudent } from "@/lib/space/permissions";
import { FoleSpaceLiveDesk } from "@/components/space/FoleSpaceLiveDesk";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "FOLE SPACE — Physical Collaborative Learning Space | FOLE CEV",
  description:
    "A student-led physical learning and maker space at College of Engineering Vadakara. Drop in to study, collaborate, and attend hands-on technical sessions.",
  openGraph: {
    title: "FOLE SPACE — Physical Learning Space | FOLE CEV",
    description:
      "A physical collaborative learning hub at College of Engineering Vadakara. Learn Together. Build Together. Grow Together.",
    images: [{ url: "/branding/fole-space-logo.png", width: 1024, height: 455, alt: "FOLE SPACE" }],
  },
};

export default async function FoleSpacePage() {
  const [status, student] = await Promise.all([
    spaceService.getPublicSpaceStatus().catch(() => null),
    getAuthenticatedStudent().catch(() => null),
  ]);

  let activeSession = null;
  if (student) {
    activeSession = await spaceService.getActiveSessionForUser(student.id).catch(() => null);
  }

  return (
    <div className="min-h-screen bg-surface-canvas text-on-surface font-body pt-20 pb-16 transition-colors">
      <FoleSpaceLiveDesk
        initialStatus={status}
        initialSession={activeSession}
        isAuthenticated={!!student}
        studentName={student?.display_name || student?.username}
      />
    </div>
  );
}
