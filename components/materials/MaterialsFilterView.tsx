"use client";

import React, { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  X,
  RotateCcw,
  FileText,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { Material, Subject, Department, Semester, Module } from "@/types";
import { CatalogMaterialCard } from "@/components/materials/CatalogMaterialCard";

interface MaterialsFilterViewProps {
  initialMaterials: Material[];
  subjects: Subject[];
  departments: Department[];
  semesters: Semester[];
  modules: Module[];
}

export function MaterialsFilterView({
  initialMaterials,
  subjects,
  departments,
  semesters,
  modules,
}: MaterialsFilterViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Controlled filter state initialized from URL query params
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedDept, setSelectedDept] = useState(searchParams.get("dept") || "");
  const [selectedSem, setSelectedSem] = useState(searchParams.get("sem") || "");
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get("subject") || "");
  const [selectedModule, setSelectedModule] = useState(searchParams.get("module") || "");
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Available modules based on selected subject
  const availableModules = useMemo(() => {
    if (!selectedSubject) return modules;
    const sub = subjects.find(
      (s) => s.id === selectedSubject || s.slug === selectedSubject
    );
    if (!sub) return modules;
    return modules.filter((m) => m.subject_id === sub.id);
  }, [selectedSubject, modules, subjects]);

  // Sync state to URL without full page reload
  const updateUrl = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.replace(`/materials?${params.toString()}`, { scroll: false });
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    updateUrl({ q: val });
  };

  const handleDeptChange = (val: string) => {
    setSelectedDept(val);
    updateUrl({ dept: val });
  };

  const handleSemChange = (val: string) => {
    setSelectedSem(val);
    updateUrl({ sem: val });
  };

  const handleSubjectChange = (val: string) => {
    setSelectedSubject(val);
    setSelectedModule(""); // reset module when subject changes
    updateUrl({ subject: val, module: "" });
  };

  const handleModuleChange = (val: string) => {
    setSelectedModule(val);
    updateUrl({ module: val });
  };

  const handleTypeChange = (val: string) => {
    setSelectedType(val);
    updateUrl({ type: val });
  };

  const resetAllFilters = () => {
    setSearchQuery("");
    setSelectedDept("");
    setSelectedSem("");
    setSelectedSubject("");
    setSelectedModule("");
    setSelectedType("");
    router.replace("/materials", { scroll: false });
  };

  const hasActiveFilters = Boolean(
    searchQuery || selectedDept || selectedSem || selectedSubject || selectedModule || selectedType
  );

  const activeFilterCount = [
    Boolean(searchQuery),
    Boolean(selectedDept),
    Boolean(selectedSem),
    Boolean(selectedSubject),
    Boolean(selectedModule),
    Boolean(selectedType),
  ].filter(Boolean).length;

  // Filter materials client-side for instantaneous feedback
  const filteredMaterials = useMemo(() => {
    return initialMaterials.filter((mat) => {
      // Search query (title, description, original_filename, subject, module)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = mat.title.toLowerCase().includes(q);
        const descMatch = (mat.description || "").toLowerCase().includes(q);
        const fileMatch = (mat.original_filename || "").toLowerCase().includes(q);
        const subMatch =
          (mat.subject?.title || "").toLowerCase().includes(q) ||
          (mat.subject?.code || "").toLowerCase().includes(q);
        const modMatch = (mat.module?.title || "").toLowerCase().includes(q);

        if (!titleMatch && !descMatch && !fileMatch && !subMatch && !modMatch) {
          return false;
        }
      }

      // Department filter
      if (selectedDept) {
        const sub = mat.subject;
        if (sub && sub.department_id) {
          const deptObj = departments.find(
            (d) => d.id === selectedDept || d.slug === selectedDept
          );
          if (deptObj && sub.department_id !== deptObj.id) {
            return false;
          }
        }
      }

      // Semester filter
      if (selectedSem) {
        const sub = mat.subject;
        if (sub) {
          const semNum = parseInt(selectedSem, 10);
          if (!isNaN(semNum) && sub.semester_number && sub.semester_number !== semNum) {
            return false;
          }
        }
      }

      // Subject filter
      if (selectedSubject) {
        const sub = mat.subject;
        const matchesSubject =
          mat.subject_id === selectedSubject ||
          sub?.id === selectedSubject ||
          sub?.slug === selectedSubject;
        if (!matchesSubject) {
          return false;
        }
      }

      // Module filter
      if (selectedModule) {
        const mod = mat.module;
        const matchesModule =
          mat.module_id === selectedModule ||
          mod?.id === selectedModule ||
          mod?.slug === selectedModule;
        if (!matchesModule) {
          return false;
        }
      }

      // Material Type filter
      if (selectedType) {
        const combined = `${mat.material_type || ""} ${mat.mime_type || ""}`.toLowerCase();
        if (selectedType === "question_bank") {
          if (!combined.includes("question") && !combined.includes("pyq") && !combined.includes("exam")) {
            return false;
          }
        } else if (selectedType === "notes" || selectedType === "pdf") {
          if (!combined.includes("notes") && !combined.includes("pdf")) {
            return false;
          }
        } else if (selectedType === "presentation") {
          if (!combined.includes("presentation") && !combined.includes("ppt")) {
            return false;
          }
        } else if (selectedType === "archive") {
          if (!combined.includes("zip") && !combined.includes("archive") && !combined.includes("rar")) {
            return false;
          }
        }
      }

      return true;
    });
  }, [
    initialMaterials,
    searchQuery,
    selectedDept,
    selectedSem,
    selectedSubject,
    selectedModule,
    selectedType,
    departments,
  ]);

  return (
    <div className="space-y-6">
      {/* Search and Mobile Filter Toggle */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by title, subject, module or filename (e.g. Module 1, Question Bank)..."
              className="w-full pl-10 pr-9 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all min-h-[44px]"
              aria-label="Search study materials"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
                aria-label="Clear search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className="sm:hidden flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 min-h-[44px] transition-colors"
            aria-expanded={isFilterPanelOpen}
            aria-controls="materials-filter-panel"
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
            <span>Filter Criteria</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isFilterPanelOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Filter Select Controls (always visible on sm+, collapsible on mobile) */}
        <div
          id="materials-filter-panel"
          className={`${
            isFilterPanelOpen ? "block" : "hidden sm:block"
          } pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3.5`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {/* 1. Department */}
            <div>
              <label
                htmlFor="filter-dept"
                className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1"
              >
                Discipline / Dept
              </label>
              <select
                id="filter-dept"
                value={selectedDept}
                onChange={(e) => handleDeptChange(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Disciplines</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.slug || d.id}>
                    {d.code ? `${d.code} — ` : ""}
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Semester */}
            <div>
              <label
                htmlFor="filter-sem"
                className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1"
              >
                Semester
              </label>
              <select
                id="filter-sem"
                value={selectedSem}
                onChange={(e) => handleSemChange(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Semesters</option>
                {semesters.map((s) => {
                  const num = s.number || s.semester_number || 1;
                  return (
                    <option key={s.id} value={String(num)}>
                      Semester {num}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 3. Subject */}
            <div>
              <label
                htmlFor="filter-subject"
                className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1"
              >
                Subject
              </label>
              <select
                id="filter-subject"
                value={selectedSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 truncate"
              >
                <option value="">All Subjects</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.slug || sub.id}>
                    {sub.code ? `${sub.code}: ` : ""}
                    {sub.title}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Module */}
            <div>
              <label
                htmlFor="filter-module"
                className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1"
              >
                Module / Unit
              </label>
              <select
                id="filter-module"
                value={selectedModule}
                onChange={(e) => handleModuleChange(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 truncate"
              >
                <option value="">All Modules</option>
                {availableModules.map((m) => (
                  <option key={m.id} value={m.slug || m.id}>
                    {m.display_order ? `Mod ${m.display_order}: ` : ""}
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Material Type */}
            <div>
              <label
                htmlFor="filter-type"
                className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1"
              >
                Resource Type
              </label>
              <select
                id="filter-type"
                value={selectedType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Resource Types</option>
                <option value="notes">Notes / PDF</option>
                <option value="question_bank">Question Bank & PYQ</option>
                <option value="presentation">Lecture Slides (PPT)</option>
                <option value="archive">Archives & Code (ZIP)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Bar: Matches and Reset */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="font-medium text-slate-600 dark:text-slate-300">
            Showing{" "}
            <strong className="text-slate-900 dark:text-white font-bold">
              {filteredMaterials.length}
            </strong>{" "}
            {filteredMaterials.length === 1 ? "study material" : "study materials"}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors p-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Materials List / Cards / Empty State */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            No study materials found
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {hasActiveFilters
              ? "No published study materials matched your active search query or filter selection. Try adjusting your parameters or clear all filters."
              : "No study materials are currently published in the catalogue. Please check back shortly as faculty upload new resources."}
          </p>
          {hasActiveFilters && (
            <div className="pt-2">
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold transition-all min-h-[44px]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Clear All Filters</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredMaterials.map((material) => (
            <CatalogMaterialCard key={material.id} material={material} />
          ))}
        </div>
      )}
    </div>
  );
}
