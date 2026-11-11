"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { idbStorage } from "./storage";

export type Task = { id:string; title:string; done:boolean; createdAt:string; completedAt?:string };
export type Goal = { id:string; title:string; progress:number; deadline:string };
export type StudyMaterial = { id:string; topic:string; text:string; createdAt:string; fileType?:string };
export type WeakTopic = { id:string; topic:string; score:number; reason:string };
export type ScheduleBlock = { id:string; title:string; date:string; start:string; end:string; type:"class"|"study"|"focus"|"other"; source?:"user"|"ai"; completed?:boolean };
export type Profile = { name:string; email?:string; avatar?:string };
export type NimcetTopic = { id:string; subject:"Mathematics"|"Reasoning"|"Computer"|"English"; topic:string; mastery:number; questions:number; correct:number; lastStudied?:string; lastRevision?:string };
export type StudySession = { id:string; date:string; minutes:number; subject?:string; topic?:string; source:"timer"|"manual" };

type S = {
 profile:Profile|null; tasks:Task[]; goals:Goal[]; notes:string[]; studyMaterials:StudyMaterial[]; weakTopics:WeakTopic[]; scheduleBlocks:ScheduleBlock[]; nimcetTopics:NimcetTopic[]; studySessions:StudySession[];
 setProfile:(p:Profile)=>void; clearProfile:()=>void;
 addStudyMaterial:(topic:string,text:string,fileType?:string)=>void; addWeakTopic:(topic:string,score:number,reason:string)=>void; addNote:(x:string)=>void;
 toggleTask:(id:string)=>void; addTask:(title:string)=>void; removeTask:(id:string)=>void; addGoal:(title:string,deadline?:string)=>void; setProgress:(id:string,p:number)=>void;
 addScheduleBlock:(b:Omit<ScheduleBlock,"id">)=>void; updateScheduleBlock:(id:string,b:Partial<ScheduleBlock>)=>void; removeScheduleBlock:(id:string)=>void; toggleScheduleBlock:(id:string)=>void;
 addNimcetTopic:(b:Omit<NimcetTopic,"id">)=>void; updateNimcetTopic:(id:string,b:Partial<NimcetTopic>)=>void; removeNimcetTopic:(id:string)=>void;
 addStudySession:(b:Omit<StudySession,"id">)=>void;
 resetAll:()=>void;
};

const empty = {profile:null as Profile|null,tasks:[] as Task[],goals:[] as Goal[],notes:[] as string[],studyMaterials:[] as StudyMaterial[],weakTopics:[] as WeakTopic[],scheduleBlocks:[] as ScheduleBlock[],nimcetTopics:[] as NimcetTopic[],studySessions:[] as StudySession[]};

export const useSarthi = create<S>()(persist((set)=>({
 ...empty,
 setProfile:p=>set({profile:p}), clearProfile:()=>set({profile:null}),
 addStudyMaterial:(topic,text,fileType)=>set(s=>({studyMaterials:[{id:crypto.randomUUID(),topic,text,createdAt:new Date().toISOString(),fileType},...s.studyMaterials]})),
 addWeakTopic:(topic,score,reason)=>set(s=>({weakTopics:[{id:crypto.randomUUID(),topic,score,reason},...s.weakTopics]})),
 addNote:x=>set(s=>({notes:[x,...s.notes]})),
 toggleTask:id=>set(s=>({tasks:s.tasks.map(t=>t.id===id?{...t,done:!t.done,completedAt:!t.done?new Date().toISOString():undefined}:t)})),
 addTask:title=>set(s=>({tasks:[...s.tasks,{id:crypto.randomUUID(),title,done:false,createdAt:new Date().toISOString()}]})),
 removeTask:id=>set(s=>({tasks:s.tasks.filter(t=>t.id!==id)})),
 addGoal:(title,deadline="")=>set(s=>({goals:[...s.goals,{id:crypto.randomUUID(),title,progress:0,deadline}]})),
 setProgress:(id,p)=>set(s=>({goals:s.goals.map(g=>g.id===id?{...g,progress:Math.max(0,Math.min(100,p))}:g)})),
 addScheduleBlock:b=>set(s=>({scheduleBlocks:[...s.scheduleBlocks,{...b,id:crypto.randomUUID(),completed:b.completed??false}]})),
 updateScheduleBlock:(id,b)=>set(s=>({scheduleBlocks:s.scheduleBlocks.map(x=>x.id===id?{...x,...b}:x)})),
 removeScheduleBlock:id=>set(s=>({scheduleBlocks:s.scheduleBlocks.filter(x=>x.id!==id)})),
 toggleScheduleBlock:id=>set(s=>({scheduleBlocks:s.scheduleBlocks.map(x=>x.id===id?{...x,completed:!x.completed}:x)})),
 addNimcetTopic:b=>set(s=>({nimcetTopics:[...s.nimcetTopics,{...b,id:crypto.randomUUID()}]})),
 updateNimcetTopic:(id,b)=>set(s=>({nimcetTopics:s.nimcetTopics.map(x=>x.id===id?{...x,...b}:x)})),
 removeNimcetTopic:id=>set(s=>({nimcetTopics:s.nimcetTopics.filter(x=>x.id!==id)})),
 addStudySession:b=>set(s=>({studySessions:[...s.studySessions,{...b,id:crypto.randomUUID()}]})),
 resetAll:()=>set({...empty}),
}),{name:"sarthi-final-fresh-v2",storage:createJSONStorage(()=>idbStorage)}));
