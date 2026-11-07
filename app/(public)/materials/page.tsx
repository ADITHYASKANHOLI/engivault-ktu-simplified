import React, { Suspense } from "react";
import Link from "next/link";
import {
  FileText,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import {
  getPublishedMaterialsForCatalog,
  getAllDepartments,
  getAllSemesters,
  getPublishedSubjects,
  getAllModules,
} from "@/lib/queries";
import { MaterialsFilterView } from "@/components/materials/MaterialsFilterView";
import { MaterialsAsciiBackground } from "@/components/materials/MaterialsAsciiBackground";

export const metadata = {
  title: "Study Materials & Notes Catalogue — FOLE Web",
  description:
    "Explore, preview and download KTU syllabus notes, lecture slides, question banks, and reference documents.",
};

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  let materials: any[] = [];
  let departments: any[] = [];
  let semesters: any[] = [];
  let subjects: any[] = [];
  let modules: any[] = [];
  let fetchError: string | null = null;

  try {
    const [matsRes, deptsRes, semsRes, subsRes, modsRes] = await Promise.all([
      getPublishedMaterialsForCatalog(),
      getAllDepartments(),
      getAllSemesters(),
      getPublishedSubjects(),
      getAllModules(),
    ]);

    materials = matsRes;
    departments = deptsRes;
    semesters = semsRes;
    subjects = subsRes;
    modules = modsRes;
  } catch (err: any) {
    console.error("[MATERIALS CATALOGUE] Error loading published materials:", err);
    fetchError = err?.message || "Failed to retrieve study materials catalogue";
  }

  return (
    <div className="relative isolate min-h-screen bg-[#07111F] text-slate-100">
      <MaterialsAsciiBackground />
      <main className="page-content-relative flex-1 pt-24 sm:pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumb"
            className="mb-5 flex items-center gap-2 text-xs text-slate-400 font-medium"
          >
            <Link href="/" className="hover:text-emerald-400 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-white font-semibold">
              Study Materials
            </span>
          </nav>

          {/* Hero Section */}
          <div className="rounded-3xl bg-slate-900/60 backdrop-blur-md text-white p-6 sm:p-10 shadow-xl mb-8 border border-emerald-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 text-xs font-mono font-bold">
                <FileText className="w-3.5 h-3.5" />
                <span>KTU ACADEMIC STUDY VAULT</span>
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                Study Materials &amp; Notes
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                Download lecture notes, question banks, previous year exam papers, and syllabus presentations organized by department, subject, and module.
              </p>
            </div>
          </div>

        {/* Error Fallback or Filterable Catalog */}
        {fetchError ? (
          <div className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-red-200 dark:border-red-900/40 max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Catalogue temporarily unavailable
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              We encountered a temporary issue connecting to the study resources storage service. Please try reloading the page.
            </p>
            <div className="pt-2">
              <Link
                href="/materials"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-emerald-600 text-white text-xs font-bold transition-all min-h-[44px]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Loading</span>
              </Link>
            </div>
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="h-64 flex items-center justify-center text-sm text-slate-400">
                Loading study catalogue...
              </div>
            }
          >
            <MaterialsFilterView
              initialMaterials={materials}
              departments={departments}
              semesters={semesters}
              subjects={subjects}
              modules={modules}
            />
          </Suspense>
        )}
      </div>
    </main>
  </div>
  );
}
