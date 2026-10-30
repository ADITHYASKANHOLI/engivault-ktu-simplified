"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, CalendarDays, Play, Users } from "lucide-react";
import { FoleLogoVector } from "@/components/branding/FoleLogoVector";
import { HeroVideoDialog } from "@/components/landing/HeroVideoDialog";

export interface LandingHeroProps {
  totalSubjects?: number;
}

export function LandingHero({ totalSubjects = 0 }: LandingHeroProps) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const watchVideoBtnRef = useRef<HTMLButtonElement | null>(null);

  const scrollToCurriculum = () => {
    const target = document.getElementById("featured-subjects") || document.getElementById("latest-classes");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <section className="w-full border-b border-[#dce2da] bg-[#f7f6ef]">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="flex min-h-[560px] flex-col justify-center px-5 py-16 sm:px-10 sm:py-20 lg:min-h-[650px] lg:px-16 xl:px-24">
            <div className="mb-7 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#176b45]">
              <span className="h-px w-9 bg-[#176b45]" aria-hidden="true" />
              A student-led learning collective
            </div>

            <FoleLogoVector
              className="mb-8 h-auto w-[min(310px,78vw)] sm:w-[390px]"
              textColor="#17231c"
              greenColor="#176b45"
            />

            <h1 className="fole-heading max-w-[620px] text-[clamp(2.8rem,5.6vw,5.25rem)] leading-[0.98] text-[#17231c]">
              Ideas into impact.
            </h1>
            <p className="mt-6 max-w-[540px] text-base leading-8 text-[#536157] sm:text-lg">
              An open student community at College of Engineering Vadakara. Learn together, share what you know, build useful things, and create opportunities for others.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/subjects"
                className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#176b45] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#105437] focus-visible:outline-offset-4"
              >
                Explore learning <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                ref={watchVideoBtnRef}
                type="button"
                onClick={() => setIsVideoOpen(true)}
                aria-label="Watch the FOLE introduction video"
                className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#aebcaf] px-5 text-sm font-semibold text-[#17231c] transition-colors hover:border-[#176b45] hover:bg-white"
              >
                <Play className="h-4 w-4 fill-current" /> Watch the film
              </button>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-[#dce2da] pt-5 text-xs text-[#647168]">
              <span className="font-semibold uppercase tracking-[0.12em]">Free Open Learning & Education</span>
              {totalSubjects > 0 && (
                <span>{totalSubjects} published {totalSubjects === 1 ? "subject" : "subjects"}</span>
              )}
              <button
                type="button"
                onClick={scrollToCurriculum}
                className="inline-flex items-center gap-1 font-semibold text-[#176b45] underline decoration-[#9bb7a4] underline-offset-4 hover:text-[#105437]"
              >
                Browse the collection <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="relative min-h-[340px] overflow-hidden bg-[#123d2b] sm:min-h-[460px] lg:min-h-[650px]">
            <Image
              src="/images/fole-hero-campus.png"
              alt="Contemporary campus architecture surrounded by greenery"
              fill
              priority
              quality={90}
              sizes="(max-width: 1023px) 100vw, 50vw"
              className="object-cover object-[58%_center]"
            />
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 border-t border-white/35 bg-[#10291f]/88 px-5 py-4 text-white sm:px-8">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b7d7c2]">FOLE · CEV</p>
                <p className="mt-1 text-sm font-medium">Learning, people, opportunities.</p>
              </div>
              <span className="hidden text-xs text-white/75 sm:block">College of Engineering Vadakara</span>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Explore FOLE" className="border-b border-[#dce2da] bg-white">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 divide-y divide-[#dce2da] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Link href="/subjects" className="group flex items-center gap-4 px-5 py-5 transition-colors hover:bg-[#f2f5ef] sm:px-8 lg:px-12">
            <BookOpen className="h-5 w-5 shrink-0 text-[#176b45]" strokeWidth={1.8} />
            <span>
              <span className="block text-sm font-semibold text-[#17231c]">Open learning</span>
              <span className="mt-1 block text-xs text-[#647168]">KTU subjects, notes and lectures</span>
            </span>
            <ArrowRight className="ml-auto h-4 w-4 text-[#91a095] transition-transform group-hover:translate-x-1 group-hover:text-[#176b45]" />
          </Link>
          <Link href="/fole-space" className="group flex items-center gap-4 px-5 py-5 transition-colors hover:bg-[#f2f5ef] sm:px-8 lg:px-12">
            <Users className="h-5 w-5 shrink-0 text-[#176b45]" strokeWidth={1.8} />
            <span>
              <span className="block text-sm font-semibold text-[#17231c]">FOLE SPACE</span>
              <span className="mt-1 block text-xs text-[#647168]">Meet, learn and work together</span>
            </span>
            <ArrowRight className="ml-auto h-4 w-4 text-[#91a095] transition-transform group-hover:translate-x-1 group-hover:text-[#176b45]" />
          </Link>
          <Link href="/fole-works" className="group flex items-center gap-4 px-5 py-5 transition-colors hover:bg-[#f2f5ef] sm:px-8 lg:px-12">
            <CalendarDays className="h-5 w-5 shrink-0 text-[#176b45]" strokeWidth={1.8} />
            <span>
              <span className="block text-sm font-semibold text-[#17231c]">FOLE WORKS</span>
              <span className="mt-1 block text-xs text-[#647168]">Events, workshops and projects</span>
            </span>
            <ArrowRight className="ml-auto h-4 w-4 text-[#91a095] transition-transform group-hover:translate-x-1 group-hover:text-[#176b45]" />
          </Link>
        </div>
      </section>

      <HeroVideoDialog
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
        triggerRef={watchVideoBtnRef}
        videoSrc="/videos/fole-intro.mp4"
        posterSrc="/videos/fole-intro-poster.jpg"
      />
    </>
  );
}
