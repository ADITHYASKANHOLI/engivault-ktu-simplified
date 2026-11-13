"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import {
  Box,
  ChevronDown,
  Crosshair,
  Download,
  DraftingCompass,
  Grid3X3,
  Move,
  MousePointer2,
  RotateCcw,
  Ruler,
  Scissors,
  Settings2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { createSolidGeometry, intersectGeometryWithPlane, rotateGeometry } from "@/lib/engineering-graphics/geometry";
import { formatMm, projectPoint, projectedBounds } from "@/lib/engineering-graphics/projections";
import { fitBounds, MAX_ZOOM, MIN_ZOOM, zoomAt, zoomLabel } from "@/lib/engineering-graphics/viewport";
import type { ProjectionKind, SolidSpec, SolidType, ViewportState } from "@/lib/engineering-graphics/types";

type Workspace = "single" | "multi" | "section";
type Tool = "select" | "pan" | "measure";

const solidOptions: Array<{ value: SolidType; label: string }> = [
  { value: "prism", label: "Regular prism" },
  { value: "pyramid", label: "Regular pyramid" },
  { value: "cylinder", label: "Cylinder" },
  { value: "cone", label: "Cone" },
  { value: "cuboid", label: "Cuboid" },
  { value: "cube", label: "Cube" },
];

const viewOptions: Array<{ value: ProjectionKind; label: string }> = [
  { value: "front", label: "Front" },
  { value: "top", label: "Top" },
  { value: "side", label: "Side" },
  { value: "isometric", label: "Isometric" },
];

function NumberInput({
  label,
  value,
  onChange,
  min = 1,
  max = 1000,
  step = 1,
  suffix = "mm",
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-400">
        {label}
        <span className="font-mono text-[9px] font-normal text-slate-600">{suffix}</span>
      </span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(event) => {
          const parsed = Number(event.target.value);
          if (Number.isFinite(parsed)) onChange(Math.max(min, Math.min(max, parsed)));
        }}
        className="h-9 w-full rounded-lg border border-white/10 bg-[#0b1210] px-2.5 font-mono text-xs text-slate-100 outline-none transition focus:border-emerald-400/70 disabled:cursor-not-allowed disabled:opacity-35"
      />
    </label>
  );
}

function gridInterval(zoom: number): number {
  const intervals = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
  return intervals.find((interval) => interval * zoom >= 32) ?? 5000;
}

