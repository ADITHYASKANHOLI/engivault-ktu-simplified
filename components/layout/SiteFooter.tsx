import React from "react";
import { Sparkles, ShieldCheck } from "lucide-react";
import { getPublishedSubjects } from "@/lib/queries";
import type { Subject } from "@/types";
import { Footer8, type FooterColumnItem } from "@/components/ui/footer-8";

export async function SiteFooter() {
  const [subjectsResult] = await Promise.allSettled([
    getPublishedSubjects(),
  ]);

  const subjects: Subject[] =
    subjectsResult.status === "fulfilled" ? subjectsResult.value : [];

  const subjectLinks = subjects.slice(0, 6).map((sub) => ({
    label: `${sub.code ? sub.code + " — " : ""}${sub.title}`,
    href: `/subjects/${sub.slug}`,
  }));

  const fallbackSubjectLinks = [
    { label: "CST201 — Data Structures", href: "/subjects" },
    { label: "MAT203 — Discrete Math", href: "/subjects" },
    { label: "CST206 — Operating Systems", href: "/subjects" },
    { label: "EST110 — Engineering Graphics", href: "/subjects" },
  ];

  const columns: FooterColumnItem[] = [
    {
      title: "CURATED KTU VAULTS",
      links: subjectLinks.length > 0 ? subjectLinks : fallbackSubjectLinks,
    },
    {
      title: "COMMONS NODES",
      links: [
        { label: "Archival Codex & Syllabi", href: "/subjects" },
        { label: "FOLE Space Live Desk & Floor", href: "/fole-space" },
        { label: "Works, Events & Workshops", href: "/fole-works" },
        { label: "Pedagogical Study Dossiers", href: "/materials" },
        {
          label: "Liquid Glass Optical Demo",
          href: "/liquid-glass",
          icon: <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
          highlight: true,
        },
      ],
    },
    {
      title: "PLATFORM & ACCESS",
      links: [
        { label: "Lectures Archive", href: "/lectures" },
        { label: "Events & Floor Sessions", href: "/fole-space/events" },
        { label: "About Open Collective", href: "/about" },
        { label: "Contact Desk", href: "/contact" },
        {
          label: "Campus Desk Registrar Access",
          href: "/admin/login",
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />,
          highlight: true,
        },
      ],
    },
  ];

  return (
    <Footer8
      brandTitle="FOLE"
      community="College of Engineering Vadakara (CEV)"
      tagline="Learn Together. Build Together. Grow Together."
      description="A student-led learning community making engineering education more accessible through open learning, collaboration, practical skills and shared knowledge. APJ Abdul Kalam Technological University (Kerala) digital repository."
      contactEmail="folecev@gmail.com"
      columns={columns}
      watermarkText="FOLE"
      copyrightText="© 2025 FOLE INITIATIVE • COLLEGE OF ENGINEERING VADAKARA • CC-BY-NC 4.0"
      secondaryLinks={[
        { label: "Archival Codex", href: "/subjects" },
        { label: "Public Syllabi", href: "/subjects" },
        { label: "Campus Protocols", href: "/fole-space" },
        { label: "Decentralized Nodes", href: "/fole-works" },
      ]}
    />
  );
}
