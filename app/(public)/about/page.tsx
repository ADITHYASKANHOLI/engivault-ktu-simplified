import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle, Users } from "lucide-react";
import { getSiteSettings } from "@/lib/queries";

export const metadata = {
  title: "About FOLE — Free Open Learning & Education",
  description: "Learn about FOLE CEV, a student-led community at College of Engineering Vadakara built around open learning, shared knowledge and useful opportunities.",
};

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <main className="flex-1 bg-[#f7f6ef] pb-20 pt-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-3xl border-b border-[#dce2da] pb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#176b45]">About the community</p>
          <h1 className="fole-heading mt-4 text-4xl leading-tight text-[#17231c] sm:text-6xl">Learning is better when it is shared.</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[#536157] sm:text-lg">
            {settings.about_text || "FOLE — Free Open Learning & Education — is a student-led community at College of Engineering Vadakara. It brings students together to learn, share knowledge, create useful resources and make opportunities easier to access."}
          </p>
        </header>

        <section className="grid gap-10 py-12 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="flex h-11 w-11 items-center justify-center border border-[#dce2da] bg-white text-[#176b45]">
              <Users className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <h2 className="fole-heading mt-5 text-3xl text-[#17231c]">A community built by doing.</h2>
          </div>
          <div className="space-y-5 text-sm leading-7 text-[#536157] sm:text-base">
            <p>
              FOLE creates room for students to learn with one another, contribute what they know and take part in projects beyond routine coursework. The aim is practical: make learning more open, collaborative and useful.
            </p>
            <p>
              The platform brings together academic resources, community activities and student-led initiatives. Students can explore KTU learning material, discover events and find ways to contribute to the wider campus community.
            </p>
            <div className="grid gap-4 border-y border-[#dce2da] py-5 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#176b45]" />
                <div>
                  <h3 className="font-semibold text-[#17231c]">Open learning</h3>
                  <p className="mt-1 text-sm leading-6 text-[#647168]">Study resources organised around the KTU curriculum.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#176b45]" />
                <div>
                  <h3 className="font-semibold text-[#17231c]">Shared opportunities</h3>
                  <p className="mt-1 text-sm leading-6 text-[#647168]">Events, workshops and projects that invite participation.</p>
                </div>
              </div>
            </div>
            <a href="https://ktu.edu.in/home" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[#176b45] hover:text-[#105437]">
              Visit the KTU website <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>

        <section className="flex flex-col items-start justify-between gap-6 border-t border-[#dce2da] pt-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="fole-heading text-3xl text-[#17231c]">Find your place in FOLE.</h2>
            <p className="mt-2 text-sm leading-6 text-[#647168]">Start with a subject, join a community activity or explore what students are building.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/subjects" className="inline-flex min-h-11 items-center gap-2 bg-[#176b45] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#105437]">
              Explore learning <BookOpen className="h-4 w-4" />
            </Link>
            <Link href="/fole-space" className="inline-flex min-h-11 items-center gap-2 border border-[#aebcaf] px-5 text-sm font-semibold text-[#17231c] transition-colors hover:border-[#176b45] hover:bg-white">
              FOLE SPACE <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
