import React from "react";

export default function Loading() {
  return (
    <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
      <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-cyan-500 animate-spin" />
      <div className="text-xs font-mono text-slate-400 tracking-wider uppercase">
        Loading ENGIVAULT...
      </div>
    </div>
  );
}
