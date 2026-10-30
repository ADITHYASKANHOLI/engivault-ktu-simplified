import React from "react";
import { WorksActivityForm } from "@/components/works/WorksActivityForm";

export const dynamic = "force-dynamic";

export default function AdminWorksCreatePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <WorksActivityForm />
    </div>
  );
}
