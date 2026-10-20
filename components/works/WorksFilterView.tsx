"use client";

import React, { useState, useMemo } from "react";
import { Search, RotateCcw, Calendar } from "lucide-react";
import { WorksActivity } from "@/types";
import { WorksActivityCard } from "./WorksActivityCard";
import { cn } from "@/lib/utils";

interface WorksFilterViewProps {
  initialActivities: WorksActivity[];
}

const CATEGORIES = [
  "All",
  "Workshop",
  "Internship",
  "Technical Training",
  "Collaborative Project",
  "Hackathon / Contest",
];

const MODES = [
  { id: "all", label: "All Formats" },
  { id: "in_person", label: "In-Person" },
  { id: "online", label: "Online" },
  { id: "hybrid", label: "Hybrid" },
];

export function WorksFilterView({ initialActivities }: WorksFilterViewProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedMode, setSelectedMode] = useState("all");

  const filtered = useMemo(() => {
    return initialActivities.filter((act) => {
      // Category filter
      if (selectedCategory !== "All" && act.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Delivery mode filter
      if (selectedMode !== "all" && act.delivery_mode !== selectedMode) {
        return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesTitle = act.title.toLowerCase().includes(q);
        const matchesDesc = (act.short_description || "").toLowerCase().includes(q) || act.description.toLowerCase().includes(q);
        const matchesVenue = (act.venue || "").toLowerCase().includes(q);
        const matchesCategory = act.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesVenue && !matchesCategory) {
          return false;
        }
      }

      return true;
    });
  }, [initialActivities, search, selectedCategory, selectedMode]);

  const hasActiveFilters = search.trim() !== "" || selectedCategory !== "All" || selectedMode !== "all";

  const handleReset = () => {
    setSearch("");
    setSelectedCategory("All");
    setSelectedMode("all");
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Header */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workshops, internships, robotics projects, topics..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all min-h-[48px]"
          />
        </div>

        {/* Category Pills & Format Filter */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-1">
          {/* Categories */}
          <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto pb-1 sm:pb-0 w-full md:w-auto">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[38px] shrink-0",
                    active
                      ? "bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs font-bold"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Delivery Mode & Reset Controls */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 w-full sm:w-auto justify-between sm:justify-end">
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[40px]"
              aria-label="Filter by delivery format"
            >
              {MODES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 min-h-[40px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Counter Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <span>
            Showing <strong className="text-slate-900 dark:text-white font-bold">{filtered.length}</strong> of{" "}
            {initialActivities.length} published activities
          </span>
          {selectedCategory !== "All" && (
            <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
              Filtered by: {selectedCategory}
            </span>
          )}
        </div>
      </div>

      {/* Activities Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filtered.map((activity) => (
            <WorksActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center mb-4">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            No activities match your filters
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            {hasActiveFilters
              ? "Try adjusting your search keywords, switching categories, or clearing selected filters."
              : "There are currently no active public activities. Check back soon for upcoming FOLE CEV workshops and project calls."}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors shadow-xs min-h-[44px]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
