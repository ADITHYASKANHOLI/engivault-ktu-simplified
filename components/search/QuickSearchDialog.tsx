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
  ArrowRight,
  AlertCircle,
  GraduationCap,
  Clock,
  User,
} from "lucide-react";
import { SearchResultItem } from "@/types";

export interface QuickSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_SUGGESTIONS = [
  "Maths",
  "Engineering Graphics",
  "Electrical",
  "Calculus",
  "Data Structures",
  "Laplace",
];

export function QuickSearchDialog({ isOpen, onClose }: QuickSearchDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Hydration safety for createPortal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset and auto-focus when opened
  useEffect(() => {
    if (isOpen) {
      if (document.activeElement && document.activeElement !== document.body) {
        previousFocusRef.current = document.activeElement as HTMLElement;
      }
      const timer = setTimeout(() => inputRef.current?.focus(), 60);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalOverflow;
        previousFocusRef.current?.focus();
      };
    } else {
      setQuery("");
      setResults([]);
      setError(null);
    }
  }, [isOpen]);

  // Handle Escape key
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

  // Trap focus inside modal
  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'input:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
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

  // Debounced search with AbortController
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
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
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setResults(Array.isArray(data) ? data : []);
        } else {
          setError("Failed to load academic search results. Please try again.");
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.error("Search fetch error:", err);
          setError("A network error occurred while searching. Please check your connection.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  if (!isOpen || !mounted) return null;

  // Group results by academic content type
  const subjects = results.filter((r) => r.type === "subject");
  const modules = results.filter((r) => r.type === "module");
  const lectures = results.filter((r) => r.type === "lesson");
  const materials = results.filter((r) => r.type === "material");

  const totalResults = results.length;

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setError(null);
    inputRef.current?.focus();
  };

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return null;
    const mins = Math.round(seconds / 60);
    return `${mins} min${mins === 1 ? "" : "s"}`;
  };

  const dialogContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search FOLE Curriculum"
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 sm:pt-20 px-3 sm:px-4 pointer-events-auto select-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 pointer-events-auto cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-3xl max-h-[calc(100dvh-5rem)] bg-[#f7f6ef] border border-[#dce2da] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-150 pointer-events-auto"
      >
        {/* Search Input Header */}
        <div className="flex items-center px-4 sm:px-6 py-4 border-b border-[#dce2da] bg-white gap-3 shrink-0">
          <Search className="w-5 h-5 text-[#176b45] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            aria-label="Search FOLE curriculum"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subjects, modules, codes (e.g. Maths, Graphics, MAT 101)..."
            className="w-full bg-transparent text-sm sm:text-base text-[#17231c] placeholder:text-[#89958c] focus:outline-none pointer-events-auto select-auto font-medium"
          />
          {loading && <Loader2 className="w-4 h-4 text-[#176b45] animate-spin shrink-0" />}
          {query.trim() && (
            <button
              type="button"
              onClick={handleClear}
              className="w-8 h-8 flex items-center justify-center text-[#89958c] hover:text-[#17231c] hover:bg-[#edf2ec] transition-colors cursor-pointer pointer-events-auto"
              aria-label="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="h-5 w-px bg-[#dce2da] hidden sm:block" />
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-[#89958c] hover:text-[#17231c] hover:bg-[#edf2ec] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176b45] cursor-pointer pointer-events-auto shrink-0"
            aria-label="Close search"
          >
            <span className="text-xs font-mono font-semibold hidden sm:inline mr-1">ESC</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Area */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">
          {/* Empty Query State */}
          {!query.trim() && (
            <div className="py-8 px-4 text-center space-y-4">
              <div className="w-12 h-12 bg-[#edf2ec] border border-[#dce2da] mx-auto flex items-center justify-center text-[#176b45]">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-semibold text-[#17231c]">
                  Search FOLE Engineering Curriculum
                </h3>
                <p className="text-xs text-[#5b675f] leading-relaxed">
                  Search across subjects, syllabus modules, video lectures, and study notes. Type any topic, subject title, or KTU course code.
                </p>
              </div>

              {/* Quick suggestion tags */}
              <div className="pt-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#89958c] block mb-2">
                  Popular Academic Queries
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto">
                  {POPULAR_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1.5 text-xs font-medium border border-[#dce2da] bg-white text-[#17231c] hover:border-[#176b45] hover:text-[#176b45] hover:bg-[#f2f6f1] transition-colors cursor-pointer pointer-events-auto"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div
              role="alert"
              className="p-4 border border-red-200 bg-red-50 text-red-800 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{error}</p>
                <button
                  type="button"
                  onClick={() => setQuery((q) => q + " ")}
                  className="mt-2 text-xs font-bold underline text-red-900 hover:text-red-700 cursor-pointer pointer-events-auto"
                >
                  Retry Search
                </button>
              </div>
            </div>
          )}

          {/* No Results State */}
          {query.trim() && !loading && !error && totalResults === 0 && (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-10 h-10 border border-[#dce2da] bg-white mx-auto flex items-center justify-center text-[#89958c]">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-[#17231c]">
                No academic matches found for &ldquo;{query}&rdquo;
              </h3>
              <p className="text-xs text-[#5b675f] max-w-md mx-auto leading-relaxed">
                Try searching by common KTU course codes (e.g. <span className="font-mono font-semibold">MAT 101</span>, <span className="font-mono font-semibold">EST 110</span>), subject names (e.g. <span className="font-semibold">Calculus</span>, <span className="font-semibold">Graphics</span>), or faculty members.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-2">
                {POPULAR_SUGGESTIONS.slice(0, 4).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleSuggestionClick(item)}
                    className="text-xs px-2.5 py-1 border border-[#dce2da] bg-white text-[#176b45] hover:bg-[#edf2ec] transition-colors cursor-pointer pointer-events-auto"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GROUPED RESULTS SECTIONS */}
          {query.trim() && totalResults > 0 && (
            <div className="space-y-6">
              {/* SECTION 1: SUBJECTS */}
              {subjects.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#dce2da] pb-1.5 text-xs font-mono font-bold tracking-wider text-[#176b45] uppercase">
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Subjects ({subjects.length})</span>
                    </span>
                    <span className="text-[10px] text-[#89958c] font-normal lowercase font-sans">
                      syllabus & modules
                    </span>
                  </div>
                  <div className="divide-y divide-[#e5eae3] border border-[#dce2da] bg-white">
                    {subjects.map((item) => (
                      <Link
                        key={`subject-${item.id}`}
                        href={item.url}
                        onClick={onClose}
                        className="flex items-start justify-between p-3.5 sm:p-4 hover:bg-[#f2f6f1] transition-colors group cursor-pointer pointer-events-auto"
                      >
                        <div className="space-y-1 min-w-0 flex-1 pr-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-[#17231c] group-hover:text-[#176b45] transition-colors">
                              {item.title}
                            </span>
                            {item.code && (
                              <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-[#edf2ec] text-[#176b45] border border-[#dce2da]">
                                {item.code}
                              </span>
                            )}
                            {item.semester && (
                              <span className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 text-[#5b675f]">
                                S{item.semester}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-[#5b675f] line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-[#176b45] shrink-0 pt-0.5">
                          <span className="hidden sm:inline">Explore</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 2: MODULES */}
              {modules.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#dce2da] pb-1.5 text-xs font-mono font-bold tracking-wider text-[#176b45] uppercase">
                    <span className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Syllabus Modules ({modules.length})</span>
                    </span>
                    <span className="text-[10px] text-[#89958c] font-normal lowercase font-sans">
                      course units
                    </span>
                  </div>
                  <div className="divide-y divide-[#e5eae3] border border-[#dce2da] bg-white">
                    {modules.map((item) => (
                      <Link
                        key={`module-${item.id}`}
                        href={item.url}
                        onClick={onClose}
                        className="flex items-start justify-between p-3.5 sm:p-4 hover:bg-[#f2f6f1] transition-colors group cursor-pointer pointer-events-auto"
                      >
                        <div className="space-y-1 min-w-0 flex-1 pr-3">
                          <div className="text-[11px] text-[#89958c] font-medium flex items-center gap-1.5">
                            <span className="text-[#176b45] font-semibold">{item.subjectTitle || "Subject"}</span>
                            {item.semester && <span>• S{item.semester}</span>}
                          </div>
                          <h4 className="text-sm font-semibold text-[#17231c] group-hover:text-[#176b45] transition-colors">
                            {item.title}
                          </h4>
                          {item.description && (
                            <p className="text-xs text-[#5b675f] line-clamp-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-[#176b45] shrink-0 pt-0.5">
                          <span className="hidden sm:inline">View Unit</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 3: LECTURES (The Primary Asset) */}
              {lectures.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#dce2da] pb-1.5 text-xs font-mono font-bold tracking-wider text-[#176b45] uppercase">
                    <span className="flex items-center gap-2">
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Academic Video Lectures ({lectures.length})</span>
                    </span>
                    <span className="text-[10px] text-[#89958c] font-normal lowercase font-sans">
                      classes & recordings
                    </span>
                  </div>
                  <div className="divide-y divide-[#e5eae3] border border-[#dce2da] bg-white">
                    {lectures.map((item) => (
                      <Link
                        key={`lecture-${item.id}`}
                        href={item.url}
                        onClick={onClose}
                        className="flex items-start justify-between p-3.5 sm:p-4 hover:bg-[#f2f6f1] transition-colors group cursor-pointer pointer-events-auto"
                      >
                        <div className="space-y-1 min-w-0 flex-1 pr-3">
                          {/* Academic Context Breadcrumb */}
                          <div className="text-[11px] text-[#89958c] font-medium flex items-center gap-1.5 flex-wrap">
                            <span className="text-[#176b45] font-semibold">
                              {item.subjectTitle || "Subject"}
                            </span>
                            {item.moduleTitle && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[220px]">{item.moduleTitle}</span>
                              </>
                            )}
                            {item.topicTitle && (
                              <>
                                <span>•</span>
                                <span className="text-slate-500 truncate max-w-[180px]">{item.topicTitle}</span>
                              </>
                            )}
                          </div>

                          {/* Lecture Title */}
                          <h4 className="text-sm font-semibold text-[#17231c] group-hover:text-[#176b45] transition-colors">
                            {item.title}
                          </h4>

                          {/* Extra Metadata: Instructor, Duration */}
                          <div className="flex items-center gap-3 pt-0.5 text-[11px] text-[#5b675f] flex-wrap">
                            {item.instructor && (
                              <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                                <User className="w-3 h-3 text-[#176b45]" />
                                {item.instructor}
                              </span>
                            )}
                            {item.duration_seconds && (
                              <span className="inline-flex items-center gap-1 font-mono text-[#89958c]">
                                <Clock className="w-3 h-3" />
                                {formatDuration(item.duration_seconds)}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-mono bg-red-50 text-red-700 border border-red-200">
                              YouTube Video
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs font-semibold text-[#176b45] shrink-0 pt-0.5">
                          <span className="hidden sm:inline">Watch</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 4: STUDY MATERIALS */}
              {materials.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#dce2da] pb-1.5 text-xs font-mono font-bold tracking-wider text-[#176b45] uppercase">
                    <span className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Study Materials & Notes ({materials.length})</span>
                    </span>
                    <span className="text-[10px] text-[#89958c] font-normal lowercase font-sans">
                      notes & papers
                    </span>
                  </div>
                  <div className="divide-y divide-[#e5eae3] border border-[#dce2da] bg-white">
                    {materials.map((item) => (
                      <Link
                        key={`material-${item.id}`}
                        href={item.url}
                        onClick={onClose}
                        className="flex items-start justify-between p-3.5 sm:p-4 hover:bg-[#f2f6f1] transition-colors group cursor-pointer pointer-events-auto"
                      >
                        <div className="space-y-1 min-w-0 flex-1 pr-3">
                          <div className="text-[11px] text-[#89958c] font-medium flex items-center gap-1.5">
                            {item.subjectTitle && (
                              <span className="text-[#176b45] font-semibold">{item.subjectTitle}</span>
                            )}
                            {item.moduleTitle && <span>• {item.moduleTitle}</span>}
                          </div>
                          <h4 className="text-sm font-semibold text-[#17231c] group-hover:text-[#176b45] transition-colors">
                            {item.title}
                          </h4>
                          {item.description && (
                            <p className="text-xs text-[#5b675f] line-clamp-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-[#176b45] shrink-0 pt-0.5">
                          <span className="hidden sm:inline">Download</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dialog Footer */}
        <div className="px-4 sm:px-6 py-3 bg-[#edf2ec] border-t border-[#dce2da] flex items-center justify-between text-xs text-[#5b675f] shrink-0 font-medium">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#176b45]" />
            <span>
              {totalResults > 0
                ? `${totalResults} academic asset${totalResults === 1 ? "" : "s"} found`
                : "Free Open Learning & Education"}
            </span>
          </div>
          <Link
            href="/subjects"
            onClick={onClose}
            className="text-xs font-semibold text-[#176b45] hover:text-[#105437] transition-colors flex items-center gap-1 cursor-pointer pointer-events-auto"
          >
            <span>Full Curriculum Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}
