"use client";

import React, { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Box, Check, ChevronRight, Compass, DraftingCompass, Download, Layers, Play, RotateCw, Scissors, Sparkles } from "lucide-react";

type Problem = "position" | "section" | "development" | "isometric" | "orthographic";
type Solid = "prism" | "pyramid" | "cylinder" | "cone" | "cube" | "cuboid" | "frustum";

const problems: Array<{id: Problem; number: string; title: string; description: string; unit: string}> = [
  {id:"position",number:"01",title:"Projection of solids",description:"Position a solid with its axis inclined to HP, VP or both.",unit:"III–IV"},
  {id:"section",number:"02",title:"Section of solids",description:"Set a cutting plane, inspect the section and construct its true shape.",unit:"III–IV"},
  {id:"development",number:"03",title:"Development of surfaces",description:"Unfold lateral surfaces and study the development step by step.",unit:"III–IV"},
  {id:"isometric",number:"04",title:"Isometric projection",description:"Explore an isometric view, dimensions and inclined cuts.",unit:"V"},
  {id:"orthographic",number:"05",title:"Orthographic views",description:"Compare front, plan, side and isometric views together.",unit:"V"}
];

const shapes: Array<{id: Solid; title: string; subtitle: string; glyph: string}> = [
  {id:"prism",title:"Prism",subtitle:"Polygonal base",glyph:"⬡"},
  {id:"pyramid",title:"Pyramid",subtitle:"Polygonal base",glyph:"△"},
  {id:"cylinder",title:"Cylinder",subtitle:"Circular base",glyph:"◉"},
  {id:"cone",title:"Cone",subtitle:"Circular base",glyph:"◭"},
  {id:"cube",title:"Cube",subtitle:"Equal edges",glyph:"▧"},
  {id:"cuboid",title:"Cuboid",subtitle:"Rectangular solid",glyph:"▰"},
  {id:"frustum",title:"Frustum",subtitle:"Truncated cone",glyph:"⏢"}
];

function NumberField({label,value,onChange,unit="mm",min=1,max=150}:{
  label:string;value:number;onChange:(value:number)=>void;unit?:string;min?:number;max?:number;
}) {
  return <label className="block min-w-0">
    <span className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-300">{label}<span className="font-mono text-[10px] font-normal text-slate-500">{unit}</span></span>
    <input type="number" value={value} min={min} max={max} onChange={e=>onChange(Math.min(max,Math.max(min,Number(e.target.value)||min)))} className="h-11 w-full rounded-xl border border-white/10 bg-[#0B1410] px-3 font-mono text-sm text-white outline-none focus:border-[#00C878] focus:ring-2 focus:ring-[#00C878]/15"/>
  </label>;
}

