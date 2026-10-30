import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { getPublishedSubjects } from "@/lib/queries";
import type { Subject } from "@/types";

export async function SiteFooter() {
  const [subjectsResult] = await Promise.allSettled([
    getPublishedSubjects(),
  ]);

  const subjects: Subject[] =
    subjectsResult.status === "fulfilled" ? subjectsResult.value : [];

  return (
    <footer className="w-full border-t border-slate-200 bg-[#f7f6ef] text-slate-700 mt-16">
      {/* Upper Collegiate Archival Band */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10 pb-10 border-b border-slate-200">
          {/* Brand & Editorial Charter Summary */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl text-emerald-900 font-bold tracking-tight">FOLE</span>
              <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">FREE OPEN LEARNING & EDUCATION</span>
            </div>
            <p className="text-sm text-slate-600 max-w-md leading-relaxed">
              A student-led learning community making KTU study resources, campus activities, and shared opportunities easier to access.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-slate-500">
              <span>FOLE · CEV</span>
              <span>•</span>
              <span>SCHEME: 2019/2024</span>
            </div>
          </div>

          {/* Quick Curricular Subject Vault Links */}
          <div className="md:col-span-4 space-y-3">
            <span className="font-mono text-[10px] text-emerald-700 font-bold uppercase tracking-[0.16em] block">
              STUDY RESOURCES
            </span>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2 font-mono text-xs">
                {subjects.slice(0, 6).map((sub) => (
                  <li key={sub.id}>
                    <Link
                      href={`/subjects/${sub.slug}`}
                      className="text-slate-600 hover:text-emerald-700 transition-colors flex items-center gap-1.5 group min-w-0"
                    >
                      <span className="text-emerald-700 font-semibold shrink-0">{sub.code || "KTU"}</span>
                      <span className="truncate">{sub.title}</span>
                    </Link>
                  </li>
                ))}
              {subjects.length === 0 && (
                <li className="text-slate-500">CST201, MAT203, CST206, EST110...</li>
              )}
            </ul>
          </div>

          {/* Platform Protocols & Admin Access */}
          <div className="md:col-span-3 space-y-3">
            <span className="font-mono text-[10px] text-emerald-700 font-bold uppercase tracking-[0.16em] block">
              EXPLORE FOLE
            </span>
            <ul className="space-y-2 font-mono text-xs text-slate-600">
              <li>
                <Link href="/subjects" className="hover:text-emerald-700 transition-colors">
                  Subjects & syllabus
                </Link>
              </li>
              <li>
                <Link href="/fole-space" className="hover:text-emerald-700 transition-colors">
                  FOLE SPACE
                </Link>
              </li>
              <li>
                <Link href="/fole-works" className="hover:text-emerald-700 transition-colors">
                  FOLE WORKS
                </Link>
              </li>
              <li>
                <Link href="/materials" className="hover:text-emerald-700 transition-colors">
                  Study materials
                </Link>
              </li>
              <li className="pt-1">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-600 font-semibold transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Campus Desk Registrar Access</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Lower Legal & Licensing Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">
            © 2026 FOLE INITIATIVE. CC-BY-NC 4.0 SCHOLARLY LICENSE
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[11px] text-slate-600">
            <Link href="/subjects" className="hover:text-emerald-700 transition-colors">Subjects</Link>
            <Link href="/subjects" className="hover:text-emerald-700 transition-colors">Syllabus</Link>
            <Link href="/fole-space" className="hover:text-emerald-700 transition-colors">FOLE SPACE</Link>
            <Link href="/fole-works" className="hover:text-emerald-700 transition-colors">FOLE WORKS</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
