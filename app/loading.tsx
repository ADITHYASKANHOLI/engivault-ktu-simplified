import React from "react";
import { EngivaultLogo } from "@/components/branding/EngivaultLogo";

export default function Loading() {
  return (
    <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
      <EngivaultLogo variant="full" size="sm" priority />
      <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-cyan-500 animate-spin mt-2" />
      <div className="text-xs font-mono text-slate-400 tracking-wider uppercase">
        Loading KTU Repository...
      </div>
    </div>
  );
}
