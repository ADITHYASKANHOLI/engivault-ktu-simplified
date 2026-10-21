"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Lock,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (auth: { role: "admin" | "student"; username: string }) => void;
  initialTab?: "student" | "admin";
  isOffline?: boolean;
}

export function LoginDialog({
  isOpen,
  onClose,
  onAuthSuccess,
  initialTab = "student",
  isOffline = false,
}: LoginDialogProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"student" | "admin">(initialTab);
  const [studentMode, setStudentMode] = useState<"login" | "signup">("login");

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sync initial tab when opening
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setError(null);
      setSuccess(null);
      setUsername("");
      setPassword("");
      setAdminCode("");
      setShowPassword(false);
    }
  }, [isOpen, initialTab]);

  // Focus trap and auto-focus on open
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Lock body scroll when dialog is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    const cleanUsername = username.toLowerCase().trim();
    const endpoint =
      studentMode === "signup"
        ? "/api/auth/student/signup"
        : "/api/auth/student/login";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanUsername,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      setSuccess(
        studentMode === "signup"
          ? "Account created! Logging you in..."
          : "Logged in successfully!"
      );

      setTimeout(() => {
        onClose();
        if (onAuthSuccess) {
          onAuthSuccess({ role: "student", username: cleanUsername });
        }
        router.refresh();
      }, 500);
    } catch {
      setError("An unexpected network error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: adminCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid administrator access code.");
        setLoading(false);
        return;
      }

      setSuccess("Administrator verified. Entering dashboard...");
      setTimeout(() => {
        onClose();
        if (onAuthSuccess) {
          onAuthSuccess({ role: "admin", username: "Admin" });
        }
        window.location.href = data.redirectUrl || "/admin/dashboard";
      }, 500);
    } catch {
      setError("An unexpected network error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        ref={dialogRef}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 space-y-5 z-10 text-slate-900 dark:text-slate-100 animate-in zoom-in-95 fade-in duration-150"
      >
        {/* Header with Title and Close Button */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 id="auth-dialog-title" className="text-lg font-bold tracking-tight">
              Sign In to FOLE Web
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Access your student account or administrative control
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Control: Student vs Admin */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab("student");
              setError(null);
            }}
            className={cn(
              "flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 focus:outline-none",
              activeTab === "student"
                ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <User className="w-3.5 h-3.5" />
            <span>Student</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("admin");
              setError(null);
            }}
            className={cn(
              "flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 focus:outline-none",
              activeTab === "admin"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Admin</span>
          </button>
        </div>

        {/* Live Status Region */}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Tab 1: Student Authentication */}
        {activeTab === "student" && (
          <div>
            {isOffline ? (
              <div className="py-6 text-center space-y-3">
                <Info className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Student accounts are unavailable in offline mode.
                </p>
                <p className="text-[11px] text-slate-500">
                  You can freely browse all KTU curriculum and lectures as a guest.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 transition-colors"
                >
                  Continue as guest
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Sub-toggle: Sign In vs Create Account */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setStudentMode("login");
                      setError(null);
                    }}
                    className={cn(
                      "pb-2 font-semibold transition-colors mr-4 border-b-2",
                      studentMode === "login"
                        ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                        : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    )}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStudentMode("signup");
                      setError(null);
                    }}
                    className={cn(
                      "pb-2 font-semibold transition-colors border-b-2",
                      studentMode === "signup"
                        ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                        : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    )}
                  >
                    Create account
                  </button>
                </div>

                {studentMode === "signup" && (
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      There is no email recovery. Remember your password; an admin can reset it for you.
                    </span>
                  </div>
                )}

                <form onSubmit={handleStudentSubmit} className="space-y-3.5">
                  <div>
                    <label
                      htmlFor="student-username"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Username
                    </label>
                    <div className="relative">
                      <input
                        ref={firstInputRef}
                        id="student-username"
                        type="text"
                        name="username"
                        autoComplete="username"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase())}
                        placeholder={studentMode === "signup" ? "e.g. adithya_k" : "your username"}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                      />
                    </div>
                    {studentMode === "signup" && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        3-20 lowercase characters, numbers or underscores.
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="student-password"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="student-password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        autoComplete={studentMode === "signup" ? "new-password" : "current-password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {studentMode === "signup" && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        8-72 characters. Spaces and paste allowed.
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>{studentMode === "signup" ? "Create Account" : "Sign In"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Admin Authentication */}
        {activeTab === "admin" && (
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-200 mb-1">
                <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Authorized Staff & Faculty</span>
              </div>
              <p className="text-[11px]">
                Enter the secret administrator access code to manage curriculum, uploads, and platform activities.
              </p>
            </div>

            <div>
              <label
                htmlFor="admin-access-code"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Access Code
              </label>
              <div className="relative">
                <input
                  ref={firstInputRef}
                  id="admin-access-code"
                  type={showPassword ? "text" : "password"}
                  name="code"
                  autoComplete="current-password"
                  required
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  placeholder="Enter administrator code"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={showPassword ? "Hide access code" : "Show access code"}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-slate-900 hover:bg-emerald-700 active:bg-emerald-800 dark:bg-slate-800 dark:hover:bg-emerald-600 transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Verify Administrator</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* "Continue as guest" dismiss button */}
        <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-medium transition-colors"
          >
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  );
}
