# Prototype

## Purpose

Interactive Preact SPA generated from the `../screens/` specs. Zero Figma dependency, zero backend dependency. Exists to validate interaction design before Angular implementation.

## Bounded Context

- Stack: Vite + Preact + TypeScript — no Angular, no shared library
- All data is hardcoded in `app/src/data/ihk-data.ts`
- No API calls, no auth, no persistence
- Dev: `cd app && npm run dev` → port 5174
- Via Traefik: `https://gateway/prototype/` (forward-prototype container in `../docker-compose.yaml`)

## Folder structure

```
prototype/
├── DOMAIN.md        ← this file
└── app/             ← Preact SPA source
    ├── src/
    │   ├── components/   ← one component per screen zone
    │   ├── data/         ← hardcoded IHK sample data
    │   └── utils/        ← command-parser.ts
    ├── package.json
    └── Makefile
```

## Rules

- This folder is a CLAUDE-16 closure. Changes stay inside `prototype/`.
- Conventions from `../DOMAIN.md` and root `CLAUDE.md` apply. Nothing else.
- Do not import from `../../frontend/` (Storybook). Do not import from any domain outside `ux/`.
- Static frame snapshots are generated on demand from `../screens/*/figma-make-prompt.md` via the `/prototype` skill — not stored in the repo.