export function EngineeringGraphicsStudio() {
  const [problem,setProblem] = useState<Problem>("section");
  const [solid,setSolid] = useState<Solid>("prism");
  const [sides,setSides] = useState(6);
  const [base,setBase] = useState(30);
  const [height,setHeight] = useState(60);
  const [depth,setDepth] = useState(30);
  const [topSize,setTopSize] = useState(18);
  const [hp,setHp] = useState(45);
  const [vp,setVp] = useState(90);
  const [cutAngle,setCutAngle] = useState(30);
  const [cutHeight,setCutHeight] = useState(30);
  const [rest,setRest] = useState<"HP"|"VP">("HP");
  const [includeCut,setIncludeCut] = useState(true);
  const [engineUrl,setEngineUrl] = useState<string|null>(null);
  const [engineTitle,setEngineTitle] = useState("Engineering Graphics Simulator");
  const [launchNote,setLaunchNote] = useState("");

  const unit34 = (problem==="position" || problem==="section" || problem==="development") && solid!=="frustum";
  const unsupportedDev = problem==="development" && solid==="frustum";
  const unsupportedPosition = problem==="position" && solid==="frustum";
  const showCut = problem==="section" || ((problem==="isometric" || problem==="orthographic") && includeCut);
  const baseLabel = solid==="cylinder" || solid==="cone" || solid==="frustum" ? "Base diameter" : solid==="cuboid" ? "Width" : solid==="cube" ? "Edge length" : "Base polygon edge";
  const solidHeight = solid==="cube" ? base : height;
  const summary = useMemo(()=>{
    const parts=[baseLabel+" "+base+" mm","Height "+solidHeight+" mm"];
    if(solid==="cuboid" && unit34) parts.push("Depth "+depth+" mm");
    if(solid==="frustum") parts.push("Top diameter "+topSize+" mm");
    return parts.join(" · ");
  },[baseLabel,base,solidHeight,solid,unit34,depth,topSize]);

  function startSimulation() {
    const params=new URLSearchParams();
    let path="";
    if(unit34) {
      path="/engineering-graphics/unit3-4/index.html";
      let engineBase=base;
      if(solid==="prism" && sides!==4) engineBase=base/(2*Math.sin(Math.PI/sides));
      else if(solid==="pyramid") engineBase=base/(2*Math.sin(Math.PI/sides));
      else if(solid==="cylinder" || solid==="cone") engineBase=base/2;
      let engineSolid="hexPrism";
      if(solid==="prism") engineSolid=sides===3?"triPrism":sides===5?"pentPrism":sides===4?"cuboid":"hexPrism";
      else if(solid==="pyramid") engineSolid=sides===3?"triPyramid":sides===4?"squarePyramid":sides===5?"pentPyramid":"hexPyramid";
      else if(solid==="cube") engineSolid="cube";
      else if(solid==="cuboid") engineSolid="cuboid";
      else if(solid==="cylinder" || solid==="cone") engineSolid=solid;
      params.set("solid",engineSolid);
      params.set("base",String(engineBase));
      params.set("height",String(solidHeight));
      params.set("depth",String(solid==="cuboid"?depth:base));
      params.set("hp",String(hp)); params.set("vp",String(vp)); params.set("rest",rest);
      params.set("cut",showCut?"1":"0"); params.set("cutAngle",String(cutAngle));
      params.set("cutPos",String(Math.min(cutHeight,solidHeight-1)));
      params.set("tab",problem==="section"?"tabTrueShape":problem==="development"?"tabDev":"tabProj");
      setEngineTitle(problem==="section"?"Section & true shape":problem==="development"?"Surface development":"Projection of solids");
      setLaunchNote("Unit III–IV · solid orientation, sectional geometry and 2D construction views");
    } else {
      path="/engineering-graphics/unit5/index.html";
      params.set("shape",solid==="cube"?"cuboid":solid);
      params.set("base",String(base)); params.set("height",String(solidHeight));
      params.set("top",String(Math.min(topSize,base-1))); params.set("sides",String(sides));
      params.set("cut",showCut?"1":"0"); params.set("cutAngle",String(Math.max(0,Math.min(85,cutAngle))));
      params.set("cutHeight",String(Math.min(cutHeight,solidHeight-1)));
      params.set("mode",problem==="orthographic"?"split":"iso");
      setEngineTitle(problem==="section"?"Frustum section preview":problem==="orthographic"?"Orthographic & isometric views":"Isometric projection");
      setLaunchNote("Unit V · interactive isometric model, orthographic views and cut preview");
    }
    setEngineUrl(path+"?"+params.toString());
  }

  if(engineUrl) return <main className="min-h-screen bg-[#050908] pt-[88px] text-white">
    <div className="mx-auto flex h-[calc(100vh-88px)] max-w-[1800px] flex-col px-3 pb-3 sm:px-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0A120E] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={()=>setEngineUrl(null)} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-white/10 px-3 text-xs font-semibold text-slate-200 hover:border-[#00C878]/50"><ArrowLeft className="h-4 w-4"/> Setup</button>
          <div className="min-w-0"><div className="truncate text-sm font-bold">{engineTitle}</div><div className="truncate text-[10px] text-slate-500">{launchNote}</div></div>
        </div>
        <a href={engineUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#00B96B] px-4 py-2 text-xs font-bold text-[#03110B] hover:bg-[#00D47B]">Open full screen <Download className="h-3.5 w-3.5"/></a>
      </div>
      <iframe title={engineTitle} src={engineUrl} className="min-h-0 w-full flex-1 rounded-2xl border border-white/10 bg-[#0B1015]" allow="fullscreen"/>
    </div>
  </main>;

  return <main className="relative min-h-screen overflow-hidden bg-[#050908] pt-24 text-white">
    <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden="true">
      <div className="absolute -left-32 -top-32 h-[520px] w-[520px] rounded-full bg-[#00A86B]/10 blur-[140px]"/>
      <div className="absolute -right-32 top-44 h-[440px] w-[440px] rounded-full bg-[#007C51]/10 blur-[130px]"/>
      <div className="absolute inset-0" style={{backgroundImage:"radial-gradient(rgba(0,200,120,.22) .7px, transparent .7px)",backgroundSize:"22px 22px",maskImage:"linear-gradient(to bottom, black, transparent 78%)"}}/>
    </div>
    <div className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#00C878]/25 bg-[#00A86B]/10 px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.18em] text-[#42E6A1]"><span className="h-1.5 w-1.5 rounded-full bg-[#00D47B] shadow-[0_0_12px_#00D47B]"/> FOLE LEARNING TOOLS <span className="text-white/25">/</span> STUDIO 01</div>
        <div className="text-[10px] font-mono tracking-[0.16em] text-slate-500">MECHANICAL · SPATIAL · VISUAL</div>
      </div>

      <section className="mb-10 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)] lg:items-end">
        <div>
          <div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#00C878]"><DraftingCompass className="h-4 w-4"/> Engineering Graphics Studio</div>
          <h1 className="max-w-3xl text-4xl font-black leading-[1.04] tracking-[-0.045em] sm:text-5xl lg:text-6xl">See the geometry.<span className="block text-[#00C878]">Understand the drawing.</span></h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">Start with the question in front of you. Choose the solid, enter the given dimensions and set the required planes. FOLE opens the right interactive construction workspace with your inputs preloaded.</p>
        </div>
        <div className="relative overflow-hidden rounded-[28px] border border-[#00C878]/20 bg-[#09130E] p-5 sm:p-7">
          <div className="mb-5 flex items-center justify-between"><span className="font-mono text-[10px] font-bold tracking-[0.18em] text-slate-500">LIVE CONSTRUCTION PREVIEW</span><span className="rounded-full border border-[#00C878]/20 px-2 py-1 font-mono text-[9px] text-[#44DFA0]">3D / 2D</span></div>
          <svg viewBox="0 0 420 230" className="h-auto w-full" role="img" aria-label="Wireframe engineering solid with reference planes">
            <g fill="none" stroke="#00D47B" strokeWidth="1.5" strokeLinejoin="round">
              <path d="M135 54 235 27 323 75 222 104Z" fill="#00C878" fillOpacity=".12"/><path d="M135 54V166L222 213V104"/><path d="M222 104 323 75V187L222 213"/><path d="M135 166 235 139 323 187" opacity=".45"/><path d="M235 27V139" strokeDasharray="4 5" opacity=".45"/><path d="M135 54 235 139 323 75" strokeDasharray="4 5" opacity=".55"/><path d="M91 185H355M115 195H378" opacity=".22"/><path d="M185 15V222M76 119H365" strokeDasharray="3 6" opacity=".2"/>
            </g>
            <g fill="#8EF0C0" fontSize="10" fontFamily="monospace"><text x="334" y="72">VP</text><text x="80" y="182">HP</text><text x="238" y="21">A</text><text x="334" y="193">B</text><text x="117" y="43">C</text></g>
          </svg>
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-4 text-[10px] font-mono text-slate-500"><span>REFERENCE PLANES · CONSTRUCTION EDGES</span><span className="text-[#00C878]">READY</span></div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
        <div className="rounded-[26px] border border-white/10 bg-[#0A110D]/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-3"><div><div className="font-mono text-[10px] font-bold tracking-[0.18em] text-[#00C878]">01 / PROBLEM TYPE</div><h2 className="mt-1 text-xl font-bold">What are you solving?</h2></div><span className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 font-mono text-[10px] text-slate-500">SELECT ONE</span></div>
          <div className="grid gap-2 sm:grid-cols-2">
            {problems.map(item=><button type="button" key={item.id} onClick={()=>setProblem(item.id)} className={"group flex min-h-[94px] items-start gap-3 rounded-2xl border p-4 text-left transition "+(problem===item.id?"border-[#00C878]/60 bg-[#00A86B]/10":"border-white/10 bg-[#0B1510] hover:border-white/20")}>
              <span className={"mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-mono text-[10px] font-bold "+(problem===item.id?"bg-[#00C878] text-[#03110B]":"bg-white/5 text-slate-500")}>{item.number}</span>
              <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2 text-sm font-bold">{item.title}<span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-slate-500">UNIT {item.unit}</span></span><span className="mt-1 block text-xs leading-5 text-slate-400">{item.description}</span></span>
              {problem===item.id?<Check className="mt-1 h-4 w-4 shrink-0 text-[#00D47B]"/>:<ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-600"/>}
            </button>)}
          </div>

          <div className="mb-6 mt-8 flex items-center justify-between border-t border-white/10 pt-6"><div><div className="font-mono text-[10px] font-bold tracking-[0.18em] text-[#00C878]">02 / SOLID</div><h2 className="mt-1 text-xl font-bold">Which shape is given?</h2></div><Box className="h-5 w-5 text-slate-500"/></div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {shapes.map(item=><button type="button" key={item.id} onClick={()=>setSolid(item.id)} className={"rounded-2xl border p-3 text-left transition "+(solid===item.id?"border-[#00C878]/60 bg-[#00A86B]/10":"border-white/10 bg-[#0B1510] hover:border-white/20")}>
              <span className={"mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-2xl "+(solid===item.id?"bg-[#00C878]/15 text-[#55E4A9]":"bg-white/[0.04] text-slate-500")}>{item.glyph}</span><span className="block text-sm font-bold">{item.title}</span><span className="mt-1 block text-[10px] text-slate-500">{item.subtitle}</span>
            </button>)}
          </div>
          {(solid==="prism" || solid==="pyramid") && <div className="mt-5"><div className="mb-2 text-xs font-semibold text-slate-300">Number of sides</div><div className="flex flex-wrap gap-2">{[3,4,5,6].map(n=><button type="button" key={n} onClick={()=>setSides(n)} className={"h-9 min-w-12 rounded-lg border px-3 font-mono text-xs "+(sides===n?"border-[#00C878] bg-[#00A86B]/15 text-[#65E9B2]":"border-white/10 bg-[#0B1510] text-slate-400")}>{n} sides</button>)}</div></div>}

          <div className="mb-6 mt-8 flex items-center justify-between border-t border-white/10 pt-6"><div><div className="font-mono text-[10px] font-bold tracking-[0.18em] text-[#00C878]">03 / GIVEN DATA</div><h2 className="mt-1 text-xl font-bold">Enter the question dimensions</h2></div><span className="font-mono text-[10px] text-slate-500">LINEAR VALUES IN MM</span></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NumberField label={baseLabel} value={base} onChange={setBase} min={5}/>
            {solid!=="cube" && <NumberField label="Height" value={height} onChange={setHeight} min={10}/>}
            {solid==="cuboid" && unit34 && <NumberField label="Depth" value={depth} onChange={setDepth} min={5}/>}
            {solid==="frustum" && <NumberField label="Top diameter" value={topSize} onChange={setTopSize} min={2} max={149}/>}
          </div>

          {unit34 && (problem==="position" || problem==="section" || problem==="development") && <>
            <div className="mb-5 mt-8 flex items-center justify-between border-t border-white/10 pt-6"><div><div className="font-mono text-[10px] font-bold tracking-[0.18em] text-[#00C878]">04 / ORIENTATION</div><h2 className="mt-1 text-xl font-bold">Position relative to reference planes</h2></div><Compass className="h-5 w-5 text-slate-500"/></div>
            <div className="grid gap-4 sm:grid-cols-3">
              <NumberField label="Axis with HP" value={hp} onChange={setHp} unit="degrees" min={0} max={90}/>
              <NumberField label="Axis with VP" value={vp} onChange={setVp} unit="degrees" min={0} max={90}/>
              <label className="block"><span className="mb-2 block text-xs font-semibold text-slate-300">Resting on</span><select value={rest} onChange={e=>setRest(e.target.value as "HP"|"VP")} className="h-11 w-full rounded-xl border border-white/10 bg-[#0B1410] px-3 text-sm text-white outline-none focus:border-[#00C878]"><option value="HP">Horizontal plane (HP)</option><option value="VP">Vertical plane (VP)</option></select></label>
            </div>
          </>}

          {(problem==="section" || problem==="isometric" || problem==="orthographic") && <>
            <div className="mb-5 mt-8 flex items-center justify-between border-t border-white/10 pt-6"><div><div className="font-mono text-[10px] font-bold tracking-[0.18em] text-[#00C878]">05 / CUTTING PLANE</div><h2 className="mt-1 text-xl font-bold">Section parameters</h2></div><Scissors className="h-5 w-5 text-slate-500"/></div>
            {(problem==="isometric" || problem==="orthographic") && <label className="mb-4 flex items-center gap-3 text-xs text-slate-300"><input type="checkbox" checked={includeCut} onChange={e=>setIncludeCut(e.target.checked)} className="h-4 w-4 accent-[#00C878]"/> Include an angled cutting plane</label>}
            {showCut && <div className="grid gap-4 sm:grid-cols-2"><NumberField label="Cutting plane angle" value={cutAngle} onChange={setCutAngle} unit="degrees" min={0} max={85}/><NumberField label="Cut height from base" value={cutHeight} onChange={setCutHeight} min={1} max={Math.max(2,solidHeight-1)}/></div>}
          </>}

          {solid==="frustum" && (problem==="section" || problem==="position" || problem==="development") && <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-5 text-amber-100/80">The Unit V frustum engine supports 3D modelling, angled cuts and orthographic views. Unit III–IV axis-inclination, true-shape and surface-development tools are not available for frustums.</div>}
          {solid==="cuboid" && !unit34 && <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-5 text-slate-400">The Unit V isometric engine uses a square footprint for this solid. Choose a Unit III–IV task to enter independent width and depth values.</div>}
          {unsupportedDev && <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-5 text-amber-100/80">Surface development for frustums is not implemented in the supplied engine. Choose a prism, pyramid, cylinder or cone.</div>}
          {unsupportedPosition && <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-5 text-amber-100/80">The supplied frustum engine does not support inclined-axis positioning relative to HP and VP. Choose another solid for this problem type.</div>}

          <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between"><div className="text-xs leading-5 text-slate-500"><span className="font-semibold text-slate-300">Current setup</span><br/>{summary}</div><button type="button" disabled={unsupportedDev || unsupportedPosition} onClick={startSimulation} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#00C878] px-7 text-sm font-extrabold text-[#03110B] shadow-[0_8px_30px_rgba(0,200,120,.18)] transition hover:-translate-y-0.5 hover:bg-[#19E08D] disabled:cursor-not-allowed disabled:opacity-40"><Play className="h-4 w-4 fill-current"/> Build my drawing <ArrowRight className="h-4 w-4"/></button></div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[26px] border border-white/10 bg-[#0A110D] p-5 sm:p-6"><div className="mb-5 flex items-center gap-2 text-xs font-bold"><Sparkles className="h-4 w-4 text-[#00C878]"/> YOUR WORKSPACE</div><div className="space-y-4">
            <div className="border-b border-white/10 pb-4"><div className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">Problem</div><div className="mt-1 text-sm font-bold">{problems.find(p=>p.id===problem)?.title}</div><div className="mt-1 text-xs text-slate-500">Unit {unit34?"III–IV":"V"} simulation engine</div></div>
            <div className="border-b border-white/10 pb-4"><div className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">Solid</div><div className="mt-1 text-sm font-bold capitalize">{solid==="frustum"?"Conical frustum":solid}</div><div className="mt-1 text-xs text-slate-500">{solid==="prism" || solid==="pyramid"?sides+"-sided base":"Parametric solid"}</div></div>
            <div className="border-b border-white/10 pb-4"><div className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">Output</div><div className="mt-2 flex flex-wrap gap-2">{(problem==="section"?["3D solid","Section","True shape"]:problem==="development"?["3D solid","Unfold animation"]:problem==="position"?["3D solid","HP / VP","Projections"]:problem==="orthographic"?["Isometric","Front","Plan","Side"]:["Isometric","Dimensions","Cut view"]).map(value=><span key={value} className="rounded-lg border border-[#00C878]/15 bg-[#00A86B]/[0.07] px-2 py-1 text-[10px] text-[#81E9B9]">{value}</span>)}</div></div>
            <div><div className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">Interaction</div><div className="mt-2 flex items-center gap-2 text-xs text-slate-400"><RotateCw className="h-3.5 w-3.5 text-[#00C878]"/> Rotate · zoom · inspect</div><div className="mt-2 flex items-center gap-2 text-xs text-slate-400"><Layers className="h-3.5 w-3.5 text-[#00C878]"/> Switch construction views</div><div className="mt-2 flex items-center gap-2 text-xs text-slate-400"><Download className="h-3.5 w-3.5 text-[#00C878]"/> Export a PNG view</div></div>
          </div></div>
          <div className="rounded-[26px] border border-[#00C878]/15 bg-gradient-to-br from-[#063A27]/35 to-[#09110D] p-5"><div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#77EAB8]"><Box className="h-4 w-4"/> ENGINEERING, NOT GUESSWORK</div><p className="text-xs leading-6 text-slate-400">The supplied Three.js geometry and section calculations are retained. The setup converts the dimensions in your question into each engine&apos;s input conventions.</p></div>
          <div className="rounded-[26px] border border-white/10 bg-[#080E0B] p-5"><div className="mb-2 text-[10px] font-mono font-bold tracking-[0.16em] text-slate-500">STUDIO NOTE</div><p className="text-xs leading-6 text-slate-500">Use the visualizer to understand the construction sequence, then reproduce the required projections and dimensions neatly on your drawing sheet.</p></div>
        </aside>
      </section>

      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[10px] text-slate-600"><span>FOLE · FREE OPEN LEARNING &amp; EDUCATION</span><span>Original simulation engine: EG Suite · Alberto Felix &amp; Aaron Mcgeo · MIT License</span></footer>
    </div>
  </main>;
}
