"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { CreateMLCEngine, prebuiltAppConfig } from "@mlc-ai/web-llm";

export type AIModel = {
  id: string;
  name: string;
  role: string;
  description: string;
  vram: string;
};

export const AI_MODELS: AIModel[] = [
  { id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", name: "Qwen 2.5 1.5B", role: "General + Coding", description: "Balanced everyday tutor, coding and DSA", vram: "~1.6 GB" },
  { id: "Llama-3.2-1B-Instruct-q4f16_1-MLC", name: "Llama 3.2 1B", role: "Fast + General", description: "Lightweight everyday assistant and fallback model", vram: "~0.9 GB" },
  { id: "gemma-2-2b-it-q4f16_1-MLC", name: "Gemma 2 2B", role: "Study + Documents", description: "Good for explanations, notes and study material", vram: "~1.9 GB" },
  { id: "Phi-3.5-mini-instruct-q4f16_1-MLC", name: "Phi 3.5 Mini", role: "Coding + Technical", description: "Stronger option for programming and technical answers", vram: "~3.7 GB" },
];

const MODEL_KEY = "sarthi-selected-ai-model";
const FALLBACK = AI_MODELS[0].id;
export type AIStatus = "idle" | "checking" | "loading" | "ready" | "generating" | "error";

export function useWebLLM() {
  const engineRef = useRef<any>(null);
  const loadedModelRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [modelId, setModelIdState] = useState<string>(FALLBACK);
  const [status, setStatus] = useState<AIStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODEL_KEY);
      if (AI_MODELS.some(m => m.id === saved)) setModelIdState(saved!);
    } catch {}
  }, []);

  const setModel = useCallback((id: string) => {
    if (!AI_MODELS.some(m => m.id === id)) return;
    abortRef.current?.abort();
    try { localStorage.setItem(MODEL_KEY, id); } catch {}
    setModelIdState(id);
    setError("");
    // WebLLM engines are model-specific. Release the old engine before loading another model.
    const oldEngine = engineRef.current;
    engineRef.current = null;
    loadedModelRef.current = null;
    if (oldEngine?.unload) { void oldEngine.unload().catch(() => {}); }
    setStatus("idle");
    setProgress(0);
    setProgressText("");
  }, []);

  const initialize = useCallback(async (requestedModel?: string) => {
    const requested = requestedModel || modelId;
    const target = prebuiltAppConfig.model_list.some((m: any) => m.model_id === requested)
      ? requested
      : FALLBACK;
    if (engineRef.current && loadedModelRef.current === target) { setStatus("ready"); return; }
    setError(""); setStatus("checking");
    if (!("gpu" in navigator)) {
      setStatus("error");
      setError("WebGPU is not available. Use the latest Chrome or Edge with hardware acceleration enabled.");
      return;
    }
    try {
      const adapter = await (navigator as any).gpu.requestAdapter();
      if (!adapter) throw new Error("No compatible WebGPU adapter was found on this device.");
      setStatus("loading"); setProgress(0);
      const record = prebuiltAppConfig.model_list.find((m: any) => m.model_id === target);
      if (!record) {
        throw new Error(`Model "${target}" is not available in WebLLM ${"0.2.88"}. Please choose another model.`);
      }
      const options = {
        appConfig: prebuiltAppConfig,
        logLevel: "ERROR" as const,
        initProgressCallback: (report: any) => {
          const p = Math.max(0, Math.min(100, Math.round((report.progress ?? 0) * 100)));
          setProgress(p); setProgressText(report.text || `Loading ${AI_MODELS.find(m => m.id === target)?.name ?? "AI"}… ${p}%`);
        },
      };
      const engine = await CreateMLCEngine(target, options);
      engineRef.current = engine;
      loadedModelRef.current = target;
      setProgress(100); setProgressText(`${AI_MODELS.find(m => m.id === target)?.name ?? "Sarthi AI"} is ready.`); setStatus("ready");
    } catch (e) {
      console.error(e); engineRef.current = null; loadedModelRef.current = null;
      setStatus("error"); setError(e instanceof Error ? e.message : "Selected AI model could not be loaded.");
    }
  }, [modelId]);

  const stop = useCallback(() => { abortRef.current?.abort(); abortRef.current = null; setStatus(s => s === "generating" ? "ready" : s); }, []);

  const generate = useCallback(async (messages: any[], onToken: (token: string) => void) => {
    if (!engineRef.current || loadedModelRef.current !== modelId) await initialize(modelId);
    const engine = engineRef.current;
    if (!engine) throw new Error("Sarthi AI is not initialized.");
    abortRef.current?.abort();
    const controller = new AbortController(); abortRef.current = controller; setStatus("generating");
    try {
      const stream = await engine.chat.completions.create({ messages, temperature: .35, top_p: .9, max_tokens: 700, stream: true });
      let full = "";
      for await (const chunk of stream) {
        if (controller.signal.aborted) break;
        const token = chunk.choices?.[0]?.delta?.content || "";
        if (token) { full += token; onToken(token); }
      }
      return full;
    } finally { abortRef.current = null; setStatus("ready"); }
  }, [initialize, modelId]);

  const selected = AI_MODELS.find(m => m.id === modelId) ?? AI_MODELS[0];
  return { status, progress, progressText, error, initialize, generate, stop, model: selected, modelId, setModel, models: AI_MODELS };
}
