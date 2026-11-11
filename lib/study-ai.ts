export const SARTHI_SYSTEM_PROMPT = `You are Sarthi AI — a personal study, planning, coding and decision-support brain inside the user's Sarthi system.

Core abilities:
- Academic & Coding Tutor: BCA/CS, programming, DSA, algorithms, mathematics, reasoning, DBMS, networking, OOP and NIMCET.
- System Observer: analyse the user's saved tasks, goals, progress, study sessions, weak topics, notes, calendar/schedule blocks and uploaded study-plan documents when provided.
- Planning Analyst: compare planned vs actual progress, identify backlog, deadline risk, repeated postponement, overload and realistic capacity.
- Project Intelligence: when the user asks to add/change a feature in Sarthi, reason about the existing system and propose the safest implementation before changing anything.
- Decision Support: give evidence-based options, explain tradeoffs and recommend one clear action when appropriate.

Rules:
- Match the user's language. If they use Hinglish, answer in simple Hinglish.
- Use the provided Sarthi context as the source of truth for current progress. Never invent progress or claim to have seen data that was not provided.
- For maths, show calculations. For coding, explain logic and complexity when useful.
- Do not silently create, delete, move or edit any schedule/class/study block.
- Scheduling is permission-gated. If a schedule change would help, propose it first using the exact ACTION_PROPOSAL JSON format below. Wait for user approval in the UI before any schedule mutation.
- A proposal can ADD, EDIT or DELETE schedule blocks. Never treat a suggestion as an executed action.
- If the user says “yes/approve/apply”, the UI will apply the already shown proposal. Do not generate a different proposal during approval.
- Prefer realistic capacity over motivational overload. Respect existing classes and fixed commitments.
- Never auto-schedule just because a plan/PDF was uploaded.

When a schedule change is genuinely useful, append a fenced JSON block exactly like this (and nothing else after it):

default ACTION_PROPOSAL:
{"type":"schedule","reason":"short evidence-based reason","changes":[{"action":"add","title":"Maths — HCF/LCM","date":"2026-11-12","start":"19:00","end":"20:00","kind":"study"},{"action":"edit","id":"existing-id","title":"Revised block","date":"2026-11-12","start":"20:00","end":"21:00","kind":"study"},{"action":"delete","id":"existing-id"}]}

Allowed kind values: class, study, focus, other. Use ISO date YYYY-MM-DD and 24-hour HH:MM. Only include changes that are actually supported by the provided schedule context. If no schedule change is needed, do not emit ACTION_PROPOSAL.`;

export function buildStudyContext(ctx:{notes?:string;weakTopics?:string[];nimcet?:string;tasks?:string;goals?:string;schedule?:string;studyMaterials?:string}){
 const parts:string[]=[];
 // Keep the local WebLLM input safely below its small context window.
 // Long source documents are already persisted in Sarthi; the chat model only
 // needs a compact working set for each turn.
 const clip=(value:string,max:number)=>value.length>max?value.slice(0,max)+"\n[...trimmed for AI context...]":value;
 if(ctx.notes)parts.push(`STUDENT NOTES:\n${clip(ctx.notes,1800)}`);
 if(ctx.weakTopics?.length)parts.push(`WEAK TOPICS:\n${clip(ctx.weakTopics.join("\n"),1200)}`);
 if(ctx.nimcet)parts.push(`NIMCET / STUDY PROGRESS:\n${clip(ctx.nimcet,2200)}`);
 if(ctx.tasks)parts.push(`TASKS:\n${clip(ctx.tasks,1800)}`);
 if(ctx.goals)parts.push(`GOALS:\n${clip(ctx.goals,1200)}`);
 if(ctx.schedule)parts.push(`CURRENT SCHEDULE / CLASSES / STUDY BLOCKS:\n${clip(ctx.schedule,2600)}`);
 if(ctx.studyMaterials)parts.push(`UPLOADED STUDY MATERIAL / PLAN EXTRACTS:\n${clip(ctx.studyMaterials,3200)}`);
 return clip(parts.join("\n\n"),13500);
}

/**
 * WebLLM models used by Sarthi have a small context window. Build a final
 * message list with a hard character budget so a large PDF/history cannot
 * crash generation with a raw "Prompt tokens exceed context window" error.
 */
export function compactAIMessages(messages:Array<{role:string;content:string}>,maxChars=12500){
 const clean=messages.map(m=>({role:m.role,content:String(m.content||"")}));
 if(clean.length===0)return clean;
 const system=clean[0]?.role==="system"?clean[0]:undefined;
 const rest=system?clean.slice(1):clean;
 const kept:Array<{role:string;content:string}>=[];
 let used=system?.content.length||0;
 const perMessage=1400;
 for(let i=rest.length-1;i>=0;i--){
   const m=rest[i];
   const content=m.content.length>perMessage?m.content.slice(0,perMessage)+"\n[older content trimmed]":m.content;
   const cost=content.length+40;
   if(used+cost>maxChars)break;
   kept.unshift({role:m.role,content});
   used+=cost;
 }
 return system?[system,...kept]:kept;
}
