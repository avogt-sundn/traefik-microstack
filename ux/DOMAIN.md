# UX Domain

## Sibling order (CLAUDE-16 §5)

The four sibling folders form a directed chain — each step may read all earlier steps; no step may read a later one:

| Order | Folder | Question | Depends on |
|---|---|---|---|
| 1 | `foundations/` | *Why* — mental models, design constraints | — |
| 2 | `patterns/` | *What* — reusable building blocks | `foundations/` |
| 3 | `screens/` | *How* — patterns composed into a screen spec | `foundations/`, `patterns/` |
| 4 | `prototype/` | *Proof* — screen spec enacted interactively | `foundations/`, `patterns/`, `screens/` |

## Purpose

Owns the **UX design system** for the entire application. Defines interaction patterns, component rules, and usage guidelines that govern consistent user experience across all micro-frontend domains.

Manifests as a live **Storybook** — the authoritative reference that both documents and enables homogeneous UX across the shell, partner-edit, partner-search, and any future domain.

## Bounded Context

- Pattern catalog: when to apply which interaction pattern and why
- Component library: shared Angular components published via the `@traefik-microstack/shared` package or as standalone Storybook stories
- Design tokens: colors, spacing, typography — consumed by all domain frontends
- Decision rules: structured guidance that maps use-case characteristics to pattern choices

All domain frontends are **consumers** of this domain. No domain may define its own interaction patterns without a corresponding entry here.

## Glossary

_No glossary terms defined yet. Add entries here before using German identifiers in code ([CLAUDE-14])._

## Services

| Service | Route | Notes |
|---|---|---|
| `ux` | `/ux` | Nginx-served Storybook build (priority 120) |
| `forward-ng-ux` | `/ux` | Dev-mode socat forward to `localhost:6006` (priority 1100) |
| `forward-prototype` | `/prototype` | Dev-mode socat forward to `localhost:5174` (priority 1100) |

## Folder structure

```
ux/
├── foundations/          ← mental models, UX philosophy, clerk personas
│   └── clerk-mental-model.md + .svg
├── patterns/             ← reusable interaction patterns (MDX, three-section format)
│   ├── search-results.mdx
│   ├── detail-form.mdx
│   └── comparison-view.mdx
├── screens/              ← screen specs: Figma Make prompts + screenshots
│   └── sachbearbeiter-dashboard/
│       ├── figma-make-prompt.md
│       └── screenshots/
├── prototype/            ← CLAUDE-16 closure: Preact SPA
│   ├── DOMAIN.md
│   └── app/              ← Vite + Preact + TypeScript
└── frontend/             ← Storybook (Angular component library)
    └── Dockerfile
```

**Foundations** contain the *why* — mental models and design principles that apply across all screens and patterns.

**Patterns** contain the *what* — reusable interaction components with decision rules. Each MDX file follows a three-section structure:
1. Pattern — name, intent, visual thumbnail
2. When to use — decision rules mapping use-case characteristics → this pattern
3. When not to use — anti-patterns and competing alternatives

**Screens** contain the *how* — concrete screen designs with Figma Make prompts and screenshots for a specific business context. Each screen folder is self-contained and versioned by iterating the prompt file.

| Pattern file | Intent |
|---|---|
| `patterns/search-results.mdx` | Display and navigate large result sets |
| `patterns/detail-form.mdx` | Single-record read/edit with validation |
| `patterns/comparison-view.mdx` | Side-by-side alternative implementations (e.g. competing backends) |
| `patterns/instant-command-resolution.mdx` | Zero-latency token resolution — prefetch, warm-cache, and co-packaging strategies for the command field |

## Storybook

- Framework: Storybook 8 with `@storybook/html-vite` (Angular migration: UX-002)
- Dev port: **6006** (Storybook default)
- Source: `ux/frontend/`
- Published at `/ux` through Traefik

## Prototypes

Interactive Preact prototype app generated from `figma-make-prompt.md` specs. Zero Figma dependency.

- Location: `ux/prototype/` (own CLAUDE-16 closure, governed by `ux/DOMAIN.md` and root `CLAUDE.md`)
- Stack: Vite + Preact + TypeScript (no Angular, no heavy frameworks)
- Dev: `cd ux/prototype/app && npm run dev` → port 5174
- Via Traefik: `https://gateway/prototype/` (forward-prototype container)

Static HTML frame snapshots are generated on demand from `screens/*/figma-make-prompt.md` via the `/prototype` skill — not stored in the repo.

## Deferred

- UX-002: Switch Storybook framework to `@storybook/angular`
- UX-003: Design token file consumed by `platform/shared`
- UX-004: Live story — Search Results pattern
- UX-005: Live story — Comparison View pattern
