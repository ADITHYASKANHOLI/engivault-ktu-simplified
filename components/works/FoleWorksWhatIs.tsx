import React from "react";
import { Terminal, Cpu, Briefcase, Trophy, GitBranch, Lightbulb, ArrowRight } from "lucide-react";

interface InitiativeBlock {
  title: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const INITIATIVES: InitiativeBlock[] = [
  {
    title: "Workshops",
    badge: "Hands-on Practice",
    description:
      "Interactive sessions on robotics, IoT, PCB design, cloud architectures, and modern software development where students build, debug, and test actual systems.",
    icon: Terminal,
    accentColor: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/30",
  },
  {
    title: "Technical Training",
    badge: "Skill Acceleration",
    description:
      "Intensive multi-week skill sprints covering full-stack web, embedded systems, DevOps, and machine learning toolchains that bridge syllabus topics with modern workflows.",
    icon: Cpu,
    accentColor: "from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/30",
  },
  {
    title: "Internships",
    badge: "Mentored Sprints",
    description:
      "Structured project placements and development tracks guided by faculty, alumni, and senior peer mentors, delivering operational software and engineering solutions.",
    icon: Briefcase,
    accentColor: "from-[#5227FF]/20 to-[#5227FF]/5 text-[#a38cff] border-[#5227FF]/30",
  },
  {
    title: "Hackathons & Contests",
    badge: "Innovation Sprints",
    description:
      "High-energy competitive hackathons and rapid design sprints that challenge students to build functional prototypes and solve real engineering problems in 24–48 hours.",
    icon: Trophy,
    accentColor: "from-[#7cff67]/20 to-[#7cff67]/5 text-[#7cff67] border-[#7cff67]/30",
  },
  {
    title: "Collaborative Projects",
    badge: "Cross-Discipline Teams",
    description:
      "Inter-departmental project squads uniting CSE, ECE, EEE, ME, and CE students to engineer tangible open-source software, physical robotics, and campus utilities.",
    icon: GitBranch,
    accentColor: "from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/30",
  },
  {
    title: "Student-Led Initiatives",
    badge: "Open Incubation",
    description:
      "An open platform for any CEV student or faculty member to propose a technical workshop, boot camp, or study collective with organizational and promotional support.",
    icon: Lightbulb,
    accentColor: "from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/30",
  },
];

export function FoleWorksWhatIs() {
  return (
    <section className="py-16 sm:py-24 bg-white dark:bg-[#070e1b] border-b border-slate-200 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-950/60 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase mb-3">
            <span>What is FOLE WORKS?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Connecting Engineering Students with Real Experience
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            FOLE WORKS is the practical initiative wing of Free Open Learning &amp; Education (FOLE CEV) at College of Engineering Vadakara.
            We empower students to progress from learning theory to creating tangible technology through six core activity pathways.
          </p>
        </div>

        {/* 6 Initiative Pathways Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {INITIATIVES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group relative rounded-2xl p-6 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br border flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${item.accentColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                  <a href="#activities" className="inline-flex items-center gap-1.5 focus:outline-none">
                    <span>View related activities</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
