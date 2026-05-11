# Screen: Sachbearbeiter Command Dashboard

Single-page administrative dashboard for German-speaking clerks in IHK chamber administration.

## Design intent

Three vertically stacked zones, no navigation, no separate detail pages. All actions execute through a command field; results materialize in a shared timeline. Keyboard-first, dense, professional.

**Big click panes:** all interactive targets are generously sized so the clerk can activate them without precise pointing — reducing hand-eye coordination load. Chips, action rows, and history entries are full-width or full-row hit areas, not pixel-precise buttons.

## Key interaction patterns used

| Pattern | Where |
|---|---|
| Two-row command field (space-to-lock) | Zone 2 |
| Inline parameter typing | Zone 2, State B |
| Direct entity lookup (Carnet without Firma) | Zone 2, State E |
| Current Inhaber visible before action | Zone 2, State E1–E2 |
| From → to confirmation panel | Zone 2, State E4 |
| Transactions — staged peer review | Zone 2 + Zone 3 |
| Arbeitsstrahl / Vorgangsstrahl dual stream | Zone 3 |
| Vorgangshistorie linked to active entity | Zone 3 — panel auto-opens when entity resolved in Zone 2 or clicked in sidebar; shows all history entries for that entity (own + colleagues + system); coexists with open form in Zone 2 |

## Files

| File | Purpose |
|---|---|
| `figma-make-prompt.md` | Full Figma Make prompt — paste directly to generate the screen |
| `screenshots/` | Iteration screenshots from Figma Make runs |

## Iteration log

| Screenshot | Notes |
|---|---|
| `SCR-20260504-mdi.png` | Initial generation |
| `SCR-20260504-mg6.png` | — |
| `SCR-20260504-mhk.png` | — |
| `SCR-20260504-mzb.png` | — |
| `SCR-20260504-n10.png` | — |
| `SCR-20260504-n3a.png` | — |
| `SCR-20260504-now.png` | Two-row chip mechanic visible; aligned spec to match |
| `SCR-20260504-o1m.png` | State E2: `carnet günther inhaber wechseln` — Carnet resolved by Inhaber name; Aktueller Inhaber labeled row; suggestions as horizontal chips; hint text |
| `SCR-20260504-o1s.png` | State E4: fully resolved confirmation — `→ Inhaber wechseln zu: Schmidt & Söhne Logistik KG` inline in card |
| `SCR-20260504-t6e.png` | Zone 3 Strom with full chat history: Sie:/Aktion: pairs; ↩ reset button on own actions; colleague (T. Klein) and system variants visible; Offene Vorgänge sidebar with Firma/Prüfung entries |
| `SCR-20260504-u5y.png` | Vorgangshistorie panel open for selected Firma (Becker Präzisionstechnik GmbH); panel left-overlays Strom; header shows Firma name + Kammer; entry list (T. Klein · Adresse aktualisiert); D3 form (Adresse bearbeiten) simultaneously open in Zone 2; entity header chip `Becker Präzisionstechnik GmbH` anchors both panel and form |
| `SCR-20260505-fzf.png` | Reference iteration used to align styles: dark navy top nav (`#003064`), full-height `#d5e3f0` sidebar with collapsible groups, Aktion: meta row above card, Beispiele example chips in empty command field |
| `SCR-20260505-g34.png` | Confirmed inline-chip model: entity chip and action chip rendered inside Row 1 input field; action dialog (COMP-G mini-form) sits directly below Row 1 with no gap; field layout: Anrede, Straße, Hausnummer+PLZ, Ort |
