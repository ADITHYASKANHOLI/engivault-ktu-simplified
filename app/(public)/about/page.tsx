import React from "react";
import Link from "next/link";
import { BookOpen, CheckCircle, ArrowRight, ShieldCheck, Award, Heart } from "lucide-react";
import { getSiteSettings } from "@/lib/queries";

export const metadata = {
  title: "About — ENGIVAULT",
  description: "Learn about ENGIVAULT's academic mission to simplify KTU engineering subjects with high quality video lectures and revision materials.",
};

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <main className="flex-1 pt-32 pb-24 bg-[#F7F9FC]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-mono font-semibold">
            <span>OUR MISSION</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            KTU Learning. <span className="text-cyan-600">Simplified.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {settings.about_text || "ENGIVAULT was built by engineering educators to bridge the gap between heavy university syllabi and student exam success."}
          </p>
        </div>

        {/* Narrative Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-sm space-y-6 text-slate-700 leading-relaxed text-sm sm:text-base">
          <h2 className="text-2xl font-bold text-slate-900">Why ENGIVAULT was built</h2>
          <p>
            The APJ Abdul Kalam Technological University (KTU) curriculum is rigorous and conceptually demanding. First-year and branch-specific core subjects such as Engineering Mathematics, Engineering Graphics, and Electrical Engineering often present students with tight semester schedules, rapid lecture pacing, and challenging question patterns.
          </p>
          <p>
            ENGIVAULT organizes the entire KTU syllabus into systematic, module-by-module learning paths. Every single topic is taught from foundational principles right up to university exam questions, accompanied by clean handwritten formula sheets and verified question banks.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-900 text-sm">2019 & 2024 Scheme Focused</div>
                <div className="text-xs text-slate-500 mt-0.5">Updated precisely according to current university schemes.</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-900 text-sm">Exam Numerical Problem Walks</div>
                <div className="text-xs text-slate-500 mt-0.5">Step-by-step solutions to university question papers.</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-4">
          <Link
            href="/subjects"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 transition-colors shadow-md"
          >
            <span>Explore KTU Curriculum</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
