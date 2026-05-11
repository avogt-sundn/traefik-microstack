# ADR-0016: Browser LLM — Device-adaptive model selection (mobile vs. desktop)

**Date**: 2026-05-11  
**Status**: Accepted  
**Supersedes**: ADR-0015 (single fixed model per runtime)  
**Session context**: lab/browser-llm upgraded from a single Qwen2.5-1.5B for both runtimes to tiered selection

## Context

ADR-0015 established Qwen2.5-1.5B-Instruct as the default model for both Transformers.js and WebLLM runtimes. That decision was based on desktop inference characteristics. Mobile browsers have fundamentally different constraints:

- WASM heap limits make models above ~500M parameters risky to load
- First-load download over mobile networks at 900 MB is user-hostile
- GPU memory on mobile (where WebGPU is available at all) is insufficient for 1.5B–7B models

A single model ID therefore produces either degraded mobile UX (OOM, multi-minute load) or degraded desktop output quality (if tuned down for mobile).

## Decision

Replace the hardcoded model ID with a `MODELS` map and a `detectDevice()` function in both `transformers.html` and `webllm.html`. The landing page `index.html` also renders the model name dynamically.

**Detection logic:**

```js
const MODELS = {
  mobile: { id: "...", label: "..." },
  desktop: { id: "...", label: "..." }
};

function detectDevice() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    && screen.width < 768;
  return isMobile ? "mobile" : "desktop";
}
```

The iOS regex covers all Apple mobile devices. The Android guard combined with `screen.width < 768` classifies tablets as desktop (they have more RAM and typically have desktop-grade GPU).

**Model tier assignments (2026-05-11):**

| Runtime | Mobile | Desktop |
|---|---|---|
| Transformers.js (ONNX) | Qwen2.5-0.5B-Instruct | Qwen2.5-3B-Instruct |
| WebLLM (MLC) | Qwen2.5-0.5B-Instruct | Qwen2.5-7B-Instruct |

WebLLM can carry a larger desktop model than Transformers.js because MLC WebGPU quantization is more memory-efficient than raw ONNX execution.

## Consequences

- Mobile users get a fast-loading, functional model; desktop users get a higher-quality model.
- `index.html` landing page is now dynamically accurate about which model a given device will use.
- When upgrading model versions, both tiers in both runtimes must be updated (4 model IDs total). This is a mechanical task.
- The `screen.width < 768` threshold will misclassify some edge devices (e.g. a phone in landscape with a wide viewport). Acceptable for a lab demo; production would need the User-Agent Client Hints API.
- EuroLLM (when browser exports become available) should be evaluated at the desktop tier first, then assessed for a mobile-capable variant.

## Token efficiency note

This ADR, combined with the memory entry in `lab-browser-llm-patterns.md`, means future sessions can update model tiers without reading any source file. All four model IDs, the detection logic rationale, and the per-runtime sizing constraints are captured here. Updating model IDs is explicitly flagged as local-LLM-safe.
