"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  BookOpen,
  FileText,
  ShieldCheck,
  Search,
  Menu,
  X,
  ChevronRight,
  Home,
  Info,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EngivaultLogo } from "@/components/branding/EngivaultLogo";

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Scroll detection for header backdrop
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile drawer is open to prevent background scrolling
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: "Home", href: "/", icon: Home },
    { label: "Lectures", href: "/lectures", icon: BookOpen },
    { label: "Subjects", href: "/subjects", icon: Compass },
    { label: "Materials", href: "/materials", icon: FileText },
    { label: "About", href: "/about", icon: Info },
    { label: "Contact", href: "/contact", icon: MessageSquare },
  ];

  const isLinkActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
        isScrolled
          ? "bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800 shadow-xs py-2.5 sm:py-3"
          : "bg-transparent py-3 sm:py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
        {/* Brand Logo - Scaled responsibly for narrow viewports (320px+) */}
        <div className="shrink-0 max-w-[130px] xs:max-w-[160px] sm:max-w-[200px]">
          <EngivaultLogo variant="full" size="md" priority className="h-8 xs:h-9 sm:h-10 md:h-11 w-auto" />
        </div>

        {/* Desktop Navigation */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-0.5 bg-slate-100/80 dark:bg-slate-900/70 p-1.5 rounded-full border border-slate-200/70 dark:border-slate-800 backdrop-blur-md"
        >
          {navLinks.map((item) => {
            const active = isLinkActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs lg:text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                  active
                    ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Right Actions: Search & Admin Link */}
        <div className="hidden md:flex items-center gap-2.5">
          <Link
            href="/materials"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            title="Browse Study Notes & Materials"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>Materials</span>
          </Link>

          <Link
            href="/admin/login"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-emerald-700 text-white dark:bg-slate-800 dark:hover:bg-emerald-600 transition-colors shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Admin</span>
          </Link>
        </div>

        {/* Mobile Action Controls: Touch target compliant (>= 44px) */}
        <div className="flex md:hidden items-center gap-1 shrink-0">
          <Link
            href="/materials"
            className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Browse Study Materials"
            title="Materials"
          >
            <FileText className="w-5 h-5 text-emerald-600" />
          </Link>

          <Link
            href="/admin/login"
            className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Administrator Portal"
            title="Admin Login"
          >
            <ShieldCheck className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-slate-900" /> : <Menu className="w-6 h-6 text-slate-900" />}
          </button>
        </div>
      </div>

      {/* Accessible Mobile Navigation Drawer with Overlay */}
      {mobileMenuOpen && (
        <div id="mobile-navigation-drawer" className="fixed inset-0 top-[60px] z-50 md:hidden flex flex-col">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 top-[60px] bg-slate-900/60 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Drawer Sheet */}
          <div className="relative w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 space-y-3 z-10 max-h-[calc(100vh-60px)] overflow-y-auto">
            {/* Quick search button */}
            <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
              <Link
                href="/lectures"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 font-medium"
              >
                <Search className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Search lectures, modules & topics...</span>
              </Link>
            </div>

            {/* Navigation Links with Active Page Indicators */}
            <nav aria-label="Mobile Navigation" className="space-y-1">
              {navLinks.map((item) => {
                const active = isLinkActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors min-h-[44px]",
                      active
                        ? "bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn("w-4 h-4 shrink-0", active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400")} />
                      <span>{item.label}</span>
                    </div>
                    {active ? (
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                        Current
                      </span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Admin Portal Bottom Shortcut */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Admin Access Portal</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
