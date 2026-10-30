"use client";

import React, { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";

interface WorksRegistrationCTAProps {
  feeAmount: number;
  currency: string;
  registrationUrl?: string | null;
  registrationOpensAt?: string | null;
  registrationClosesAt?: string | null;
}

export function WorksRegistrationCTA({
  feeAmount,
  currency,
  registrationUrl,
  registrationOpensAt,
  registrationClosesAt,
}: WorksRegistrationCTAProps) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
  }, []);

  const openTime = registrationOpensAt ? new Date(registrationOpensAt).getTime() : 0;
  const closeTime = registrationClosesAt ? new Date(registrationClosesAt).getTime() : 0;

  const isClosed = mounted && closeTime > 0 && now > closeTime;
  const isUpcoming = mounted && openTime > 0 && now < openTime;
  const canRegister = Boolean(registrationUrl && (!mounted || (!isClosed && !isUpcoming)));

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
          Registration Fee
        </span>
        <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
          {!feeAmount || feeAmount === 0
            ? "Free / Open"
            : `${currency || "INR"} ${feeAmount}`}
        </span>
      </div>

      {canRegister ? (
        <a
          href={registrationUrl!}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-all shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[48px]"
        >
          <span>Register for Activity</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      ) : isClosed ? (
        <div className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-center text-xs font-bold font-mono">
          Registration has Closed
        </div>
      ) : isUpcoming ? (
        <div className="w-full p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-center text-xs font-semibold">
          Registration will open soon
        </div>
      ) : (
        <div className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-center text-xs font-medium">
          No online form required. Attend as scheduled.
        </div>
      )}
    </div>
  );
}