function ProjectionPane({
  title,
  kind,
  vertices,
  edges,
  sectionPoints,
  tool,
  showGrid,
  onMeasure,
  compact = false,
}: {
  title: string;
  kind: ProjectionKind;
  vertices: ReturnType<typeof projectPoint>[];
  edges: Array<[number, number]>;
  sectionPoints?: ReturnType<typeof projectPoint>[];
  tool: Tool;
  showGrid: boolean;
  onMeasure: (length: number) => void;
  compact?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number; pointerId: number } | null>(null);
  const [size, setSize] = useState({ width: 720, height: 480 });
  const [viewport, setViewport] = useState<ViewportState>({ zoom: 2.2, panX: 0, panY: 0 });
  const [selectedEdge, setSelectedEdge] = useState<number | null>(null);
  const projectedLimits = useMemo(() => projectedBounds(vertices), [vertices]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect && rect.width > 0 && rect.height > 0) {
        setSize({ width: rect.width, height: rect.height });
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (size.width > 0 && size.height > 0) {
      setViewport(fitBounds(projectedLimits, size.width, size.height, compact ? 54 : 84));
    }
  }, [projectedLimits, size.width, size.height, compact]);

  const handleWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cursor = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const factor = Math.exp(-event.deltaY * 0.00125);
    setViewport((previous) => zoomAt(previous, cursor, factor, size.width, size.height));
  }, [size.height, size.width]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (tool !== "pan" && event.button !== 1 && !event.shiftKey) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      panX: viewport.panX,
      panY: viewport.panY,
      pointerId: event.pointerId,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current && dragRef.current.pointerId === event.pointerId) {
      const drag = dragRef.current;
      setViewport((previous) => ({
        ...previous,
        panX: drag.panX + event.clientX - drag.x,
        panY: drag.panY + event.clientY - drag.y,
      }));
      return;
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
  };

  const fit = () => setViewport(fitBounds(projectedLimits, size.width, size.height, compact ? 54 : 84));
  const zoomBy = (factor: number) => {
    setViewport((previous) => zoomAt(previous, { x: size.width / 2, y: size.height / 2 }, factor, size.width, size.height));
  };

  const spacing = gridInterval(viewport.zoom);
  const lineCursor = tool === "pan" ? "grab" : tool === "measure" ? "crosshair" : "default";
  const transform = "translate(" + (size.width / 2 + viewport.panX) + " " + (size.height / 2 + viewport.panY) + ") scale(" + viewport.zoom + " " + -viewport.zoom + ")";

  return (
    <section className={"flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#080e0c] " + (compact ? "min-h-[240px]" : "h-full")}>
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/[0.07] bg-[#0d1511] px-3">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => zoomBy(1 / 1.25)} className="rounded p-1 text-slate-500 hover:bg-white/5 hover:text-white" aria-label="Zoom out">
            <ZoomOut size={13} />
          </button>
          <span className="min-w-[42px] text-center font-mono text-[9px] text-slate-500">{zoomLabel(viewport.zoom)}</span>
          <input aria-label="Viewport zoom percentage" type="range" min={MIN_ZOOM * 100} max={MAX_ZOOM * 100} step={5} value={Math.round(viewport.zoom * 100)} onChange={(event) => { const targetZoom = Number(event.target.value) / 100; setViewport((previous) => zoomAt(previous, { x: size.width / 2, y: size.height / 2 }, targetZoom / previous.zoom, size.width, size.height)); }} className="hidden h-1 w-20 cursor-pointer accent-emerald-400 sm:block" />
          <button type="button" onClick={() => zoomBy(1.25)} className="rounded p-1 text-slate-500 hover:bg-white/5 hover:text-white" aria-label="Zoom in">
            <ZoomIn size={13} />
          </button>
          <button type="button" onClick={fit} className="ml-1 rounded p-1 text-slate-500 hover:bg-white/5 hover:text-emerald-300" aria-label="Fit drawing">
            <Crosshair size={13} />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative min-h-0 flex-1 touch-none overflow-hidden"
        style={{ cursor: lineCursor }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={"0 0 " + size.width + " " + size.height}
          role="img"
          aria-label={title + " engineering projection"}
          className="absolute inset-0 select-none"
        >
          <defs>
            <pattern id={"draft-grid-" + kind + (compact ? "-small" : "-large")} width={spacing * viewport.zoom} height={spacing * viewport.zoom} patternUnits="userSpaceOnUse" patternTransform={"translate(" + (size.width / 2 + viewport.panX) + " " + (size.height / 2 + viewport.panY) + ")"}>
              <path d={"M " + spacing * viewport.zoom + " 0 L 0 0 0 " + spacing * viewport.zoom} fill="none" stroke="#20352b" strokeWidth="0.7" />
            </pattern>
          </defs>
          <rect width={size.width} height={size.height} fill="#080e0c" />
          {showGrid && <rect width={size.width} height={size.height} fill={"url(#draft-grid-" + kind + (compact ? "-small" : "-large") + ")"} />}
          <g transform={transform}>
            <line x1={-100000} y1={0} x2={100000} y2={0} stroke="#315441" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <line x1={0} y1={-100000} x2={0} y2={100000} stroke="#315441" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            {edges.map(([startIndex, endIndex], index) => {
              const start = vertices[startIndex];
              const end = vertices[endIndex];
              if (!start || !end) return null;
              const isSelected = selectedEdge === index;
              return (
                <line
                  key={"edge-" + index}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={isSelected ? "#f5c76d" : "#78d9a4"}
                  strokeWidth={isSelected ? 2.5 : 1.65}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  onClick={() => {
                    setSelectedEdge(index);
                    if (tool === "measure") {
                      onMeasure(Math.hypot(end.x - start.x, end.y - start.y));
                    }
                  }}
                  className="cursor-pointer"
                />
              );
            })}
            {sectionPoints && sectionPoints.length > 2 && (
              <polygon
                points={sectionPoints.map((point) => point.x + "," + point.y).join(" ")}
                fill="rgba(245,166,35,0.10)"
                stroke="#f5a623"
                strokeWidth="2.1"
                strokeDasharray="5 3"
                vectorEffect="non-scaling-stroke"
              />
            )}
            <circle cx={0} cy={0} r={2.2} fill="#f5a623" vectorEffect="non-scaling-stroke" />
          </g>
        </svg>
        <div className="pointer-events-none absolute bottom-2 left-3 flex items-center gap-2 font-mono text-[9px] text-slate-600">
          <span>GRID {spacing} mm</span>
          <span className="text-slate-800">·</span>
          <span>{kind === "isometric" ? "ISOMETRIC AXONOMETRIC VIEW" : "ORTHOGRAPHIC PROJECTION"}</span>
        </div>
        <div className="absolute right-2 top-2 flex gap-1">
          <button type="button" onClick={() => setViewport((previous) => ({ ...previous, panX: 0, panY: 0 }))} className="rounded-md border border-white/10 bg-[#101a15]/90 px-2 py-1 text-[9px] text-slate-500 hover:text-white">
            Centre
          </button>
        </div>
      </div>
    </section>
  );
}

export function EngineeringGraphicsStudio() {
  const [solid, setSolid] = useState<SolidType>("prism");
  const [base, setBase] = useState(60);
  const [depth, setDepth] = useState(40);
  const [height, setHeight] = useState(80);
  const [sides, setSides] = useState(6);
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [projection, setProjection] = useState<ProjectionKind>("isometric");
  const [workspace, setWorkspace] = useState<Workspace>("single");
  const [tool, setTool] = useState<Tool>("select");
  const [showGrid, setShowGrid] = useState(true);
  const [cutAngle, setCutAngle] = useState(0);
  const [cutOffset, setCutOffset] = useState(40);
  const [measureMessage, setMeasureMessage] = useState("Select Measure, then click an edge");
  const [showProperties, setShowProperties] = useState(true);

  const spec = useMemo<SolidSpec>(() => ({
    type: solid,
    base,
    depth,
    height: solid === "cube" ? base : height,
    sides,
    segments: 48,
  }), [solid, base, depth, height, sides]);

  const geometry = useMemo(() => {
    const raw = createSolidGeometry(spec);
    return rotateGeometry(raw, rotationX, rotationY);
  }, [spec, rotationX, rotationY]);

  const projected = useMemo(() => ({
    front: geometry.vertices.map((point) => projectPoint(point, "front")),
    top: geometry.vertices.map((point) => projectPoint(point, "top")),
    side: geometry.vertices.map((point) => projectPoint(point, "side")),
    isometric: geometry.vertices.map((point) => projectPoint(point, "isometric")),
  }), [geometry]);

  const cutRadians = (cutAngle * Math.PI) / 180;
  const section3D = useMemo(() => intersectGeometryWithPlane(
    geometry,
    { x: Math.sin(cutRadians), y: 0, z: Math.cos(cutRadians) },
    cutOffset
  ), [geometry, cutRadians, cutOffset]);

  const sectionCount = section3D.length;

  const updateCutOffset = (value: number) => setCutOffset(value);
  const saveProject = () => {
    const project = {
      format: "FOLE-DraftLab",
      version: 1,
      createdAt: new Date().toISOString(),
      spec,
      orientation: { rotationX, rotationY },
      viewportPreferences: { projection, workspace, showGrid },
    };
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "fole-draftlab-project.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const selectedLabel = solidOptions.find((option) => option.value === solid)?.label ?? "Solid";

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#070d0a] pb-12 pt-28 text-slate-100">
      <div className="mx-auto max-w-[1800px] px-3 sm:px-5 lg:px-7">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-emerald-400">
              <DraftingCompass size={13} /> FOLE ENGINEERING TOOLS <span className="text-slate-700">/</span> PRECISION WORKSPACE
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">DraftLab</h1>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-emerald-300">Geometry preview</span>
            </div>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
              A precision-first workspace for engineering projections. Model dimensions stay independent of viewport zoom.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { setRotationX(0); setRotationY(0); }} className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[11px] font-medium text-slate-300 hover:bg-white/[0.07]">
              <RotateCcw size={13} /> Reset orientation
            </button>
            <button type="button" onClick={saveProject} className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-500 px-3 text-[11px] font-bold text-[#03140b] transition hover:bg-emerald-400">
              <Download size={13} /> Export project
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b120f] shadow-[0_28px_100px_rgba(0,0,0,.35)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] bg-[#0e1712] px-3 py-2.5 sm:px-4">
            <div className="flex flex-wrap items-center gap-1">
              <button type="button" onClick={() => setTool("select")} className={"flex h-8 items-center gap-2 rounded-md px-2.5 text-[10px] font-semibold " + (tool === "select" ? "bg-emerald-400/15 text-emerald-300" : "text-slate-500 hover:bg-white/5 hover:text-slate-200")}>
                <MousePointer2 size={13} /> Select
              </button>
              <button type="button" onClick={() => setTool("pan")} className={"flex h-8 items-center gap-2 rounded-md px-2.5 text-[10px] font-semibold " + (tool === "pan" ? "bg-emerald-400/15 text-emerald-300" : "text-slate-500 hover:bg-white/5 hover:text-slate-200")}>
                <Move size={13} /> Pan
              </button>
              <button type="button" onClick={() => setTool("measure")} className={"flex h-8 items-center gap-2 rounded-md px-2.5 text-[10px] font-semibold " + (tool === "measure" ? "bg-emerald-400/15 text-emerald-300" : "text-slate-500 hover:bg-white/5 hover:text-slate-200")}>
                <Ruler size={13} /> Measure
              </button>
              <span className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />
              <button type="button" onClick={() => setShowGrid((value) => !value)} className={"flex h-8 items-center gap-2 rounded-md px-2.5 text-[10px] font-semibold " + (showGrid ? "text-emerald-300" : "text-slate-500 hover:text-white")}>
                <Grid3X3 size={13} /> Grid
              </button>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-white/[0.07] bg-black/20 p-1">
              <button type="button" onClick={() => setWorkspace("single")} className={"rounded-md px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider " + (workspace === "single" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300")}>Single view</button>
              <button type="button" onClick={() => setWorkspace("multi")} className={"rounded-md px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider " + (workspace === "multi" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300")}>Multi-view</button>
              <button type="button" onClick={() => setWorkspace("section")} className={"rounded-md px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider " + (workspace === "section" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300")}>Section</button>
            </div>
          </div>

          <div className="grid min-h-[690px] lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="flex min-h-[540px] min-w-0 flex-col border-b border-white/[0.07] lg:border-b-0 lg:border-r">
              {workspace === "single" && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2">
                    <div className="flex items-center gap-1">
                      {viewOptions.map((option) => (
                        <button key={option.value} type="button" onClick={() => setProjection(option.value)} className={"rounded-md px-3 py-1.5 text-[10px] font-semibold " + (projection === option.value ? "bg-emerald-400/10 text-emerald-300" : "text-slate-500 hover:bg-white/5 hover:text-slate-200")}>
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <span className="font-mono text-[9px] text-slate-600">MODEL: MM <span className="px-1 text-slate-800">·</span> {selectedLabel.toUpperCase()}</span>
                  </div>
                  <div className="min-h-[500px] flex-1 p-2">
                    <ProjectionPane
                      title={projectionOptionsLabel(projection)}
                      kind={projection}
                      vertices={projected[projection]}
                      edges={geometry.edges}
                      tool={tool}
                      showGrid={showGrid}
                      onMeasure={(length) => setMeasureMessage("Projected edge length: " + formatMm(length) + " mm")}
                    />
                  </div>
                </>
              )}

              {workspace === "multi" && (
                <div className="grid min-h-[540px] flex-1 grid-cols-1 gap-2 p-2 sm:grid-cols-2">
                  <ProjectionPane title="Front elevation" kind="front" vertices={projected.front} edges={geometry.edges} tool={tool} showGrid={showGrid} onMeasure={(length) => setMeasureMessage("Projected edge: " + formatMm(length) + " mm")} compact />
                  <ProjectionPane title="Top plan" kind="top" vertices={projected.top} edges={geometry.edges} tool={tool} showGrid={showGrid} onMeasure={(length) => setMeasureMessage("Projected edge: " + formatMm(length) + " mm")} compact />
                  <ProjectionPane title="Side profile" kind="side" vertices={projected.side} edges={geometry.edges} tool={tool} showGrid={showGrid} onMeasure={(length) => setMeasureMessage("Projected edge: " + formatMm(length) + " mm")} compact />
                  <ProjectionPane title="Isometric" kind="isometric" vertices={projected.isometric} edges={geometry.edges} tool={tool} showGrid={showGrid} onMeasure={(length) => setMeasureMessage("Projected edge: " + formatMm(length) + " mm")} compact />
                </div>
              )}

              {workspace === "section" && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Live section intersection</span>
                    <span className="font-mono text-[9px] text-amber-300">{sectionCount} intersection points</span>
                  </div>
                  <div className="min-h-[500px] flex-1 p-2">
                    <ProjectionPane
                      title="Isometric section preview"
                      kind="isometric"
                      vertices={projected.isometric}
                      edges={geometry.edges}
                      sectionPoints={section3D.map((point) => projectPoint(point, "isometric"))}
                      tool={tool}
                      showGrid={showGrid}
                      onMeasure={(length) => setMeasureMessage("Projected edge: " + formatMm(length) + " mm")}
                    />
                  </div>
                </>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] bg-[#0a100d] px-3 py-2.5 text-[9px]">
                <span className="font-mono text-slate-500">{measureMessage}</span>
                <span className="flex items-center gap-2 text-slate-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Geometry engine ready</span>
              </div>
            </div>

            <aside className="flex min-w-0 flex-col bg-[#0c1410]">
              <div className="flex h-11 items-center justify-between border-b border-white/[0.07] px-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.17em] text-slate-300">
                  <Settings2 size={13} className="text-emerald-400" /> Model properties
                </div>
                <button type="button" onClick={() => setShowProperties((value) => !value)} className="rounded p-1 text-slate-500 hover:bg-white/5 hover:text-white" aria-label="Toggle properties">
                  <ChevronDown size={14} className={showProperties ? "" : "-rotate-90"} />
                </button>
              </div>

              {showProperties && (
                <div className="flex-1 space-y-5 p-4">
                  <section>
                    <div className="mb-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-400">
                      <Box size={12} /> Geometry
                    </div>
                    <label className="mb-3 block">
                      <span className="mb-1.5 block text-[11px] font-semibold text-slate-400">Solid type</span>
                      <select value={solid} onChange={(event) => setSolid(event.target.value as SolidType)} className="h-9 w-full rounded-lg border border-white/10 bg-[#080e0c] px-2.5 text-xs text-slate-100 outline-none focus:border-emerald-400/70">
                        {solidOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <NumberInput label={solid === "cylinder" || solid === "cone" ? "Base diameter" : "Base span"} value={base} onChange={setBase} min={5} max={500} />
                      {solid !== "cube" && <NumberInput label="Height" value={height} onChange={setHeight} min={5} max={1000} />}
                      {solid === "cuboid" && <NumberInput label="Depth" value={depth} onChange={setDepth} min={5} max={500} />}
                      {(solid === "prism" || solid === "pyramid") && (
                        <label className="block">
                          <span className="mb-1.5 block text-[11px] font-semibold text-slate-400">Polygon sides</span>
                          <select value={sides} onChange={(event) => setSides(Number(event.target.value))} className="h-9 w-full rounded-lg border border-white/10 bg-[#080e0c] px-2.5 text-xs text-slate-100 outline-none focus:border-emerald-400/70">
                            {[3, 4, 5, 6, 8, 10, 12].map((value) => <option key={value} value={value}>{value} sides</option>)}
                          </select>
                        </label>
                      )}
                    </div>
                    <p className="mt-2 text-[9px] leading-4 text-slate-600">All dimensions are model-space millimetres. Zoom does not change these values.</p>
                  </section>

                  <section className="border-t border-white/[0.07] pt-4">
                    <div className="mb-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-400">
                      <RotateCcw size={12} /> Orientation
                    </div>
                    <div className="space-y-3">
                      <label className="block">
                        <span className="mb-1.5 flex justify-between text-[10px] text-slate-400"><span>Rotation about X</span><span className="font-mono text-slate-300">{rotationX}°</span></span>
                        <input type="range" min="-90" max="90" step="1" value={rotationX} onChange={(event) => setRotationX(Number(event.target.value))} className="w-full accent-emerald-400" />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 flex justify-between text-[10px] text-slate-400"><span>Rotation about Y</span><span className="font-mono text-slate-300">{rotationY}°</span></span>
                        <input type="range" min="-90" max="90" step="1" value={rotationY} onChange={(event) => setRotationY(Number(event.target.value))} className="w-full accent-emerald-400" />
                      </label>
                    </div>
                  </section>

                  {workspace === "section" && (
                    <section className="border-t border-white/[0.07] pt-4">
                      <div className="mb-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-amber-300">
                        <Scissors size={12} /> Cutting plane
                      </div>
                      <label className="mb-3 block">
                        <span className="mb-1.5 flex justify-between text-[10px] text-slate-400"><span>Plane angle</span><span className="font-mono text-slate-300">{cutAngle}°</span></span>
                        <input type="range" min="-75" max="75" step="1" value={cutAngle} onChange={(event) => setCutAngle(Number(event.target.value))} className="w-full accent-amber-400" />
                      </label>
                      <NumberInput label="Plane offset" value={cutOffset} onChange={updateCutOffset} min={-500} max={500} />
                      <p className="mt-2 text-[9px] leading-4 text-slate-600">The preview computes intersections between the current solid edges and a mathematical plane. Full sectional hatching and true-shape construction are not yet part of this release.</p>
                    </section>
                  )}

                  <section className="border-t border-white/[0.07] pt-4">
                    <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">Model summary</div>
                    <div className="space-y-1.5 rounded-lg border border-white/[0.06] bg-black/20 p-3 font-mono text-[10px]">
                      <div className="flex justify-between"><span className="text-slate-600">VERTICES</span><span className="text-slate-300">{geometry.vertices.length}</span></div>
                      <div className="flex justify-between"><span className="text-slate-600">EDGES</span><span className="text-slate-300">{geometry.edges.length}</span></div>
                      <div className="flex justify-between"><span className="text-slate-600">FACES</span><span className="text-slate-300">{geometry.faces.length}</span></div>
                      <div className="flex justify-between"><span className="text-slate-600">UNITS</span><span className="text-emerald-300">MM</span></div>
                    </div>
                  </section>
                </div>
              )}
            </aside>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-[9px] text-slate-600">
          <span>FOLE DRAFTLAB · PRECISION ENGINEERING GRAPHICS</span>
          <span>Mouse wheel: zoom around cursor · Shift + drag / middle drag: pan</span>
        </div>
      </div>
    </main>
  );
}

function projectionOptionsLabel(kind: ProjectionKind): string {
  if (kind === "front") return "Front elevation";
  if (kind === "top") return "Top plan";
  if (kind === "side") return "Side profile";
  return "Isometric axonometric view";
}
