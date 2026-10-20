import React from "react";

export default function MaterialsLoading() {
  return (
    <main className="flex-1 pt-24 sm:pt-28 pb-20 bg-[#F7F9FC] dark:bg-slate-950 min-h-screen bg-tech-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Skeleton */}
        <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-6" />

        {/* Hero Banner Skeleton */}
        <div className="rounded-3xl bg-[#07111F] p-6 sm:p-10 mb-8 sm:mb-10 animate-pulse border border-slate-800">
          <div className="h-6 w-48 bg-emerald-950/60 rounded-full mb-4" />
          <div className="h-10 w-3/4 max-w-lg bg-slate-800 rounded-xl mb-3" />
          <div className="h-4 w-2/3 max-w-md bg-slate-800/80 rounded" />
        </div>

        {/* Filter Bar Skeleton */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 mb-8 animate-pulse space-y-4">
          <div className="h-11 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-11 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Material Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                <div className="h-4 w-12 bg-slate-100 dark:bg-slate-800 rounded" />
              </div>
              <div className="h-6 w-3/4 bg-slate-100 dark:bg-slate-800 rounded-lg" />
              <div className="h-4 w-full bg-slate-50 dark:bg-slate-800/50 rounded" />
              <div className="h-4 w-1/2 bg-slate-50 dark:bg-slate-800/50 rounded" />
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
                <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
