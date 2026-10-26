import React from "react";
import type { Metadata } from "next";
import { getPublishedSubjects } from "@/lib/queries";
import { CurriculumVaultView } from "@/components/curriculum/CurriculumVaultView";

export const metadata: Metadata = {
  title: "Open Engineering Codex & Syllabi — FOLE Curriculum Vault",
  description:
    "Human-curated lecture indices, handwritten KTU professor compendiums, verified exam question vaults, and module-wise video recordings organized under open scholarly governance.",
};

export const dynamic = "force-dynamic";

export default async function SubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; semester?: string }>;
}) {
  const { q } = (await searchParams) || {};
  const subjects = await getPublishedSubjects();

  return (
    <main className="flex-1 pt-16 bg-surface-canvas min-h-screen">
      <CurriculumVaultView
        initialSubjects={subjects}
        initialQuery={q || ""}
      />
    </main>
  );
}
