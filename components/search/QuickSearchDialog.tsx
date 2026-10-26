"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, X, BookOpen, Layers, PlayCircle, Loader2 } from "lucide-react";

interface SearchResultItem {
  id: string;
  title: string;
  type: "subject" | "module" | "lesson";
  url: string;
  parentTitle?: string;
  code?: string;
}

export interface QuickSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickSearchDialog({ isOpen, onClose }: QuickSearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalOverflow;
      };
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>('input:not([disabled]), button:not([disabled]), a[href]')
      ).filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleTab);
    return () => window.removeEventListener("keydown", handleTab);
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setResults(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.error("Search fetch error:", err);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search FOLE Curriculum"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150"
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div ref={dialogRef} className="relative z-10 w-full max-w-2xl max-h-[calc(100dvh-2rem)] bg-white dark:bg-[#07140e] rounded-2xl border border-slate-200 dark:border-emerald-900/50 shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-emerald-950">
          <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            aria-label="Search FOLE curriculum"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search KTU subjects, modules, codes (e.g. MAT 101, Calculus)..."
            className="w-full bg-transparent text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin mr-2" />}
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {query.trim() === "" ? (
            <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
              Type keywords or KTU course codes to search across lectures and subjects.
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No academic results found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.url || "/subjects"}
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-emerald-950/40 transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                    {item.type === "subject" && <BookOpen className="w-4 h-4" />}
                    {item.type === "module" && <Layers className="w-4 h-4" />}
                    {item.type === "lesson" && <PlayCircle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      {item.title}
                    </div>
                    {item.parentTitle && (
                      <div className="text-xs text-slate-400 truncate">{item.parentTitle}</div>
                    )}
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-emerald-950 text-slate-600 dark:text-emerald-300">
                    {item.code || item.type}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-[#050e09] border-t border-slate-100 dark:border-emerald-950/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Press ESC to exit</span>
          <Link
            href="/subjects"
            onClick={onClose}
            className="text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Browse all subjects →
          </Link>
        </div>
      </div>
    </div>
  );
}
