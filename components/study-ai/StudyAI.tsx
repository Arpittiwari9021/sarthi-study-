"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {ArrowUp,Brain,Trash2,Sparkles,Square,Paperclip,Camera,Image as ImageIcon,CalendarClock,Check,X,ShieldCheck,FileText,Search,ChevronDown} from "lucide-react";
import {useSarthi} from "@/lib/store";
import {useWebLLM} from "@/hooks/useWebLLM";
import {SARTHI_SYSTEM_PROMPT,buildStudyContext,compactAIMessages} from "@/lib/study-ai";
import ModelLoader from "./ModelLoader";
import {ChatMessage} from "./ChatMessage";

const KEY="sarthi-study-ai-final-v2";
type Message={id:string;role:"user"|"assistant";content:string};
type Change={action:"add"|"edit"|"delete";id?:string;title?:string;date?:string;start?:string;end?:string;kind?:"class"|"study"|"focus"|"other"};
type Proposal={type:"schedule";reason:string;changes:Change[]};

function extractProposal(text:string):Proposal|null{
  const blocks=[...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
  for(const block of blocks){try{const parsed=JSON.parse(block[1].trim());if(parsed?.type==="schedule"&&Array.isArray(parsed.changes)&&parsed.changes.length)return parsed}catch{}}
  return null
}
function stripProposal(text:string){
  return text.replace(/```(?:json)?\s*([\s\S]*?)```/gi,(full,body)=>{try{return JSON.parse(body.trim())?.type==="schedule"?"":full}catch{return full}}).trim()
}
async function extractImageText(file:File){const mod=await import("tesseract.js");const worker=await mod.createWorker("eng");try{const r=await worker.recognize(file);if(!r.data.text.trim())throw new Error("Photo mein readable text nahi mila. Clear photo ya screenshot try karo.");return r.data.text}finally{await worker.terminate()}}
async function extractPdf(file:File){const pdfjs=await import("pdfjs-dist/legacy/build/pdf.mjs");pdfjs.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.296/pdf.worker.min.mjs";const data=new Uint8Array(await file.arrayBuffer());const pdf=await pdfjs.getDocument({data}).promise;let text="";for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i);const content=await page.getTextContent();text+=`\n\n--- Page ${i} ---\n${content.items.map((item:any)=>item.str||"").join(" ")}`}if(text.trim())return text;let ocr="";const tesseract=await import("tesseract.js");const worker=await tesseract.createWorker("eng");try{for(let i=1;i<=Math.min(pdf.numPages,20);i++){const page=await pdf.getPage(i);const viewport=page.getViewport({scale:1.5});const canvas=document.createElement("canvas");canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);const ctx=canvas.getContext("2d");if(!ctx)continue;await page.render({canvasContext:ctx,viewport}).promise;const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/png"));if(blob){const r=await worker.recognize(blob);ocr+=`\n\n--- OCR Page ${i} ---\n${r.data.text}`}}}finally{await worker.terminate()}if(!ocr.trim())throw new Error("PDF mein readable text nahi mila. Clear PDF ya page screenshots upload karo.");return ocr}

