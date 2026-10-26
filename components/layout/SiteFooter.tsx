import React from "react";
import Link from "next/link";
import { ShieldCheck, Sparkles } from "lucide-react";
import { getPublishedSubjects } from "@/lib/queries";
import type { Subject } from "@/types";

export async function SiteFooter() {
  const [subjectsResult] = await Promise.allSettled([
    getPublishedSubjects(),
  ]);

  const subjects: Subject[] =
    subjectsResult.status === "fulfilled" ? subjectsResult.value : [];

  return (
    <footer className="w-full border-t border-border-subtle bg-surface-warm text-on-surface-variant mt-space-2xl">
      {/* Upper Collegiate Archival Band */}
      <div className="max-w-7xl mx-auto px-gutter py-space-xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-space-lg pb-space-lg border-b border-border-subtle">
          {/* Brand & Editorial Charter Summary */}
          <div className="md:col-span-5 space-y-space-xs">
            <div className="flex items-center gap-space-sm">
              <span className="font-headline-sm text-headline-sm text-primary font-bold tracking-tight">FOLE</span>
              <span className="font-label-caps text-label-caps text-outline">OPEN LEARNING CHARTER</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md leading-relaxed">
              An unhurried, humanistic learning collective grounded in open archival research, student agency, and accessible scholarly inquiry. APJ Abdul Kalam Technological University (Kerala) digital repository.
            </p>
            <div className="pt-space-xs flex items-center gap-space-md font-code-tabular text-xs text-outline">
              <span>PROTOCOL: FOLE-KTU-OPEN-ACAD</span>
              <span>•</span>
              <span>SCHEME: 2019/2024</span>
            </div>
          </div>

          {/* Quick Curricular Subject Vault Links */}
          <div className="md:col-span-4 space-y-space-xs">
            <span className="font-code-tabular text-label-caps text-secondary font-bold uppercase tracking-wider block">
              CURATED KTU REPOSITORIES
            </span>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-space-md gap-y-1.5 font-code-tabular text-xs">
              {subjects.slice(0, 6).map((sub) => (
                <li key={sub.id}>
                  <Link
                    href={`/subjects/${sub.slug}`}
                    className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5 group"
                  >
                    <span className="text-secondary font-semibold">{sub.code || "KTU"}</span>
                    <span className="truncate">{sub.title}</span>
                  </Link>
                </li>
              ))}
              {subjects.length === 0 && (
                <li className="text-outline">CST201, MAT203, CST206, EST110...</li>
              )}
            </ul>
          </div>

          {/* Platform Protocols & Admin Access */}
          <div className="md:col-span-3 space-y-space-xs">
            <span className="font-code-tabular text-label-caps text-secondary font-bold uppercase tracking-wider block">
              COMMONS NODES
            </span>
            <ul className="space-y-1.5 font-code-tabular text-xs text-on-surface-variant">
              <li>
                <Link href="/subjects" className="hover:text-primary transition-colors">
                  Archival Codex & Syllabi
                </Link>
              </li>
              <li>
                <Link href="/fole-space" className="hover:text-primary transition-colors">
                  FOLE Space Live Desk & Floor
                </Link>
              </li>
              <li>
                <Link href="/fole-works" className="hover:text-primary transition-colors">
                  Works, Events & Workshops
                </Link>
              </li>
              <li>
                <Link href="/materials" className="hover:text-primary transition-colors">
                  Pedagogical Study Dossiers
                </Link>
              </li>
              <li>
                <Link
                  href="/liquid-glass"
                  className="hover:text-primary text-secondary font-semibold transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-secondary" />
                  <span>Liquid Glass Optical Demo</span>
                </Link>
              </li>
              <li className="pt-1">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-1 text-primary hover:text-secondary font-semibold transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Campus Desk Registrar Access</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Lower Legal & Licensing Bar */}
        <div className="pt-space-md flex flex-col sm:flex-row items-center justify-between gap-space-md text-center sm:text-left">
          <div className="font-label-caps text-label-caps text-outline">
            © 2025 FOLE INITIATIVE. CC-BY-NC 4.0 SCHOLARLY LICENSE
          </div>
          <div className="flex flex-wrap items-center justify-center gap-space-lg font-code-tabular text-code-tabular text-on-surface-variant">
            <Link href="/subjects" className="hover:text-primary transition-colors">Archival Codex</Link>
            <Link href="/subjects" className="hover:text-primary transition-colors">Public Syllabi</Link>
            <Link href="/fole-space" className="hover:text-primary transition-colors">Campus Protocols</Link>
            <Link href="/fole-works" className="hover:text-primary transition-colors">Decentralized Nodes</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
