"use client";
import {ChevronDown} from "lucide-react";

type ModelOption={id:string;name:string;role:string;description:string;vram:string};
export default function ModelLoader({progress,text,model,models,modelId,loading,onModelChange,onStart}:{progress:number;text:string;model:string;models:ModelOption[];modelId:string;loading:boolean;onModelChange:(id:string)=>void;onStart:()=>void}){
 return <div className="mx-auto flex min-h-[78vh] max-w-xl items-center justify-center p-5"><div className="card w-full p-7 text-center">
  <img src="/sarthi-icon.png" alt="Sarthi" className="mx-auto h-16 w-16 rounded-[22px] shadow-lg"/>
  <div className="mt-4 text-2xl font-semibold text-slate-900">Sarthi AI</div>
  <div className="mt-1 text-sm text-slate-500">Academic tutor • system observer • runs locally</div>
  <div className="mt-5 text-left"><label className="text-[10px] font-semibold tracking-[.16em] text-slate-400">SELECT LOCAL MODEL</label><div className="relative mt-2"><select value={modelId} onChange={e=>onModelChange(e.target.value)} disabled={loading} className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-slate-800 outline-none focus:border-violet-300 disabled:opacity-60">{models.map(m=><option key={m.id} value={m.id}>{m.name} — {m.role}</option>)}</select><ChevronDown size={16} className="pointer-events-none absolute right-4 top-3.5 text-slate-400"/></div><p className="mt-2 text-[11px] leading-5 text-slate-400">{models.find(m=>m.id===modelId)?.description} · {models.find(m=>m.id===modelId)?.vram}</p></div>
  <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50/60 p-4 text-left"><div className="flex justify-between text-xs text-slate-500"><span>{loading?"Loading model":"Ready to start"}</span><span>{progress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-400 transition-all" style={{width:`${progress}%`}}/></div><div className="mt-3 text-xs leading-5 text-slate-500">{text||"First launch downloads the selected model. The browser caches it for later sessions."}</div></div>
  <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-left text-[11px] text-slate-500 break-all">{model}</div>
  <button onClick={onStart} disabled={loading} className="mt-5 w-full rounded-2xl bg-[#7258ee] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{loading?"Starting Sarthi AI…":"Start Sarthi AI"}</button>
  <p className="mt-3 text-[10px] text-slate-400">WebGPU is required. No API key is used. One model is loaded at a time.</p>
 </div></div>
}