export default function StudyAI(){
 const ai=useWebLLM();
 const [modelMenu,setModelMenu]=useState(false);
 const s=useSarthi();
 const {studyMaterials,weakTopics,tasks,goals,scheduleBlocks,nimcetTopics}=s;
 const [messages,setMessages]=useState<Message[]>([]);
 const [input,setInput]=useState("");
 const [proposal,setProposal]=useState<Proposal|null>(null);
 const [uploading,setUploading]=useState(false);
 const [fileName,setFileName]=useState("");
 const [attachmentText,setAttachmentText]=useState("");
 const [showAttach,setShowAttach]=useState(false);
 const bottom=useRef<HTMLDivElement>(null);
 const fileRef=useRef<HTMLInputElement>(null);
 const imageRef=useRef<HTMLInputElement>(null);
 const cameraRef=useRef<HTMLInputElement>(null);

 useEffect(()=>{try{const raw=localStorage.getItem(KEY);if(raw)setMessages(JSON.parse(raw))}catch{}},[]);
 useEffect(()=>{localStorage.setItem(KEY,JSON.stringify(messages));bottom.current?.scrollIntoView({behavior:"smooth"})},[messages]);
 useEffect(()=>{const last=messages[messages.length-1];if(last?.role==="assistant"){const p=extractProposal(last.content);if(p)setProposal(p)}},[messages]);

 const suggestions=useMemo(()=>[
  "Mera current backlog analyse karo aur sabse pehle kya karna chahiye batao",
  "Mere schedule aur classes ko dekhkar realistic NIMCET plan suggest karo",
  "Mere Sarthi project ka system-level analysis karo",
  "HCF aur LCM zero se samjhao"
 ],[]);
 const context=()=>buildStudyContext({
  notes:studyMaterials.slice(0,8).map(m=>`${m.topic}: ${m.text.slice(0,1800)}`).join("\n"),
  weakTopics:weakTopics.slice(0,12).map(w=>`${w.topic} (${w.score}%): ${w.reason}`),
  nimcet:`Topics: ${nimcetTopics.length}; ${nimcetTopics.slice(0,30).map(t=>`${t.subject}: ${t.topic} mastery=${t.mastery}% questions=${t.questions} correct=${t.correct}`).join(" | ")}`,
  tasks:tasks.slice(0,40).map(t=>`${t.done?"✓":"○"} ${t.title}`).join("\n"),
  goals:goals.map(g=>`${g.title}: ${g.progress}% — deadline ${g.deadline||"none"}`).join("\n"),
  schedule:scheduleBlocks.slice(0,50).map(b=>`${b.id} | ${b.date} ${b.start}-${b.end} | ${b.type} | ${b.title} | completed=${!!b.completed}`).join("\n"),
  studyMaterials:studyMaterials.slice(0,6).map(m=>`${m.topic}: ${m.text.slice(0,3500)}`).join("\n")
 });
 async function send(text=input){
  const q=text.trim();
  if((!q&&!attachmentText)||ai.status==="generating")return;
  setInput("");
  if(ai.status!=="ready")await ai.initialize();
  if(ai.status==="error")return;
  const attached=attachmentText;
  const attachedName=fileName;
  const userContent=attached ? `${q||"Please analyse the attached material."}\n\n[ATTACHED MATERIAL: ${attachedName}]\n${attached}` : q;
  setAttachmentText(""); setFileName("");
  const user:Message={id:crypto.randomUUID(),role:"user",content:userContent};
  const assistant:Message={id:crypto.randomUUID(),role:"assistant",content:""};
  setMessages(prev=>[...prev,user,assistant]);
  const liveContext=buildStudyContext({
    notes:studyMaterials.slice(0,8).map(m=>`${m.topic}: ${m.text.slice(0,1800)}`).join("\n"),
    weakTopics:weakTopics.slice(0,12).map(w=>`${w.topic} (${w.score}%): ${w.reason}`),
    nimcet:`Topics: ${nimcetTopics.length}; ${nimcetTopics.slice(0,30).map(t=>`${t.subject}: ${t.topic} mastery=${t.mastery}% questions=${t.questions} correct=${t.correct}`).join(" | ")}`,
    tasks:tasks.slice(0,40).map(t=>`${t.done?"✓":"○"} ${t.title}`).join("\n"),
    goals:goals.map(g=>`${g.title}: ${g.progress}% — deadline ${g.deadline||"none"}`).join("\n"),
    schedule:scheduleBlocks.slice(0,50).map(b=>`${b.id} | ${b.date} ${b.start}-${b.end} | ${b.type} | ${b.title} | completed=${!!b.completed}`).join("\n"),
    studyMaterials:studyMaterials.slice(0,6).map(m=>`${m.topic}: ${m.text.slice(0,3500)}`).join("\n")
  });
  const attachmentContext=attached?`\n\nCURRENT TURN ATTACHMENT\nFile: ${attachedName}\n${attached.slice(0,7000)}`:"";
  const history=compactAIMessages([{role:"system",content:`${SARTHI_SYSTEM_PROMPT}\n\n${liveContext}${attachmentContext}`},...messages.slice(-6).map(m=>({role:m.role,content:m.content})),{role:"user",content:userContent}],12500);
  try{
   await ai.generate(history,(token)=>setMessages(prev=>prev.map(m=>m.id===assistant.id?{...m,content:m.content+token}:m)));
  }catch(error){
   const raw=error instanceof Error?error.message:"AI generation failed.";
   const message=/context window|prompt tokens|maximum context|token/i.test(raw)
    ? "Prompt bahut lamba tha. Sarthi ne context ko automatically short kiya hai. Please same question dobara bhejo."
    : raw;
   setMessages(prev=>prev.map(m=>m.id===assistant.id?{...m,content:`⚠️ ${message}`}:m));
  }
 }
 function applyProposal(){if(!proposal)return;for(const c of proposal.changes){if(c.action==="add"&&c.title&&c.date&&c.start&&c.end){s.addScheduleBlock({title:c.title,date:c.date,start:c.start,end:c.end,type:c.kind||"study",source:"ai",completed:false})}else if(c.action==="edit"&&c.id){s.updateScheduleBlock(c.id,{title:c.title,date:c.date,start:c.start,end:c.end,type:c.kind})}else if(c.action==="delete"&&c.id){s.removeScheduleBlock(c.id)}}setProposal(null)}
 async function uploadSource(file:File){
  setUploading(true);setFileName(file.name);setShowAttach(false);
  try{
   let text="";const ext=file.name.toLowerCase();
   if(file.type==="application/pdf"||ext.endsWith(".pdf"))text=await extractPdf(file);
   else if(file.type.startsWith("image/"))text=await extractImageText(file);
   else if(file.type.startsWith("text/")||ext.endsWith(".txt")||ext.endsWith(".md"))text=await file.text();
   else throw new Error("Unsupported file type.");
   s.addStudyMaterial(file.name,text,file.type);
   setAttachmentText(text);
   setInput("");
  }catch(error){setAttachmentText("");setFileName("");setInput(`"${file.name}" read nahi ho payi. Error: ${error instanceof Error?error.message:"unknown error"}`)}finally{setUploading(false)}
 }
 if(ai.status==="idle"||ai.status==="checking"||ai.status==="loading")return <ModelLoader progress={ai.progress} text={ai.progressText} model={ai.model.name} models={ai.models} modelId={ai.modelId} loading={ai.status!=="idle"} onModelChange={ai.setModel} onStart={() => ai.initialize(ai.modelId)}/>;
 if(ai.status==="error")return <div className="mx-auto flex min-h-[75vh] max-w-xl items-center justify-center p-5"><div className="card w-full p-7"><img src="/sarthi-icon.png" className="h-12 w-12 rounded-2xl" alt="Sarthi"/><h1 className="mt-4 text-xl font-semibold text-slate-900">Sarthi AI unavailable</h1><p className="mt-1 text-xs text-slate-500">WebGPU/model initialization failed.</p><div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm leading-6 text-slate-500">{ai.error}</div><button onClick={() => ai.initialize()} className="mt-5 rounded-2xl bg-[#7357e8] px-4 py-3 text-sm font-semibold text-white">Try again</button></div></div>;
 return <main className="mx-auto flex min-h-[calc(100vh-72px)] max-w-[1400px] flex-col px-4 pb-24 pt-5 md:px-8">
  <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-3 py-2 backdrop-blur-xl">
    <div className="flex items-center gap-2 text-xs text-slate-300"><span className="h-2 w-2 rounded-full bg-emerald-400"/><span>Local AI · No API key</span></div>
    <div className="relative">
      <button onClick={()=>setModelMenu(v=>!v)} className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111827]/5 px-3 py-2 text-xs text-slate-200 hover:bg-[#111827]/10">
        <Brain size={14}/><span>{ai.model.name}</span><ChevronDown size={13}/>
      </button>
      {modelMenu && <div className="absolute right-0 z-30 mt-2 w-[310px] overflow-hidden rounded-2xl border border-white/10 bg-[#111827] p-1.5 shadow-2xl">
        <div className="px-3 py-2 text-[10px] font-semibold tracking-[.16em] text-slate-500">SELECT LOCAL MODEL</div>
        {ai.models.map(m=><button key={m.id} onClick={()=>{ai.setModel(m.id);setModelMenu(false)}} className={`w-full rounded-xl px-3 py-3 text-left ${m.id===ai.modelId?"bg-violet-500/15":"hover:bg-[#111827]/5"}`}>
          <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-100">{m.name}</span><span className="text-[10px] text-slate-500">{m.vram}</span></div>
          <div className="mt-1 text-[11px] text-violet-300">{m.role}</div><div className="mt-0.5 text-[11px] text-slate-500">{m.description}</div>
        </button>)}
      </div>}
    </div>
  </div><div className="flex items-center justify-between"><div className="flex items-center gap-3"><img src="/sarthi-icon.png" alt="Sarthi" className="h-11 w-11 rounded-2xl"/><div><h1 className="text-xl font-semibold text-slate-900">Sarthi AI</h1><p className="text-[11px] text-slate-400">Tutor • Observer • Planner • Decision Support</p></div></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-600">LOCAL AI</span></div>
 <div className="mt-4 grid grid-cols-3 gap-2"><Mini label="Tasks" value={`${tasks.filter(t=>!t.done).length} pending`}/><Mini label="Goals" value={`${goals.length}`}/><Mini label="Schedule" value={`${scheduleBlocks.length} blocks`}/></div>
 {uploading&&<div className="mt-3 rounded-2xl border border-violet-100 bg-violet-50 p-3 text-xs text-slate-500">Reading <b>{fileName}</b>… local PDF extraction / OCR</div>}
 <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[#0f1424]/82 shadow-[0_20px_70px_rgba(75,76,135,.08)] backdrop-blur-xl">
  <div className="flex-1 overflow-y-auto p-4 md:p-6"><div className="mx-auto max-w-3xl space-y-4">
   {messages.length===0&&<div className="py-12 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-gradient-to-br from-violet-400 to-sky-300 text-white shadow-lg"><Sparkles/></div><h2 className="mt-5 text-2xl font-semibold text-slate-900">Think with Sarthi</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">Give Sarthi a question, PDF, note or photo. It observes your saved system before making a recommendation.</p><div className="mt-6 grid gap-2 md:grid-cols-2">{suggestions.map(x=><button key={x} onClick={()=>send(x)} className="rounded-2xl border border-white/10 bg-[#111827]/80 p-3 text-left text-xs text-slate-500 shadow-sm hover:border-violet-200 hover:text-slate-800">{x}</button>)}</div></div>}
   {messages.map(m=><ChatMessage key={m.id} role={m.role} content={m.role==="assistant"?stripProposal(m.content):m.content}/>)}
   {ai.status==="generating"&&messages[messages.length-1]?.content===""&&<div className="flex items-center gap-2 text-xs text-slate-400"><Brain size={14}/> Sarthi is thinking…</div>}
   <div ref={bottom}/>
  </div></div>
  {proposal&&<div className="border-t border-amber-100 bg-amber-50/80 p-3"><div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-[#111827]/80 p-4"><div className="flex items-start gap-3"><div className="soft-icon h-10 w-10 text-amber-500"><CalendarClock size={18}/></div><div className="min-w-0 flex-1"><div className="text-sm font-semibold text-slate-800">Sarthi wants permission to change your schedule</div><div className="mt-1 text-xs leading-5 text-slate-500">{proposal.reason}</div><div className="mt-3 space-y-2">{proposal.changes.map((c,i)=><div key={i} className="rounded-xl bg-[#171d30] text-xs text-slate-600">{c.action.toUpperCase()} • {c.title||c.id}{c.date?` • ${c.date} ${c.start||""}-${c.end||""}`:""}</div>)}</div><div className="mt-4 flex gap-2"><button onClick={applyProposal} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white"><Check size={14}/> Yes, apply changes</button><button onClick={()=>setProposal(null)} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-500"><X size={14}/> No</button></div></div></div><div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400"><ShieldCheck size={12}/> AI cannot change your schedule without your approval.</div></div></div>}
  {attachmentText&&<div className="mx-auto mb-2 flex max-w-3xl items-center gap-2 rounded-2xl border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-xs text-slate-200"><FileText size={14} className="text-violet-300"/><span className="min-w-0 flex-1 truncate">{fileName}</span><button type="button" onClick={()=>{setAttachmentText("");setFileName("")}} className="rounded-lg p-1 text-slate-400 hover:text-white"><X size={14}/></button></div>}
  <form onSubmit={e=>{e.preventDefault();send()}} className="border-t border-white/10 p-3"><div className="mx-auto flex max-w-3xl items-end gap-2 rounded-[22px] border border-white/10 bg-[#111827]/92 p-2 shadow-sm"><div className="relative"><button type="button" aria-label="Attach" onClick={()=>setShowAttach(v=>!v)} className="grid h-11 w-11 place-items-center rounded-2xl text-slate-400 hover:bg-violet-50 hover:text-violet-600"><Paperclip size={18}/></button>{showAttach&&<div className="absolute bottom-14 left-0 z-20 w-56 rounded-2xl border border-white/10 bg-[#111827] p-2 shadow-2xl"><button type="button" onClick={()=>fileRef.current?.click()} className="flex w-full items-center gap-3 rounded-xl p-3 text-xs text-slate-600 hover:bg-violet-50"><FileText size={16} className="text-violet-500"/>PDF / file</button><button type="button" onClick={()=>imageRef.current?.click()} className="flex w-full items-center gap-3 rounded-xl p-3 text-xs text-slate-600 hover:bg-violet-50"><ImageIcon size={16} className="text-violet-500"/>Gallery photo</button><button type="button" onClick={()=>cameraRef.current?.click()} className="flex w-full items-center gap-3 rounded-xl p-3 text-xs text-slate-600 hover:bg-violet-50"><Camera size={16} className="text-violet-500"/>Camera</button></div>}<input ref={fileRef} type="file" accept="application/pdf,.txt,.md" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)uploadSource(f);e.currentTarget.value=""}}/><input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)uploadSource(f);e.currentTarget.value=""}}/><input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)uploadSource(f);e.currentTarget.value=""}}/></div><div className="relative flex-1"><Search size={15} className="absolute left-3 top-3.5 text-slate-300"/><textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}}} rows={1} className="min-h-11 w-full resize-none border-0 bg-transparent py-3 pl-9 pr-2 text-sm shadow-none focus:border-0 focus:shadow-none" placeholder="Ask Sarthi…"/></div>{ai.status==="generating"?<button type="button" onClick={ai.stop} className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-slate-950"><Square size={14}/></button>:<button type="submit" disabled={!input.trim()&&!attachmentText} className="grid h-11 w-11 place-items-center rounded-2xl bg-[#7357e8] text-white disabled:opacity-30"><ArrowUp size={18}/></button>}</div><p className="mx-auto mt-2 max-w-3xl text-center text-[10px] text-slate-400">PDF • photo • camera • gallery • local AI • schedule changes always require approval</p></form>
 </div></main>
}
function Mini({label,value}:{label:string;value:string}){return <div className="card p-3"><div className="text-[10px] font-semibold tracking-[.14em] text-slate-400">{label}</div><div className="mt-1 text-sm font-semibold text-slate-700">{value}</div></div>}
