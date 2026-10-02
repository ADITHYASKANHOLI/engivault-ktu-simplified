import React from "react";
import Link from "next/link";
import { Compass, BookOpen, ShieldCheck, Globe, Share2, Send, Mail } from "lucide-react";
import { getPublishedSubjects, getSiteSettings } from "@/lib/queries";
import { EngivaultLogo } from "@/components/branding/EngivaultLogo";

export async function SiteFooter() {
  const subjects = await getPublishedSubjects();
  const settings = await getSiteSettings();

  return (
    <footer className="bg-[#07111F] text-slate-300 relative overflow-hidden border-t border-cyan-900/30">
      {/* Background subtle technical grid */}
      <div className="absolute inset-0 bg-tech-grid-dark opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Col 1: Brand & Tagline */}
          <div className="space-y-4 md:col-span-1">
            <div>
              <EngivaultLogo variant="full" size="md" />
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {settings.tagline || "KTU Learning. Simplified."} Authentic video lectures, module breakdowns, and exam question notes built for Kerala Technological University engineers.
            </p>
            <div className="pt-2 flex items-center gap-3 text-slate-400">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-900/80 hover:text-cyan-400 hover:bg-slate-800 transition-colors" aria-label="GitHub">
                <Globe className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-900/80 hover:text-cyan-400 hover:bg-slate-800 transition-colors" aria-label="LinkedIn">
                <Share2 className="w-4 h-4" />
              </a>
              <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-900/80 hover:text-cyan-400 hover:bg-slate-800 transition-colors" aria-label="Telegram">
                <Send className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Core KTU Subjects */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-4 font-mono">
              Core KTU Subjects
            </h3>
            <ul className="space-y-2.5 text-sm">
              {subjects.slice(0, 5).map((subject) => (
                <li key={subject.id}>
                  <Link
                    href={`/subjects/${subject.slug}`}
                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/60 group-hover:bg-cyan-400 transition-colors" />
                    <span>{subject.title}</span>
                  </Link>
                </li>
              ))}
              {subjects.length === 0 && (
                <li className="text-slate-500 text-xs">Curriculum syncing...</li>
              )}
            </ul>
          </div>

          {/* Col 3: Curriculum & Quick Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-4 font-mono">
              Platform & Syllabus
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link href="/subjects" className="hover:text-white transition-colors">
                  Subject Catalog
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About KTU Simplified
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact & Support
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="text-cyan-400/80 hover:text-cyan-300 font-medium flex items-center gap-1.5 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Access Portal</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & University Mission */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-4 font-mono">
              Academic Mission
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Dedicated to helping KTU engineering students master core university modules with clarity, precision, and confidence.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 border border-slate-800 p-2.5 rounded-lg">
              <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="truncate">{settings.contact_email || "contact@engivault.edu"}</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright & attribution */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            {settings.footer_text || "© 2026 ENGIVAULT. All rights reserved."}
          </div>
          <div className="flex items-center gap-6 font-mono text-[11px]">
            <span>Designed for KTU Engineering</span>
            <span>•</span>
            <span>Vercel + Supabase</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
