# ADR-0015: Browser LLM — Qwen2.5-1.5B as the default model for German inference

**Date**: 2026-05-07  
**Status**: Accepted  
**Session context**: lab/browser-llm HTML demos replaced SmolLM2 with Qwen2.5-1.5B-Instruct

## Context

`lab/browser-llm` runs two HTML demos that infer fully client-side in the browser:

- `transformers.html` — uses `@huggingface/transformers` (ONNX runtime)
- `webllm.html` — uses `@mlc-ai/web-llm` (WebGPU MLC runtime)

The system prompt instructs both to answer exclusively in German (`Antworte ausschließlich auf Deutsch`). The original models (SmolLM2-135M for Transformers.js, SmolLM2-360M for WebLLM) are English-first and produced unreliable German even with this directive — mismatched inflection, random code-switching, or English fallback.

EuroLLM-1.7B was evaluated as an alternative but has no browser-ready model exports (neither ONNX community weights nor MLC prebuilts) as of 2026-05-07.

## Decision

Replace SmolLM2 with **Qwen2.5-1.5B-Instruct** in both runtimes.

| Runtime | Model ID |
|---|---|
| Transformers.js (ONNX) | `onnx-community/Qwen2.5-1.5B-Instruct` |
| WebLLM (MLC) | `Qwen2.5-1.5B-Instruct-q4f16_1-MLC` |

Qwen2.5 has multilingual pretraining including German. At 1.5B parameters it is larger than SmolLM2-360M but still practical for browser inference (~900 MB each). The `q4f16_1` quantization on WebLLM keeps VRAM requirements within reach of typical developer machines.

## Consequences

- German output quality is materially improved with the same system prompt.
- Model download on first use increases from ~135–360 MB to ~900 MB. This is a demo environment; the trade-off is acceptable.
- Future model upgrades should follow the same pattern: prefer models with documented multilingual training; use `onnx-community/<name>` for Transformers.js and `<name>-q4f16_1-MLC` for WebLLM.
- EuroLLM should be reconsidered when browser-ready exports become available — it is purpose-built for European languages and likely to outperform Qwen2.5 on German at the same size.

## Token efficiency note

This ADR avoids future sessions re-evaluating SmolLM2 vs. Qwen2.5, re-discovering the EuroLLM browser-export gap, or re-deriving the correct model ID format for each runtime. All three facts were non-obvious and took investigation to establish.
