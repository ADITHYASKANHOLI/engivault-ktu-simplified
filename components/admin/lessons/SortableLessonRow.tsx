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
import { formatDuration } from "@/lib/utils";
import {
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
  getYouTubeWatchUrl,
} from "@/lib/utils/youtube";

interface SortableLessonRowProps {
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

export function SortableLessonRow({
  lesson,
  index,
  total,
  canReorder,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  onDragEnd,
}: SortableLessonRowProps) {
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
      as="tr"
      value={lesson}
      id={lesson.id}
      dragListener={false}
      dragControls={canReorder ? dragControls : undefined}
      onDragStart={() => setIsItemDragging(true)}
      onDragEnd={() => {
        setIsItemDragging(false);
        onDragEnd();
      }}
      className={`transition-colors border-b border-slate-100 ${
        isItemDragging
          ? "bg-blue-50/95 dark:bg-blue-950/70 shadow-xl ring-2 ring-blue-500/30 z-50 relative"
          : "hover:bg-slate-50/70 bg-white"
      }`}
      whileDrag={{
        scale: 1.01,
        boxShadow:
          "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        zIndex: 50,
      }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
    >
      {/* 1. Drag Handle & Sequence Column */}
      <td className="p-3.5 pl-4 whitespace-nowrap">
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

          {/* Quick accessible move buttons */}
          {canReorder && (
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={onMoveUp}
                disabled={index === 0}
                className="p-0.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                title="Move up"
                aria-label={`Move ${lesson.title} up to position ${displaySequence - 1}`}
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={index === total - 1}
                className="p-0.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                title="Move down"
                aria-label={`Move ${lesson.title} down to position ${displaySequence + 1}`}
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          )}

          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ml-1 ${
              isItemDragging
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            #{displaySequence}
          </span>
        </div>
      </td>

      {/* 2. Lecture Column (Thumbnail, Title, Duration) */}
      <td className="p-4 font-bold text-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-12 h-8 rounded-lg overflow-hidden shrink-0 bg-slate-900 relative border border-slate-200 shadow-xs">
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
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                Lec #{displaySequence}
              </span>
              <span className="font-semibold text-slate-900 hover:text-blue-700 line-clamp-1">
                {lesson.title}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              {formatDuration(lesson.duration_seconds || 1200)}
            </div>
          </div>
        </div>
      </td>

      {/* 3. Academic Hierarchy */}
      <td className="p-4 text-slate-600">
        <div className="space-y-0.5">
          <div className="font-semibold text-slate-800">
            {lesson.module?.subject?.title || "Subject"}
          </div>
          <div className="text-[11px] text-slate-500">
            {lesson.module?.title || "Module"}
          </div>
          {lesson.topic && (
            <div className="text-[10px] text-blue-700 font-medium">
              Topic: {lesson.topic.title}
            </div>
          )}
        </div>
      </td>

      {/* 4. Faculty / Instructor */}
      <td className="p-4 text-slate-700">
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-slate-800">
            {lesson.instructor || lesson.faculty?.name || "Faculty Instructor"}
          </span>
        </div>
      </td>

      {/* 5. Video Status */}
      <td className="p-4 whitespace-nowrap">
        {ytVideoId ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-red-50 text-red-700 border border-red-200">
            <YoutubeIcon className="w-3.5 h-3.5 text-red-600" />
            <span>YOUTUBE LINKED</span>
          </span>
        ) : lesson.video ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
            MP4 ATTACHED
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
            NO VIDEO
          </span>
        )}
      </td>

      {/* 6. Published Status */}
      <td className="p-4 whitespace-nowrap">
        {lesson.published ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Globe className="w-3 h-3 text-emerald-600" />
            Published
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
            <EyeOff className="w-3 h-3 text-slate-400" />
            Draft
          </span>
        )}
      </td>

      {/* 7. Updated Date */}
      <td className="p-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
        {new Date(lesson.updated_at).toLocaleDateString()}
      </td>

      {/* 8. Actions (Keep strictly separate from drag handle) */}
      <td className="p-4 text-right space-x-1 whitespace-nowrap">
        {tableWatchUrl && (
          <a
            href={tableWatchUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Watch video lecture on YouTube (opens new tab)"
            className="inline-flex items-center gap-1 p-2 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 font-bold transition-colors"
          >
            <YoutubeIcon className="w-3.5 h-3.5 text-red-600" />
          </a>
        )}

        <button
          type="button"
          onClick={() => onEdit(lesson)}
          title="Edit lecture metadata"
          className="p-2 rounded-lg text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(lesson)}
          title="Delete lecture"
          className="p-2 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>
    </Reorder.Item>
  );
}

