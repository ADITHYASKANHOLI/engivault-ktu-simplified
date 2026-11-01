import React from "react";
import { Metadata } from "next";
import { StudentsManagementView } from "@/components/admin/StudentsManagementView";

export const metadata: Metadata = {
  title: "Student Accounts — ENGIVAULT Admin Control",
  description: "Directory of registered student members and administrative account controls.",
};

export const dynamic = "force-dynamic";

export default function AdminStudentsPage() {
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <StudentsManagementView />
    </div>
  );
}
