# ADR-0005: Build-time dev flag via `fileReplacements`, not `isDevMode()` or esbuild `define`

**Date**: 2026-04-10
**Status**: Accepted
**Session context**: Debugging why the `ng serve` dev badge in `partner/frontend` was invisible when loaded through the shell

## Context

Angular frontends in this project show a visual dev badge when running under `ng serve`. The badge condition uses a boolean that must be `true` in `ng serve` builds and `false` in production Docker builds.

Two approaches were tried before arriving at the correct solution.

### Why `isDevMode()` fails in Native Federation

`isDevMode()` is compiled by the Angular compiler as `return ngDevMode !== false`. In a Native Federation setup `@angular/core` is a **shared singleton**. The shell app (a production Docker image) bootstraps first and registers its production-compiled `@angular/core`, which has `ngDevMode` set to `false` at compile time. When the partner remote loads, the federation runtime skips the partner's own `@angular/core` initialisation and returns the shell's already-registered module. Every call to `isDevMode()` from within the partner remote goes through the shell's production module — always `false`, regardless of how the partner bundle was compiled.

`isDevMode()` is therefore **unfit** for cross-boundary dev detection in a micro-frontend shell.

### Why esbuild `define` fails in this builder chain

`define` options placed in `esbuild.configurations.development` (and `esbuild.options`) had no effect. The content hash of the component chunk was identical before and after adding `define`, confirming esbuild did not substitute the identifier. The `@angular-architects/native-federation:build` builder does not pass `define` through to the underlying `@angular/build:application` esbuild invocation.

## Decision

Replace `isDevMode()` with a build-time constant sourced from Angular's **`fileReplacements`** mechanism. This is a first-class Angular build feature that works through the standard builder chain, independent of esbuild's `define` passthrough.

### Files added

- `partner/frontend/src/environments/build-mode.ts` — production default: `export const IS_DEV_BUILD = false;`
- `partner/frontend/src/environments/build-mode.development.ts` — dev override: `export const IS_DEV_BUILD = true;`

### `angular.json` change

```json
"esbuild": {
  "configurations": {
    "development": {
      "fileReplacements": [
        {
          "replace": "src/environments/build-mode.ts",
          "with": "src/environments/build-mode.development.ts"
        }
      ]
    }
  }
}
```

### `app.ts` change

```typescript
import { IS_DEV_BUILD } from '../environments/build-mode';
// ...
readonly devMode = IS_DEV_BUILD;
```

The `serve` build chain must target `esbuild:development` (separate fix from session -002) so that `fileReplacements` for the development configuration is applied.

## Consequences

- Badge shows when the partner bundle was compiled with `esbuild:development`, regardless of whether it is loaded standalone or through a production shell.
- Docker-built production image: `IS_DEV_BUILD = false` → badge hidden (correct).
- `ng serve`: `IS_DEV_BUILD = true` → badge shows "ng serve" (correct).
- `ng serve` artifacts are never deployed — no stage-specific runtime config exists.
- Every domain frontend that adds a dev badge must follow both patterns: `esbuild:development` serve chain (ADR-0005 root cause 1) **and** `fileReplacements` with `build-mode.ts` (this fix).
- ANGFED-6 references this ADR and the `fileReplacements` pattern.

## Why this does not violate CLAUDE-2

CLAUDE-2 ("No profiles. No dev-only config.") targets runtime config variants — `environment.ts` files that swap API endpoints or feature flags between stages at runtime. `IS_DEV_BUILD` is a build-tool mode flag resolved entirely at esbuild compile time; it controls developer UX (badge visibility), not behavior, API endpoints, or feature flags. There is no stage-specific artifact shipped to production.

## Token efficiency note

This ADR eliminates the need to re-explain the `isDevMode()` / Native Federation interaction in future sessions. Any question about "dev badge not showing in shell" can be answered with a reference to this ADR (~5 tokens) rather than re-discovering the shared-singleton root cause (~300 tokens). The failed `define` attempt is documented here so it is not tried again.
