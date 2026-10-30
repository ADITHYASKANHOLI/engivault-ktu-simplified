"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  ShieldCheck,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Settings,
  ChevronRight,
} from "lucide-react";

export interface AuthState {
  role: "admin" | "student" | null;
  username?: string | null;
}

export interface AuthMenuProps {
  initialAuth?: AuthState | null;
  onOpenLogin: (tab?: "student" | "admin") => void;
  variant?: "desktop" | "mobile-icon" | "mobile-drawer";
  onCloseDrawer?: () => void;
}

export function AuthMenu({
  initialAuth,
  onOpenLogin,
  variant = "desktop",
  onCloseDrawer,
}: AuthMenuProps) {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState>(initialAuth || { role: null });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync auth state if initialAuth prop changes
  useEffect(() => {
    if (initialAuth) {
      setAuth(initialAuth);
    }
  }, [initialAuth]);

  // Click outside listener for dropdown
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleAdminLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    }
    setDropdownOpen(false);
    setAuth({ role: null });
    router.push("/");
    router.refresh();
  };


  const handleStudentLogout = async () => {
    try {
      await fetch("/api/auth/student/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    }
    setDropdownOpen(false);
    setAuth({ role: null });
    router.refresh();
  };

  // 1. MOBILE ICON VARIANT (Control row, >=44px touch target)
  if (variant === "mobile-icon") {
    if (!auth.role) {
      return (
        <button
          type="button"
          onClick={() => onOpenLogin("student")}
          className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label="Login to account"
          title="Login"
        >
          <User className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        </button>
      );
    }

    if (auth.role === "admin") {
      return (
        <Link
          href="/admin/dashboard"
          className="w-11 h-11 flex items-center justify-center rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label="Admin Dashboard"
          title="Admin Dashboard"
        >
          <ShieldCheck className="w-5 h-5" />
        </Link>
      );
    }

    return (
      <Link
        href="/account"
        className="w-11 h-11 flex items-center justify-center rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        aria-label="Student Account"
        title="My Account"
      >
        <User className="w-5 h-5" />
      </Link>
    );
  }

  // 2. MOBILE DRAWER VARIANT (Inside mobile drawer sheet)
  if (variant === "mobile-drawer") {
    if (!auth.role) {
      return (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              if (onCloseDrawer) onCloseDrawer();
              onOpenLogin("student");
            }}
            className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors min-h-[44px]"
          >
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Login / Account</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      );
    }

    if (auth.role === "admin") {
      return (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
          <Link
            href="/admin/dashboard"
            onClick={onCloseDrawer}
            className="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold text-slate-900 dark:text-white bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 min-h-[44px]"
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Admin Dashboard</span>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-600" />
          </Link>
          <button
            type="button"
            onClick={() => {
              if (onCloseDrawer) onCloseDrawer();
              handleAdminLogout();
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out Admin</span>
          </button>
        </div>
      );
    }

    return (
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
        <Link
          href="/account"
          onClick={onCloseDrawer}
          className="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold text-slate-900 dark:text-white bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 min-h-[44px]"
        >
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>My Account ({auth.username})</span>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-600" />
        </Link>
        <button
          type="button"
          onClick={() => {
            if (onCloseDrawer) onCloseDrawer();
            handleStudentLogout();
          }}
          className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors min-h-[44px]"
        >
          <LogOut className="w-4 h-4" />
          <span>Log out (@{auth.username})</span>
        </button>
      </div>
    );
  }

  // 3. DESKTOP VARIANT
  if (!auth.role) {
    return (
      <button
        type="button"
        onClick={() => onOpenLogin("student")}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-emerald-700 text-white dark:bg-slate-800 dark:hover:bg-emerald-600 transition-colors shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <User className="w-3.5 h-3.5 text-emerald-400" />
        <span>Login</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-colors shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
      >
        {auth.role === "admin" ? (
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        )}
        <span className="max-w-[120px] truncate">
          {auth.role === "admin" ? "Admin" : auth.username}
        </span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            Signed in as{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              {auth.role === "admin" ? "Administrator" : `@${auth.username}`}
            </span>
          </div>

          {auth.role === "admin" ? (
            <Link
              href="/admin/dashboard"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600" />
              <span>Admin Dashboard</span>
            </Link>
          ) : (
            <Link
              href="/account"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-emerald-600" />
              <span>My Account</span>
            </Link>
          )}

          <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

          <button
            type="button"
            onClick={auth.role === "admin" ? handleAdminLogout : handleStudentLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  );
}
