import type { Metadata } from "next";
import { StudentLoginSessionsView } from "@/components/admin/StudentLoginSessionsView";

export const metadata: Metadata = {
  title: "Student Sessions — FOLE Admin",
  description: "Review student login history and session records.",
};

export const dynamic = "force-dynamic";

export default function StudentSessionsPage() {
  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <StudentLoginSessionsView />
    </div>
  );
}
