"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  BookOpen,
  FileText,
  Users,
  Briefcase,
  CalendarDays,
  Info,
  GraduationCap,
} from "lucide-react";
import { AuthMenu, AuthState } from "@/components/auth/AuthMenu";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { QuickSearchDialog } from "@/components/search/QuickSearchDialog";
import { MagneticButton, AnimatedTooltip } from "@/components/ui/animate";
import PillNav from "@/components/PillNav";

export interface SiteHeaderProps {
  initialAuth?: AuthState | null;
  isOffline?: boolean;
}

export function SiteHeader({ initialAuth, isOffline = false }: SiteHeaderProps) {
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [auth, setAuth] = useState<AuthState>(initialAuth || { role: null });
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [loginDialogTab, setLoginDialogTab] = useState<"student" | "admin">("student");
  const [loginReturnTo, setLoginReturnTo] = useState<string | undefined>(undefined);
  const pathname = usePathname();

  useEffect(() => {
    setAuth(initialAuth || { role: null });
  }, [initialAuth]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "login") {
      setLoginDialogOpen(true);
      const tab = params.get("tab");
      if (tab === "admin" || tab === "student") setLoginDialogTab(tab);
      const returnTo = params.get("returnTo") || params.get("redirect");
      if (returnTo) setLoginReturnTo(returnTo);
    }
  }, [pathname]);

  useEffect(() => {
    const handleCustomOpenLogin = (event: Event) => {
      const customEvent = event as CustomEvent<{
        tab?: "student" | "admin";
        returnTo?: string;
      }>;
      if (customEvent.detail?.tab) setLoginDialogTab(customEvent.detail.tab);
      if (customEvent.detail?.returnTo) setLoginReturnTo(customEvent.detail.returnTo);
      setLoginDialogOpen(true);
    };

    window.addEventListener("fole:open-login", handleCustomOpenLogin);
    return () => window.removeEventListener("fole:open-login", handleCustomOpenLogin);
  }, []);

  const navLinks = [
    { label: "Home", href: "/", icon: <span aria-hidden="true">⌂</span> },
    { label: "Learn", href: "/lectures", icon: <BookOpen aria-hidden="true" /> },
    { label: "Materials", href: "/materials", icon: <FileText aria-hidden="true" /> },
    { label: "FOLE SPACE", href: "/fole-space", icon: <Users aria-hidden="true" /> },
    { label: "FOLE WORKS", href: "/fole-works", icon: <Briefcase aria-hidden="true" /> },
    { label: "Events", href: "/fole-space/events", icon: <CalendarDays aria-hidden="true" /> },
    { label: "Community", href: "/about", icon: <Info aria-hidden="true" /> },
  ];

  const getActiveHref = (path: string): string => {
    if (!path || path === "/") return "/";
    if (path === "/fole-space/events" || path.startsWith("/fole-space/events/")) {
      return "/fole-space/events";
    }
    if (path === "/fole-space" || path.startsWith("/fole-space/")) return "/fole-space";
    if (path === "/fole-works" || path.startsWith("/fole-works/")) return "/fole-works";
    if (
      path === "/lectures" ||
      path.startsWith("/lectures/") ||
      path === "/subjects" ||
      path.startsWith("/subjects/")
    ) {
      return "/lectures";
    }
    if (path === "/materials" || path.startsWith("/materials/")) return "/materials";
    if (path === "/about" || path.startsWith("/about/")) return "/about";
    return "";
  };

  const activeHref = getActiveHref(pathname);

  const handleOpenLogin = (tab: "student" | "admin" = "student") => {
    setLoginDialogTab(tab);
    setLoginDialogOpen(true);
  };

  return (
    <header className="fixed top-2.5 sm:top-5 inset-x-0 z-50 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto pointer-events-none transition-all duration-300">
      <div className="w-full min-h-14 sm:min-h-16 px-3 sm:px-5 lg:px-7 rounded-full bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.09)] flex items-center justify-between gap-2 sm:gap-3 pointer-events-auto overflow-visible">
        {/* The same React Bits PillNav now drives every breakpoint. Its built-in
            responsive collapse produces the mobile hamburger/dropdown menu. */}
        <div className="flex-1 min-w-0 flex items-center">
          <PillNav
            logo="/branding/fole-logo.png"
            logoAlt="FOLE — Free Open Learning & Education"
            logoHref="/"
            linkComponent={Link}
            items={navLinks}
            activeHref={activeHref}
            itemStyle="pill"
            hoverEffect="fill"
            indicator="dot"
            theme="light"
            layout="joined"
            size="md"
            highlightColor="#00A86B"
            highlightTextColor="#FFFFFF"
            textColor="#050908"
            surface="none"
            collapse="auto"
            intro={false}
            className="w-full"
            ariaLabel="FOLE primary navigation"
            renderPanelFooter={(closeMenu) => (
              <div className="space-y-2">
                <AuthMenu
                  initialAuth={auth}
                  onOpenLogin={handleOpenLogin}
                  variant="mobile-drawer"
                  onCloseDrawer={closeMenu}
                />
                {!auth.role && (
                  <Link
                    href="/subjects"
                    onClick={closeMenu}
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#00A86B] px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#008f5a] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <GraduationCap className="h-4 w-4" aria-hidden="true" />
                    Get Started Free
                  </Link>
                )}
              </div>
            )}
          />
        </div>

        {/* Utilities remain beside the responsive navigation. Account controls
            are intentionally omitted here on mobile and appear in the menu. */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <AnimatedTooltip content="Search KTU curriculum" side="bottom">
            <MagneticButton strength={0.2} range={45}>
              <button
                type="button"
                onClick={() => setSearchDialogOpen(true)}
                aria-label="Search FOLE curriculum"
                className="w-10 h-10 rounded-full text-slate-700 hover:text-[#00A86B] hover:bg-black/5 transition-colors flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
              >
                <Search className="w-4.5 h-4.5 stroke-[2.2]" />
              </button>
            </MagneticButton>
          </AnimatedTooltip>

          <div className="hidden xl:block h-5 w-px bg-slate-300/90" />

          {auth.role ? (
            <div className="hidden xl:flex items-center">
              <AuthMenu
                initialAuth={auth}
                onOpenLogin={handleOpenLogin}
                variant="desktop"
              />
            </div>
          ) : (
            <div className="hidden xl:flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenLogin("student")}
                className="min-h-10 px-4 rounded-full border border-slate-700/60 hover:border-slate-900 text-slate-800 text-sm font-semibold hover:bg-slate-900/5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer"
              >
                Login
              </button>
              <Link
                href="/subjects"
                className="min-h-10 px-5 rounded-full bg-[#00A86B] hover:bg-[#008f5a] text-white text-sm font-bold shadow-sm shadow-emerald-500/25 hover:shadow-emerald-500/35 transition-all flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>

      <LoginDialog
        isOpen={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        initialTab={loginDialogTab}
        isOffline={isOffline}
        redirectUrl={loginReturnTo}
        onAuthSuccess={(newAuth) => setAuth(newAuth)}
      />

      <QuickSearchDialog
        isOpen={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
      />
    </header>
  );
}
