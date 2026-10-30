"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { EngivaultLogo } from "@/components/branding/EngivaultLogo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid access code");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(data.redirectUrl || "/admin/dashboard");
      }, 500);
    } catch {
      setError("An unexpected network error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#10291f] text-white relative overflow-hidden">
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <EngivaultLogo variant="full" size="lg" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">Administrator Access</h1>
          <p className="text-xs text-slate-400">
            Enter your Admin Access Code to manage curriculum and study media.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#163b2b] border border-[#315a46] rounded-md p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800/80 text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/80 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>Authorization verified. Redirecting to Dashboard...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">
                Admin Access Code
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                <input
                  type="password"
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter Admin Access Code"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#426451] bg-[#10291f] text-sm text-white font-mono tracking-wider placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success || !code.trim()}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#176b45] hover:bg-[#105437] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Verifying access code...</span>
              ) : (
                <>
                  <span>Authenticate Session</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Information */}
          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Security Information</span>
            </div>
            <p className="leading-relaxed">
              Administrator authentication requires the secure access code configured in your server environment variables (<code className="text-emerald-300 font-mono px-1 py-0.5 bg-slate-800 rounded">ADMIN_ACCESS_CODE</code>).
            </p>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-300 transition-colors">
            ← Return to public website
          </Link>
        </div>
      </div>
    </div>
  );
}
