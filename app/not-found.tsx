import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Compass } from "lucide-react";
import { EngivaultLogo } from "@/components/branding/EngivaultLogo";

export default function NotFound() {
  return (
    <main className="flex-1 min-h-[65vh] flex items-center justify-center p-6 bg-[#F7F9FC]">
      <div className="text-center max-w-md space-y-6">
        <div className="flex justify-center">
          <EngivaultLogo size="md" />
        </div>
        <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto text-2xl font-mono font-bold">
          404
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900">Page Not Found</h1>
          <p className="text-xs text-slate-500">
            The KTU lecture, module, or study material you are searching for does not exist or has been moved.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return Home</span>
          </Link>
          <Link
            href="/subjects"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Browse Subjects</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
