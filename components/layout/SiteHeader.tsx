"use client";

import React, { useState, useEffect, useRef } from "react";
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
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Sync auth state if initialAuth prop changes
  useEffect(() => {
    setAuth(initialAuth || { role: null });
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

  // Return focus to the menu trigger after closing the mobile drawer.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const menuButton = mobileMenuButtonRef.current;
    return () => {
      menuButton?.focus();
    };
  }, [mobileMenuOpen]);

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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#dce2da] bg-[#f7f6ef] px-0 pointer-events-auto">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
        {/* Brand Logo on the Left */}
        <div className="flex items-center shrink-0">
          <Link
            href="/"
            className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176b45] focus-visible:ring-offset-4"
            aria-label="FOLE Homepage"
          >
            <FoleLogoVector className="h-7 sm:h-8 w-auto" textColor="#17231c" greenColor="#176b45" />
          </Link>
        </div>

        {/* Desktop Navigation - Exact Reference Items */}
        <nav
          className="hidden xl:flex items-center gap-6 2xl:gap-8 h-full min-w-0"
          aria-label="Primary Academic Navigation"
        >
          {navLinks.map((item) => {
            const active = isLinkActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center whitespace-nowrap py-2 text-xs tracking-tight transition-colors lg:text-[13px] 2xl:text-sm",
                  active
                    ? "font-semibold text-[#176b45]"
                    : "font-medium text-[#536157] hover:text-[#17231c]"
                )}
              >
                <span>{item.label}</span>
                {active && (
                  <span className="absolute -bottom-1.5 h-0.5 w-6 bg-[#176b45]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Header Right Utilities */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          {/* Search Icon Button */}
          <button
            type="button"
            onClick={() => setSearchDialogOpen(true)}
            aria-label="Search FOLE Curriculum"
            className="flex h-10 w-10 items-center justify-center text-[#536157] transition-colors hover:bg-[#e9eee7] hover:text-[#176b45] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176b45] cursor-pointer"
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
            <div className="hidden sm:flex items-center gap-2 sm:gap-2.5">
              {/* Login Button */}
              <button
                type="button"
                onClick={() => handleOpenLogin("student")}
                className="min-h-[38px] border border-[#aebcaf] px-4 py-1.5 text-xs font-semibold text-[#17231c] transition-colors hover:border-[#176b45] hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176b45] cursor-pointer sm:text-sm"
              >
                Login
              </button>

              {/* Get Started Button */}
              <Link
                href="/subjects"
                className="flex min-h-[38px] items-center justify-center bg-[#176b45] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#105437] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176b45] sm:px-5 sm:text-sm"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            ref={mobileMenuButtonRef}
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center text-[#17231c] transition-colors hover:bg-[#e9eee7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176b45] xl:hidden cursor-pointer"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Accessible Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div id="mobile-navigation-drawer" className="fixed inset-0 top-16 z-50 flex flex-col bg-black/35 xl:hidden pointer-events-auto">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/35"
            aria-hidden="true"
          />

          {/* Drawer Sheet */}
          <div className="relative z-10 max-h-[calc(100dvh-4rem)] w-full space-y-4 overflow-y-auto border-b border-[#dce2da] bg-[#f7f6ef] p-4 sm:p-6">
            {/* Quick search input button */}
            <div className="border-b border-[#dce2da] pb-3">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSearchDialogOpen(true);
                }}
                className="flex w-full items-center gap-2.5 border border-[#dce2da] bg-white px-3.5 py-3 text-left text-xs text-[#647168]"
              >
                <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Search KTU subjects, modules or topics...</span>
              </button>
            </div>

            {/* Primary Navigation Links */}
            <nav aria-label="Mobile Navigation" className="space-y-0">
              {navLinks.map((item) => {
                const active = isLinkActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex min-h-[48px] items-center justify-between border-b border-[#dce2da] px-3 py-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-white font-semibold text-[#176b45]"
                        : "text-[#536157] hover:bg-white hover:text-[#17231c]"
                    )}
                  >
                    <span>{item.label}</span>
                    {active ? (
                      <span className="h-1.5 w-1.5 bg-[#176b45]" aria-label="Current page" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Quick Feature Destinations */}
            <div className="grid grid-cols-2 gap-2 border-t border-[#dce2da] pt-4">
              <Link
                href="/subjects"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 border border-[#dce2da] bg-white px-3 py-3 text-xs font-medium text-[#536157] transition-colors hover:border-[#176b45] hover:text-[#176b45]"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>Curriculum</span>
              </Link>
              <Link
                href="/materials"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 border border-[#dce2da] bg-white px-3 py-3 text-xs font-medium text-[#536157] transition-colors hover:border-[#176b45] hover:text-[#176b45]"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Materials</span>
              </Link>
              <Link
                href="/fole-space"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 border border-[#dce2da] bg-white px-3 py-3 text-xs font-medium text-[#536157] transition-colors hover:border-[#176b45] hover:text-[#176b45]"
              >
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>FOLE SPACE</span>
              </Link>
              <Link
                href="/fole-works"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 border border-[#dce2da] bg-white px-3 py-3 text-xs font-medium text-[#536157] transition-colors hover:border-[#176b45] hover:text-[#176b45]"
              >
                <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                <span>FOLE WORKS</span>
              </Link>
            </div>

            {/* Bottom Unified Auth Action */}
            <div className="border-t border-[#dce2da] pt-4">
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
                    className="min-h-11 w-full border border-[#aebcaf] px-4 py-2.5 text-sm font-semibold text-[#17231c] transition-colors hover:border-[#176b45] hover:bg-white"
                  >
                    Student / Admin Login
                  </button>
                  <Link
                    href="/subjects"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full bg-[#176b45] px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#105437]"
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
