import React from "react";
import { notFound } from "next/navigation";
import { getWorksActivityById } from "@/lib/queries";
import { WorksActivityForm } from "@/components/works/WorksActivityForm";

export const dynamic = "force-dynamic";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminWorksEditPage({ params }: EditPageProps) {
  const { id } = await params;
  const activity = await getWorksActivityById(id);

  if (!activity) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <WorksActivityForm initialData={activity} isEdit activityId={id} />
    </div>
  );
}
