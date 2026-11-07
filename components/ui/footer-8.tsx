"use client";

import React from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { YoutubeIcon } from "@/components/icons/YoutubeIcon";

function GithubIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export interface FooterSocialItem {
  key: string;
  icon: React.ReactNode;
  href: string;
  label: string;
}

export interface FooterLinkItem {
  label: string;
  href: string;
  badge?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}

export interface FooterColumnItem {
  title: string;
  links: FooterLinkItem[];
}

export interface Footer8Props {
  brandTitle?: string;
  tagline?: string;
  description?: string;
  community?: string;
  contactEmail?: string;
  socials?: FooterSocialItem[];
  columns?: FooterColumnItem[];
  watermarkText?: string;
  copyrightText?: string;
  secondaryLinks?: { label: string; href: string }[];
  className?: string;
}

const defaultSocials: FooterSocialItem[] = [
  {
    key: "github",
    icon: <GithubIcon className="w-4 h-4" />,
    href: "https://github.com/ADITHYASKANHOLI",
    label: "GitHub"
  },
  {
    key: "email",
    icon: <Mail className="w-4 h-4" />,
    href: "mailto:folecev@gmail.com",
    label: "Email"
  },
  {
    key: "youtube",
    icon: <YoutubeIcon className="w-4 h-4" />,
    href: "https://youtube.com",
    label: "YouTube"
  }
];

export function Footer8({
  brandTitle = "FOLE",
  tagline = "Learn Together. Build Together. Grow Together.",
  description = "A student-led learning community making engineering education more accessible through open learning, collaboration, practical skills and shared knowledge.",
  community = "College of Engineering Vadakara (CEV)",
  contactEmail = "folecev@gmail.com",
  socials = defaultSocials,
  columns = [],
  watermarkText = "FOLE",
  copyrightText = "© 2025 FOLE INITIATIVE • COLLEGE OF ENGINEERING VADAKARA • CC-BY-NC 4.0",
  secondaryLinks = [
    { label: "Archival Codex", href: "/subjects" },
    { label: "Public Syllabi", href: "/subjects" },
    { label: "Campus Protocols", href: "/fole-space" },
    { label: "Decentralized Nodes", href: "/fole-works" }
  ],
  className = ""
}: Footer8Props) {
  return (
    <footer
      className={`relative w-full overflow-hidden border-t border-slate-200/80 bg-[#F8F7F0] dark:bg-[#07111F] text-slate-700 dark:text-slate-300 px-4 sm:px-6 lg:px-8 pt-14 pb-8 transition-colors ${className}`}
    >
      <div className="relative max-w-[1400px] mx-auto w-full">
        {/* Upper 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.3fr_1.1fr_1fr_1fr] gap-10 lg:gap-12">
          {/* Brand & Community Column */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-2xl font-bold tracking-tight text-emerald-900 dark:text-white font-mono">
                {brandTitle}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                OPEN CHARTER
              </span>
            </div>

            <div className="text-xs font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
              {community}
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
              {description}
            </p>

            <div className="text-xs italic text-slate-500 dark:text-slate-400">
              &ldquo;{tagline}&rdquo;
            </div>

            {/* Social & Contact Actions */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              {socials.map((item) => (
                <a
                  key={item.key}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  aria-label={item.label}
                  className="w-9 h-9 rounded-md border border-slate-300 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  {item.icon}
                </a>
              ))}
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-emerald-600/30 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-mono transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{contactEmail}</span>
                </a>
              )}
            </div>
          </motion.div>

          {/* Navigation Columns */}
          {columns.map((col, idx) => (
            <motion.div
              key={col.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.05 + 0.05 * idx }}
              className="flex flex-col gap-3 lg:border-t lg:border-slate-200 dark:lg:border-slate-800/80 lg:pt-4"
            >
              <h4 className="text-xs font-mono font-bold uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-400">
                {col.title}
              </h4>
              <ul className="flex flex-col gap-2.5 text-xs font-mono">
                {col.links.map((link, linkIdx) => (
                  <li key={`${link.label}-${linkIdx}`} className="flex items-center gap-2 min-w-0">
                    <Link
                      href={link.href}
                      className={`transition-colors flex items-center gap-1.5 min-w-0 truncate focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400 rounded-sm ${
                        link.highlight
                          ? "text-emerald-700 dark:text-emerald-400 font-semibold hover:text-emerald-800 dark:hover:text-emerald-300"
                          : "text-slate-600 dark:text-slate-400 hover:text-emerald-800 dark:hover:text-white"
                      }`}
                    >
                      {link.icon}
                      <span className="truncate">{link.label}</span>
                    </Link>
                    {link.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shrink-0">
                        {link.badge}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Signature Watermark Text from React Bits Pro Footer 8 */}
        <div
          className="relative mt-16 sm:mt-20 w-full select-none pointer-events-none"
          aria-hidden="true"
          style={{
            fontSize: "min(14.2vw, 210px)",
            height: "0.74em",
            maskImage: "linear-gradient(to bottom, #000 50%, transparent 95%)",
            WebkitMaskImage: "linear-gradient(to bottom, #000 50%, transparent 95%)"
          }}
        >
          <div
            className="absolute inset-0 flex justify-center font-bold tracking-[0.15em] pl-[0.15em] uppercase leading-none whitespace-nowrap text-[#00A86B]/20 dark:text-[#00A86B]/15"
            style={{
              fontSize: "inherit",
              textShadow:
                "0 -1.5px 0 rgba(0,168,107,0.35), 1.5px 0 0 rgba(0,168,107,0.35), 0 1.5px 0 rgba(0,168,107,0.35), -1.5px 0 0 rgba(0,168,107,0.35), 1px 1px 0 rgba(0,168,107,0.25), -1px -1px 0 rgba(0,168,107,0.25)"
            }}
          >
            {watermarkText}
          </div>
        </div>

        {/* Lower Legal & Licensing Bar */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500 dark:text-slate-400 text-center sm:text-left">
          <p>{copyrightText}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px]">
            {secondaryLinks.map((sec) => (
              <Link
                key={sec.label}
                href={sec.href}
                className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              >
                {sec.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer8;
