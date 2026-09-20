"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { EngivaultLogo } from "@/components/branding/EngivaultLogo";
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  Video,
  FileText,
  UploadCloud,
  Activity,
  Settings,
  LogOut,
  ExternalLink,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({ mobileOpen = false, onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const navGroups = [
    {
      group: "OVERVIEW",
      items: [
        { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      group: "CONTENT MANAGEMENT",
      items: [
        { label: "Subjects", href: "/admin/dashboard/subjects", icon: BookOpen },
        { label: "Modules", href: "/admin/dashboard/modules", icon: Layers },
        { label: "Lessons", href: "/admin/dashboard/lessons", icon: Video },
        { label: "Materials", href: "/admin/dashboard/materials", icon: FileText },
      ],
    },
    {
      group: "SYSTEM & PIPELINE",
      items: [
        { label: "Upload Wizard", href: "/admin/dashboard/uploads", icon: UploadCloud },
        { label: "Activity Logs", href: "/admin/dashboard/activity", icon: Activity },
        { label: "Site Settings", href: "/admin/dashboard/settings", icon: Settings },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0B132B] text-slate-300 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between shrink-0">
        <Link
          href="/admin/dashboard"
          onClick={onCloseMobile}
          className="flex flex-col gap-2 group focus:outline-none"
        >
          {/* Official Full ENGIVAULT Logo freely displayed without any confining container */}
          <EngivaultLogo
            variant="full"
            size="sm"
            href={null}
            className="h-10 w-auto"
            priority
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
              ADMIN CONTROL
            </span>
          </div>
        </Link>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Scrollable Navigation Area */}
      <div className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
        {navGroups.map((grp) => (
          <div key={grp.group} className="space-y-1">
            <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1.5">
              {grp.group}
            </div>
            {grp.items.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150",
                    active
                      ? "bg-blue-600 text-white shadow-xs font-bold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      active ? "text-white" : "text-slate-400 group-hover:text-white"
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Anchored Actions */}
      <div className="mt-auto p-4 border-t border-slate-800/80 space-y-2 shrink-0 bg-[#0B132B]">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open Public Site</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500">↗</span>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors text-left"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:flex w-64 h-screen sticky top-0 border-r border-slate-800 shrink-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile / Tablet Drawer & Backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-64 max-w-[80vw] h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
