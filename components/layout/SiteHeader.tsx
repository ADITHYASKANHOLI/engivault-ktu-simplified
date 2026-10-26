"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  ChevronRight,
  BookOpen,
  FileText,
  Users,
  Briefcase,
  X,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FoleLogoVector } from "@/components/branding/FoleLogoVector";
import { AuthMenu, AuthState } from "@/components/auth/AuthMenu";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { QuickSearchDialog } from "@/components/search/QuickSearchDialog";

export interface SiteHeaderProps {
  initialAuth?: AuthState | null;
  isOffline?: boolean;
}

export function SiteHeader({ initialAuth, isOffline = false }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [auth, setAuth] = useState<AuthState>(initialAuth || { role: null });
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [loginDialogTab, setLoginDialogTab] = useState<"student" | "admin">("student");
  const [loginReturnTo, setLoginReturnTo] = useState<string | undefined>(undefined);
  const pathname = usePathname();

  // Sync auth state if initialAuth prop changes
  useEffect(() => {
    if (initialAuth) {
      setAuth(initialAuth);
    }
  }, [initialAuth]);

  // Open login dialog if URL query param ?auth=login is detected
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("auth") === "login") {
        setLoginDialogOpen(true);
        const tab = params.get("tab");
        if (tab === "admin" || tab === "student") {
          setLoginDialogTab(tab);
        }
        const returnTo = params.get("returnTo") || params.get("redirect");
        if (returnTo) setLoginReturnTo(returnTo);
      }
    }
  }, [pathname]);

  // Support programmatic login opening from FOLE SPACE actions
  useEffect(() => {
    const handleCustomOpenLogin = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab?: "student" | "admin"; returnTo?: string }>;
      if (customEvent.detail?.tab) {
        setLoginDialogTab(customEvent.detail.tab);
      }
      if (customEvent.detail?.returnTo) {
        setLoginReturnTo(customEvent.detail.returnTo);
      }
      setLoginDialogOpen(true);
    };
    window.addEventListener("fole:open-login", handleCustomOpenLogin);
    return () => window.removeEventListener("fole:open-login", handleCustomOpenLogin);
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

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileMenuOpen]);

  // Exact navigation items from the FOLE reference mockup
  const navLinks = [
    { label: "Home", href: "/", id: "nav-home" },
    { label: "Learn", href: "/lectures", id: "nav-learn" },
    { label: "Materials", href: "/materials", id: "nav-materials" },
    { label: "FOLE SPACE", href: "/fole-space", id: "nav-fole-space" },
    { label: "FOLE WORKS", href: "/fole-works", id: "nav-fole-works" },
    { label: "Events", href: "/fole-space/events", id: "nav-events" },
    { label: "Community", href: "/about", id: "nav-community" },
  ];

  const isLinkActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleOpenLogin = (tab: "student" | "admin" = "student") => {
    setLoginDialogTab(tab);
    setLoginDialogOpen(true);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-40 bg-white/75 dark:bg-[#07140e]/80 backdrop-blur-md border-b border-white/50 dark:border-white/10 shadow-xs transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-4">
        {/* Brand Logo on the Left */}
        <div className="flex items-center">
          <Link
            href="/"
            className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 rounded transition-transform hover:scale-[1.02]"
            aria-label="FOLE Homepage"
          >
            <FoleLogoVector className="h-8 sm:h-9 w-auto" />
          </Link>
        </div>

        {/* Desktop Navigation - Exact Reference Items */}
        <nav
          className="hidden lg:flex items-center gap-7 xl:gap-8 h-full"
          aria-label="Primary Academic Navigation"
        >
          {navLinks.map((item) => {
            const active = isLinkActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative text-sm tracking-tight transition-colors py-2 flex flex-col items-center",
                  active
                    ? "text-[#050E09] dark:text-white font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white font-medium"
                )}
              >
                <span>{item.label}</span>
                {active && (
                  <span className="absolute -bottom-1.5 w-6 h-0.5 bg-[#00C853] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Header Right Utilities */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Search Icon Button */}
          <button
            type="button"
            onClick={() => setSearchDialogOpen(true)}
            aria-label="Search FOLE Curriculum"
            className="p-2 rounded-full text-slate-700 dark:text-slate-200 hover:text-[#00C853] hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
          </button>

          {/* Divider */}
          <div className="h-4 w-px bg-slate-300 dark:bg-white/20 hidden sm:block" />

          {/* Authentication Actions */}
          {auth.role ? (
            <div className="flex items-center gap-2">
              <AuthMenu
                initialAuth={auth}
                onOpenLogin={handleOpenLogin}
                variant="desktop"
              />
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2.5">
              {/* Login Button */}
              <button
                type="button"
                onClick={() => handleOpenLogin("student")}
                className="px-4.5 py-1.5 rounded-full border border-slate-700/40 hover:border-slate-900 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold hover:bg-slate-900/5 dark:hover:bg-white/5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                Login
              </button>

              {/* Get Started Button */}
              <Link
                href="/subjects"
                className="px-5 py-1.5 rounded-full bg-[#00C853] hover:bg-[#00B048] text-white text-xs sm:text-sm font-bold shadow-sm shadow-emerald-500/25 hover:shadow-emerald-500/35 transition-all flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 flex lg:hidden items-center justify-center rounded-xl text-slate-800 dark:text-slate-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Accessible Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div id="mobile-navigation-drawer" className="fixed inset-0 top-18 z-50 lg:hidden flex flex-col">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 top-18 bg-black/60 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Drawer Sheet */}
          <div className="relative w-full bg-white dark:bg-[#07140e] border-b border-slate-200 dark:border-emerald-950 shadow-2xl p-4 sm:p-6 space-y-4 z-10 max-h-[calc(100vh-72px)] overflow-y-auto">
            {/* Quick search input button */}
            <div className="pb-2 border-b border-slate-100 dark:border-emerald-950">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSearchDialogOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-900 text-xs text-slate-500 dark:text-slate-400"
              >
                <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Search KTU subjects, modules or topics...</span>
              </button>
            </div>

            {/* Primary Navigation Links */}
            <nav aria-label="Mobile Navigation" className="space-y-1">
              {navLinks.map((item) => {
                const active = isLinkActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-colors min-h-[44px]",
                      active
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border-l-4 border-[#00C853]"
                        : "text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
                    )}
                  >
                    <span>{item.label}</span>
                    {active ? (
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                        Active
                      </span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Quick Feature Destinations */}
            <div className="pt-2 border-t border-slate-100 dark:border-emerald-950 grid grid-cols-2 gap-2">
              <Link
                href="/subjects"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-emerald-950/30 border border-slate-200/60 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-slate-200 font-medium"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>Curriculum</span>
              </Link>
              <Link
                href="/materials"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-emerald-950/30 border border-slate-200/60 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-slate-200 font-medium"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Materials</span>
              </Link>
              <Link
                href="/fole-space"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-emerald-950/30 border border-slate-200/60 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-slate-200 font-medium"
              >
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>FOLE SPACE</span>
              </Link>
              <Link
                href="/fole-works"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-emerald-950/30 border border-slate-200/60 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-slate-200 font-medium"
              >
                <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                <span>FOLE WORKS</span>
              </Link>
            </div>

            {/* Bottom Unified Auth Action */}
            <div className="pt-2 border-t border-slate-100 dark:border-emerald-950">
              {auth.role ? (
                <AuthMenu
                  initialAuth={auth}
                  onOpenLogin={handleOpenLogin}
                  variant="mobile-drawer"
                  onCloseDrawer={() => setMobileMenuOpen(false)}
                />
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleOpenLogin("student");
                    }}
                    className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    Student / Admin Login
                  </button>
                  <Link
                    href="/subjects"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-[#00C853] hover:bg-[#00B048] text-white text-sm font-bold text-center shadow-sm shadow-emerald-500/25 transition-colors"
                  >
                    Get Started Free
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Accessible Login & Registration Dialog */}
      <LoginDialog
        isOpen={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        initialTab={loginDialogTab}
        isOffline={isOffline}
        redirectUrl={loginReturnTo}
        onAuthSuccess={(newAuth) => setAuth(newAuth)}
      />

      {/* Accessible Quick Search Dialog */}
      <QuickSearchDialog
        isOpen={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
      />
    </header>
  );
}
