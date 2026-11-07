import React from "react";
import { Wrench, Terminal, Users, Sparkles, Compass, CheckCircle2 } from "lucide-react";

interface BenefitItem {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const BENEFITS: BenefitItem[] = [
  {
    title: "Practical Experience",
    subtitle: "Tangible Implementation",
    description:
      "Move beyond slide decks and exam simulations. Build, test, and troubleshoot live code, hardware prototypes, and physical systems with immediate feedback.",
    icon: Wrench,
  },
  {
    title: "Technical Skills",
    subtitle: "Modern Toolchains",
    description:
      "Master contemporary developer workflows, Linux environments, version control, embedded microcontrollers, and modern full-stack web platforms used in industry.",
    icon: Terminal,
  },
  {
    title: "Cross-Branch Collaboration",
    subtitle: "Team Engineering",
    description:
      "Engineers rarely build alone. Collaborate across disciplines — combining software with electronics, mechanical design, and civil structures.",
    icon: Users,
  },
  {
    title: "Exposure to New Ideas",
    subtitle: "Broad Horizons",
    description:
      "Discover modern open-source initiatives, novel engineering architectures, and practical industry workflows through student and alumni-led sessions.",
    icon: Sparkles,
  },
  {
    title: "Learning Beyond Academics",
    subtitle: "Self-Driven Mastery",
    description:
      "Cultivate the independence, problem-solving persistence, and creative confidence that transforms syllabus knowledge into authentic engineering capability.",
    icon: Compass,
  },
];

export function FoleWorksWhyParticipate() {
  return (
    <section className="py-16 sm:py-24 bg-slate-50 dark:bg-[#060c18] border-b border-slate-200 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column: Context & Summary */}
          <div className="lg:col-span-5 sticky top-28">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-950/60 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase mb-3">
              <span>Why Participate?</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Transforming Engineering Education into Action
            </h2>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Academic syllabi provide theoretical foundations, but true engineering confidence comes from hands-on creation, debugging under pressure, and shipping working prototypes.
            </p>

            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>100% Free &amp; Open to all CEV students</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Peer mentorship from senior students &amp; alumni</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Verified participation &amp; open-source contributions</span>
              </div>
            </div>
          </div>

          {/* Right Column: 5 Benefit Cards */}
          <div className="lg:col-span-7 space-y-4">
            {BENEFITS.map((b, idx) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="rounded-2xl p-5 sm:p-6 bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-300 flex items-start gap-4"
                >
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/60 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        {b.title}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                        0{idx + 1}
                      </span>
                    </div>
                    <div className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5">
                      {b.subtitle}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {b.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
