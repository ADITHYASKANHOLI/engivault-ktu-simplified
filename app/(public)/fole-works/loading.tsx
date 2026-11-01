import React from "react";

export default function FoleWorksLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07111F] text-slate-900 dark:text-slate-100 pt-28 pb-16 sm:pt-36 sm:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Hero Skeleton */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-6 w-48 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-10 w-72 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-16 w-full rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>

        {/* Filter Bar Skeleton */}
        <div className="h-28 w-full rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />

        {/* Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800/80 animate-pulse border border-slate-300/40 dark:border-slate-800"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
