import React from "react";
import type { Metadata } from "next";
import { getAdminStats, getActivityLogs, getAllSubjects } from "@/lib/queries";
import { CampusDeskAdminPortal } from "@/components/admin/CampusDeskAdminPortal";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Campus Desk Admin Portal — Academic Registrar & Vault Dispatch | FOLE CEV",
  description:
    "Operational administration console for scholar verification, curriculum vault ingestion, and real-time FOLE sanctum desk telemetry.",
};

export default async function AdminDashboardPage() {
  const [stats, activities, subjects] = await Promise.all([
    getAdminStats(),
    getActivityLogs().catch(() => []),
    getAllSubjects().catch(() => []),
  ]);

  return (
    <div className="-m-3.5 sm:-m-6 lg:-m-8">
      <CampusDeskAdminPortal
        stats={stats}
        subjects={subjects}
        recentActivities={activities}
      />
    </div>
  );
}
