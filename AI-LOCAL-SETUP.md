# Sarthi local AI

Sarthi uses `@mlc-ai/web-llm` 0.2.88. No API key is required.

## Included model choices
- Qwen2.5-1.5B-Instruct-q4f16_1-MLC — general/coding
- Llama-3.2-1B-Instruct-q4f16_1-MLC — fast/general
- gemma-2-2b-it-q4f16_1-MLC — study/documents
- Phi-3.5-mini-instruct-q4f16_1-MLC — coding/technical

The app passes WebLLM's `prebuiltAppConfig` explicitly and validates the selected model ID before initialization. This prevents the `Cannot find model record in appConfig` error caused by an ID not present in the installed WebLLM catalog.

WebGPU is required. Chrome/Edge with hardware acceleration enabled is recommended. The first launch downloads the selected model into the browser cache. Only the selected model is loaded at one time.

The app starts with an empty Sarthi workspace: no sample tasks, goals, schedules, NIMCET progress, or study sessions are seeded.
