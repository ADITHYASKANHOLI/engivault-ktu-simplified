"use client";

import React, { useState } from "react";
import { Reorder, useDragControls } from "motion/react";
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Video as VideoIcon,
  Globe,
  EyeOff,
  User,
  Edit2,
  Trash2,
} from "lucide-react";
import { YoutubeIcon } from "@/components/icons/YoutubeIcon";
import { Lesson } from "@/types";
import {
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
  getYouTubeWatchUrl,
} from "@/lib/utils/youtube";

interface SortableLessonCardProps {
  lesson: Lesson;
  index: number;
  total: number;
  canReorder: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
  onDragEnd: () => void;
}

export function SortableLessonCard({
  lesson,
  index,
  total,
  canReorder,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  onDragEnd,
}: SortableLessonCardProps) {
  const dragControls = useDragControls();
  const [isItemDragging, setIsItemDragging] = useState(false);

  const rawUrl = lesson.youtube_url || lesson.youtubeUrl || null;
  const ytVideoId =
    lesson.youtube_video_id ||
    (rawUrl ? extractYouTubeVideoId(rawUrl) : null);
  const thumb =
    lesson.thumbnail_path ||
    (ytVideoId ? getYouTubeThumbnailUrl(ytVideoId, "default") : null);
  const tableWatchUrl = getYouTubeWatchUrl(ytVideoId || rawUrl);

  const displaySequence = index + 1;

  return (
    <Reorder.Item
      as="div"
      value={lesson}
      id={lesson.id}
      dragListener={false}
      dragControls={canReorder ? dragControls : undefined}
      onDragStart={() => setIsItemDragging(true)}
      onDragEnd={() => {
        setIsItemDragging(false);
        onDragEnd();
      }}
      className={`p-4 space-y-3 transition-colors border-b border-slate-100 ${
        isItemDragging
          ? "bg-blue-50/95 dark:bg-blue-950/70 shadow-2xl ring-2 ring-blue-500/30 z-50 rounded-xl"
          : "bg-white hover:bg-slate-50/70"
      }`}
      whileDrag={{
        scale: 1.02,
        boxShadow:
          "0 20px 25px -5px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        zIndex: 50,
      }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
    >
      {/* Top Bar with Drag Handle, Sequence Badge, and Status */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          {canReorder ? (
            <div
              onPointerDown={(e) => {
                e.preventDefault();
                dragControls.start(e);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 active:cursor-grabbing cursor-grab touch-none select-none transition-colors"
              title="Click and drag to reorder video"
              role="button"
              tabIndex={0}
              aria-label={`Drag handle for ${lesson.title}. Current sequence position: ${displaySequence} of ${total}`}
              onKeyDown={(e) => {
                if (e.altKey && e.key === "ArrowUp") {
                  e.preventDefault();
                  onMoveUp();
                } else if (e.altKey && e.key === "ArrowDown") {
                  e.preventDefault();
                  onMoveDown();
                }
              }}
            >
              <GripVertical className="w-4 h-4" />
            </div>
          ) : (
            <div
              className="p-1.5 rounded-lg text-slate-300 cursor-not-allowed select-none"
              title="Select a specific module to enable drag-and-drop reordering"
            >
              <GripVertical className="w-4 h-4 opacity-40" />
            </div>
          )}

          {canReorder && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onMoveUp}
                disabled={index === 0}
                className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                title="Move up"
                aria-label={`Move ${lesson.title} up to position ${displaySequence - 1}`}
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={index === total - 1}
                className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                title="Move down"
                aria-label={`Move ${lesson.title} down to position ${displaySequence + 1}`}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              isItemDragging
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            #{displaySequence}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {lesson.published ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Globe className="w-2.5 h-2.5" />
              Published
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
              <EyeOff className="w-2.5 h-2.5" />
              Draft
            </span>
          )}
        </div>
      </div>

      {/* Main Content: Thumbnail & Title */}
      <div className="flex items-start gap-3">
        <div className="w-16 h-11 rounded-lg overflow-hidden shrink-0 bg-slate-900 relative border border-slate-200 shadow-xs">
          {thumb ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={thumb}
              alt={lesson.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              <VideoIcon className="w-4 h-4" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-900 text-sm leading-snug break-words">
            {lesson.title}
          </h3>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Lec #{displaySequence}
          </div>
        </div>
      </div>

      {/* Academic Context */}
      <div className="text-xs text-slate-600 space-y-0.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
        <div className="font-semibold text-slate-900 truncate">
          {lesson.module?.subject?.title || "Subject"}
        </div>
        <div className="text-[11px] text-slate-500 truncate">
          {lesson.module?.title || "Module"}
          {lesson.topic && ` • Topic: ${lesson.topic.title}`}
        </div>
        {(lesson.instructor || lesson.faculty?.name) && (
          <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-0.5">
            <User className="w-3 h-3 text-slate-400" />
            <span>{lesson.instructor || lesson.faculty?.name}</span>
          </div>
        )}
      </div>

      {/* Mobile Actions with touch target compliance (>= 44px) */}
      <div className="flex items-center gap-2 pt-1">
        {tableWatchUrl && (
          <a
            href={tableWatchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-11 px-3 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
          >
            <YoutubeIcon className="w-4 h-4 text-red-600" />
            <span>YouTube</span>
          </a>
        )}

        <button
          type="button"
          onClick={() => onEdit(lesson)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-11 px-3 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
          <span>Edit</span>
        </button>

        <button
          type="button"
          onClick={() => onDelete(lesson)}
          className="w-11 h-11 inline-flex items-center justify-center rounded-xl text-red-600 bg-red-50 hover:bg-red-100 transition-colors shrink-0"
          aria-label={`Delete ${lesson.title}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </Reorder.Item>
  );
}

