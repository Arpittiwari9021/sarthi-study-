"use client";
import {Check,Plus,Trash2} from "lucide-react";import {useState} from "react";import {useSarthi} from "@/lib/store";
export default function Tasks(){
 const{tasks,toggleTask,addTask,removeTask}=useSarthi();
 const[v,setV]=useState("");
 const[openMenu,setOpenMenu]=useState<string|null>(null);
 const[confirmDelete,setConfirmDelete]=useState<string|null>(null);
 const taskToDelete=tasks.find(t=>t.id===confirmDelete);
 const submit=()=>{if(v.trim()){addTask(v.trim());setV("")}};
 return <Page title="Tasks" sub="Keep the work list simple. Finish what matters first.">
  <div className="card p-5">
   <div className="flex gap-2"><input value={v} onChange={e=>setV(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")submit()}} placeholder="What needs to be done?" className="min-w-0 flex-1 px-4 py-3 text-sm"/><button onClick={submit} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#7357e8] text-white shadow-lg shadow-violet-950/20"><Plus size={18}/></button></div>
   <div className="mt-5 space-y-2">{tasks.length===0?<Empty/>:tasks.map(t=><div key={t.id} className="relative flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/[0.07]">
    <button onClick={()=>toggleTask(t.id)} aria-label={t.done?"Mark incomplete":"Mark complete"} className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border ${t.done?"border-violet-500 bg-violet-500 text-white":"border-white/15 text-transparent"}`}><Check size={16}/></button>
    <span className={`flex-1 text-sm ${t.done?"text-slate-400 line-through":"text-slate-200"}`}>{t.title}</span>
    <button onClick={()=>setOpenMenu(openMenu===t.id?null:t.id)} aria-label="Task options" className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-slate-100">•••</button>
    {openMenu===t.id&&<div className="absolute right-3 top-12 z-20 w-40 rounded-2xl border border-white/10 bg-[#151a2b] p-1.5 shadow-2xl"><button onClick={()=>{setOpenMenu(null);setConfirmDelete(t.id)}} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-red-300 hover:bg-red-500/10"><Trash2 size={15}/>Delete task</button></div>}
   </div>)}</div>
  </div>
  {confirmDelete&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/65 px-4 backdrop-blur-sm" onMouseDown={()=>setConfirmDelete(null)}><div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#111522] p-5 shadow-2xl" onMouseDown={e=>e.stopPropagation()}><div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-500/10 text-red-300"><Trash2 size={19}/></div><div><h2 className="text-base font-semibold text-white">Delete this task?</h2><p className="mt-1 text-xs leading-5 text-slate-400">This will permanently remove <span className="text-slate-200">{taskToDelete?.title}</span> from your task list.</p></div></div><div className="mt-5 flex justify-end gap-2"><button onClick={()=>setConfirmDelete(null)} className="btn">Cancel</button><button onClick={()=>{if(confirmDelete)removeTask(confirmDelete);setConfirmDelete(null)}} className="rounded-2xl bg-red-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-400">Delete</button></div></div></div>}
 </Page>
}
function Empty(){return <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">No tasks yet. Start with one clear action.</div>}
function Page({title,sub,children}:{title:string;sub:string;children:React.ReactNode}){return <main className="mx-auto max-w-6xl px-4 pb-28 pt-8 md:px-8"><div className="mb-6"><div className="text-[11px] font-semibold tracking-[.16em] text-violet-500">SARTHI / TODAY</div><h1 className="mt-2 text-3xl font-semibold text-slate-900">{title}</h1><p className="mt-1 text-sm text-slate-500">{sub}</p></div>{children}</main>}
