"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Search,
  X,
  BookOpen,
  Layers,
  PlayCircle,
  FileText,
  Loader2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { SearchResultItem } from "@/types";

export interface QuickSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickSearchDialog({ isOpen, onClose }: QuickSearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      setError(null);
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
        dialogRef.current.querySelectorAll<HTMLElement>(
          'input:not([disabled]), button:not([disabled]), a[href]'
        )
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
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setResults(Array.isArray(data) ? data : []);
        } else {
          setError("Failed to fetch academic results. Please try again.");
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.error("Search fetch error:", err);
          setError("An error occurred during search. Please check your network connection.");
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

  if (!isOpen || !mounted) return null;

  const subjects = results.filter((r) => r.type === "subject");
  const modules = results.filter((r) => r.type === "module");
  const lessons = results.filter((r) => r.type === "lesson");
  const materials = results.filter((r) => r.type === "material");

  const SUGGESTIONS = [
    "Maths",
    "Physics",
    "Engineering Graphics",
    "Electrical",
    "Calculus",
    "Data Structures",
    "MAT 101",
  ];

  const dialogContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search FOLE Curriculum"
      className="fixed inset-0 z-[9999] pointer-events-auto flex items-start justify-center pt-16 sm:pt-20 px-4 animate-in fade-in duration-150"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-2xl max-h-[calc(100dvh-2rem)] bg-white dark:bg-[#07140e] rounded-2xl border border-slate-200 dark:border-emerald-900/50 shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-emerald-950">
          <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            aria-label="Search FOLE curriculum"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search KTU subjects, modules, codes (e.g. MAT 101, Maths, Graphics)..."
            className="w-full bg-transparent text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin mr-2 shrink-0" />}
          {query.trim() && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors mr-1 cursor-pointer"
              aria-label="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {error ? (
            <div className="p-6 text-center text-xs text-red-600 dark:text-red-400 flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          ) : query.trim() === "" ? (
            <div className="p-6 text-center space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Type keywords or KTU course codes to search across lectures, modules, and subjects.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 mr-1">Popular:</span>
                {SUGGESTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setQuery(tag)}
                    className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-emerald-950/60 text-slate-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/60 border border-slate-200 dark:border-emerald-900/50 transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No academic results found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <div className="space-y-4">
              {/* SUBJECTS SECTION */}
              {subjects.length > 0 && (
                <div className="space-y-1">
                  <div className="px-3 pt-1 pb-1 text-[11px] font-mono font-semibold tracking-wider text-emerald-700 dark:text-emerald-400 uppercase flex items-center justify-between">
                    <span>Subjects</span>
                    <span className="text-[10px] text-slate-400">({subjects.length})</span>
                  </div>
                  {subjects.map((item) => (
                    <Link
                      key={`subject-${item.id}`}
                      href={item.url || "/subjects"}
                      onClick={onClose}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-emerald-950/40 transition-colors group cursor-pointer"
                    >
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                          {item.title}
                        </div>
                        {item.description && (
                          <div className="text-xs text-slate-400 dark:text-slate-400 truncate mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </div>
                      {item.code && (
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-emerald-950 text-slate-600 dark:text-emerald-300 shrink-0">
                          {item.code}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              {/* MODULES SECTION */}
              {modules.length > 0 && (
                <div className="space-y-1">
                  <div className="px-3 pt-1 pb-1 text-[11px] font-mono font-semibold tracking-wider text-emerald-700 dark:text-emerald-400 uppercase flex items-center justify-between">
                    <span>Modules</span>
                    <span className="text-[10px] text-slate-400">({modules.length})</span>
                  </div>
                  {modules.map((item) => (
                    <Link
                      key={`module-${item.id}`}
                      href={item.url || "/subjects"}
                      onClick={onClose}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-emerald-950/40 transition-colors group cursor-pointer"
                    >
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                          {item.title}
                        </div>
                        {item.subjectTitle && (
                          <div className="text-xs text-slate-400 dark:text-slate-400 truncate mt-0.5">
                            {item.subjectTitle}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-emerald-950 text-slate-600 dark:text-emerald-300 shrink-0">
                        Module
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {/* LECTURES SECTION */}
              {lessons.length > 0 && (
                <div className="space-y-1">
                  <div className="px-3 pt-1 pb-1 text-[11px] font-mono font-semibold tracking-wider text-emerald-700 dark:text-emerald-400 uppercase flex items-center justify-between">
                    <span>Lectures</span>
                    <span className="text-[10px] text-slate-400">({lessons.length})</span>
                  </div>
                  {lessons.map((item) => {
                    const breadcrumb =
                      item.subjectTitle && item.moduleTitle
                        ? `${item.subjectTitle} • ${item.moduleTitle}`
                        : item.subjectTitle || item.parentTitle || item.moduleTitle;

                    return (
                      <Link
                        key={`lesson-${item.id}`}
                        href={item.url || "/subjects"}
                        onClick={onClose}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-emerald-950/40 transition-colors group cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 shrink-0">
                          <PlayCircle className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                            {item.title}
                          </div>
                          {breadcrumb && (
                            <div className="text-xs text-slate-400 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                              <span>{breadcrumb}</span>
                              {item.instructor && <span>• {item.instructor}</span>}
                              {item.topicTitle && <span>• {item.topicTitle}</span>}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.duration_seconds && (
                            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                              <Clock className="w-3 h-3" />
                              {Math.round(item.duration_seconds / 60)}m
                            </span>
                          )}
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-emerald-950 text-slate-600 dark:text-emerald-300">
                            Lecture
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* STUDY MATERIALS SECTION */}
              {materials.length > 0 && (
                <div className="space-y-1">
                  <div className="px-3 pt-1 pb-1 text-[11px] font-mono font-semibold tracking-wider text-emerald-700 dark:text-emerald-400 uppercase flex items-center justify-between">
                    <span>Study Materials</span>
                    <span className="text-[10px] text-slate-400">({materials.length})</span>
                  </div>
                  {materials.map((item) => (
                    <Link
                      key={`material-${item.id}`}
                      href={item.url || "/materials"}
                      onClick={onClose}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-emerald-950/40 transition-colors group cursor-pointer"
                    >
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                          {item.title}
                        </div>
                        {item.subjectTitle && (
                          <div className="text-xs text-slate-400 dark:text-slate-400 truncate mt-0.5">
                            {item.subjectTitle}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-emerald-950 text-slate-600 dark:text-emerald-300 shrink-0">
                        {item.file_type || "Document"}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-[#050e09] border-t border-slate-100 dark:border-emerald-950/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Press ESC to exit</span>
          <Link
            href="/subjects"
            onClick={onClose}
            className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            Browse all subjects →
          </Link>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}
