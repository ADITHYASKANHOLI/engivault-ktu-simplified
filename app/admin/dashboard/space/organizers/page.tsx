import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { spaceService } from "@/lib/space/service";
import { AdminOrganizersManager } from "@/components/admin/space/AdminOrganizersManager";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Verified Organizers — ENGIVAULT Admin",
  description: "Authorize student organizers to create events and operate check-in desks.",
};

export default async function AdminSpaceOrganizersPage() {
  const organizers = await spaceService.getAllOrganizers();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/dashboard/space"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Space Overview</span>
        </Link>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Verified Event Organizers
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage students granted permission to create workshops and manage attendance desks at FOLE SPACE.
        </p>
      </div>

      <AdminOrganizersManager initialOrganizers={organizers} />
    </div>
  );
}
