# Figma Make Prompt: Sachbearbeiter Command Dashboard

Paste the block below directly into Figma Make.

---

## Prompt

Build a single-page administrative dashboard for German-speaking Sachbearbeiter (clerks) in IHK chamber administration. Three vertically stacked zones, no navigation, no separate pages. Create the 13 frames listed in the Frame Index below.

**Design language:** Light theme. IHK LUX component system — reference: https://lux-demo-dev.gfi.ihk.de/baseline

---

## Design Tokens

### Colors

| Role | Value |
|---|---|
| Page background | `#f0f4f8` |
| Surface / card | `#ffffff` |
| Top nav bar | `#003064` |
| Top nav text / icons | `#ffffff` |
| Secondary nav bar | `#ffffff` + bottom border `#dce3ec` |
| Sidebar background | `#d5e3f0` |
| Primary (IHK blue) | `#0050a0` |
| Primary text on blue | `#ffffff` |
| Navy label | `#003064` |
| Body text | `#1a1a2e` |
| Secondary text | `#555555` |
| Input border default | `#b0bec5` |
| Input border focus | `#0050a0` |
| Input border error | `#c0392b` |
| Error text | `#c0392b` |
| Required asterisk | `#c0392b` |
| Inactive control | `#9e9e9e` |
| Warning / pending | `#e65100` |
| Entity badge — Carnet | `#0050a0` |
| Entity badge — Firma | `#00897b` |
| Entity badge — Prüfung | `#7cb342` |
| Entity badge — System | `#9e9e9e` |
| Sie: bubble background | `#e8f0fa` |
| Aktion: own — background | `#ffffff`, left border `3px #0050a0` |
| Aktion: colleague — background | `#f5f5f5`, no border |
| Aktion: system — background | `#f5f5f5`, left border `3px #9e9e9e` |
| Reset hint background | `#fff3e0`, left border `3px #e65100` |
| TX chip background | `#e65100` |
| Resolution chip (✓) | `#e8f5e9` bg, `#2e7d32` text |
| Jetzt-Linie | `2px #0050a0` |
| Draft badge | `#e65100` bg, white text |

### Typography

| Context | Font | Size | Weight | Color |
|---|---|---|---|---|
| All UI text | Roboto | — | — | — |
| Command Row 1 input | JetBrains Mono / Courier New | 14px | 400 | `#003064` |
| Arbeitsstrahl / token text | JetBrains Mono / Courier New | 13px | 400 | `#003064` |
| Sie: bubble text | JetBrains Mono / Courier New | 13px | 400 | `#003064` |
| Field labels | Roboto | 12px | 500 | `#003064` |
| Body / Aktion: content | Roboto | 13–14px | 400 | `#1a1a2e` |
| Section headings | Roboto | 16px | 500 | `#003064` |
| Secondary / timestamps | Roboto | 10–11px | 400 | `#555555` |
| Bubble label (Sie: / Aktion:) | Roboto | 10px | 500 | `#003064` |

### Component primitives

- **Input fields:** 4px border radius, 1px border, 40px height, label floated above field
- **Buttons — primary filled:** `#0050a0` bg, white text, 4px radius
- **Buttons — navy filled:** `#003064` bg, white text, 4px radius
- **Buttons — secondary outlined:** `#0050a0` border + text, transparent bg, 4px radius
- **Entity badge (pill):** 16px radius, 12px Roboto, white text on role color
- **Resolution chip (✓):** 4px radius, `#e8f5e9` bg, `#2e7d32` text
- **Cards:** `#ffffff`, 4px radius, `box-shadow: 0 1px 3px rgba(0,0,0,0.12)`
- **Chat bubbles:** 12px radius
- **Spacing grid:** 8px base

---

## Shared Components

Define these once; reference them by name in each frame.

### COMP-A — Entity badge
Pill, 16px radius, 12px Roboto white. Variants: Carnet `#0050a0`, Firma `#00897b`, Prüfung `#7cb342`, System `#9e9e9e`.

### COMP-B — Command field
Two rows + one conditional strip, full Zone 2 width. 1px border `#b0bec5`, 40px height on Row 1, 4px radius.

**Row 1 — inline-chip input:**
Resolved tokens appear as inline chips embedded directly in the text input field. Unresolved text is typed after the last chip in the same row. Chips and text coexist in one continuous flow — there is no separate chip strip below Row 1 for resolved tokens.

- **Entity anchor chip (inline, first resolved token):** entity-type badge color (Firma `#00897b`, Carnet `#0050a0`, Prüfung `#7cb342`), white text, pill shape, rendered inside the input field. Removable with Backspace or ×.
- **Action chip (inline, after entity chip):** `#e8f5e9` bg, `#2e7d32` text, `✓` prefix, 4px radius. Rendered inside the input field after the entity chip.
- **TX chip (inline, leftmost when in transaction mode):** `#e65100` bg, white text, no ✓ prefix.
- **Typed text:** monospace, `#003064`, appears immediately after the last chip; this is where the cursor sits.
- Removing any chip removes it and all chips to its right.

**Row 2 (action dialog — COMP-G or COMP-H):**
Appears directly below Row 1 when an actionable state is reached. No gap between Row 1 and the dialog panel — they read as a single connected unit. Hidden when no action is pending.

**Beispiele strip (conditional):**
Label `Beispiele:` in `#555555` 11px + horizontal example-command chips (`#f0f4f8` bg, `#555555` text, 4px radius). Shown only when Row 1 is completely empty. Click fills Row 1 with the example text.

### COMP-C — Sie: bubble
Left-aligned, 16px left margin, max-width ~40%. Background `#e8f0fa`, 12px radius, monospace text. Label `Sie:` above bubble in `#003064` 10px 500; timestamp right of label in `#555555` 10px.

### COMP-D — Aktion: bubble (own)
Right-aligned, 16px right margin, max-width ~60%. Background `#ffffff`, 3px left border `#0050a0`, 12px radius, Roboto text. **Meta row above the bubble (outside card):** timestamp in `#555555` 10px left-aligned, label `Aktion:` in `#003064` 10px 500 right-aligned — both on the same line, sitting 4px above the card top edge. Entity badge first element inside bubble. **↩ button** top-right corner of card: 24×24px, `#0050a0` icon, no background; hover: `#e8f0fa` circle 32px. Tooltip: `Zurücksetzen auf diesen Schritt`.

### COMP-D2 — Aktion: bubble (colleague)
Same as COMP-D but background `#f5f5f5`, no left border, no ↩ button. Meta row above card: timestamp left, colleague name right (in `#555555` 10px). Shows colleague name badge inside bubble instead of entity badge.

### COMP-D3 — Aktion: bubble (system)
Same as COMP-D but background `#f5f5f5`, 3px left border `#9e9e9e`, no ↩ button. Meta row above card: timestamp left, `Aktion:` right. Shows `[System]` grey badge inside bubble.

### COMP-E — Jetzt-Linie
Full-width 2px `#0050a0` horizontal rule. Fixed separator between Zone 3 history and Zone 2 command field.

### COMP-F — Offene Vorgänge sidebar
Full-height left panel, width ~220px, background `#d5e3f0`, no card radius. No outer shadow — panel is flush to the page left edge.

Each Vorgang is an independent entry with its own expand/collapse toggle. Entries are listed top-to-bottom; no grouping by status.

**Collapsed state (always visible):**
- Header row (full-width hit area): entity badge + Vorgang title in `#1a1a2e` 13px 500 + `∨` chevron right-aligned in `#555555`
- Sub-row: clerk name in `#555555` 12px, 8px left indent

**Expanded state (toggle on click anywhere in collapsed rows):**
- Header row: same as collapsed but chevron becomes `∧`
- Entity name row: entity name in `#003064` 13px 500, below header
- Entity detail row: location / status in `#555555` 12px
- Last-action row: timestamp in `#555555` 11px + clerk badge (COMP-A variant) + action label in `#1a1a2e` 13px
- Detail line (if any): `#555555` 12px, indented

The entire entry area (header + sub-row) is the click target for toggling — full-width, no separate chevron-only tap zone.

### COMP-G — Inline dialog panel
Appears directly below Row 2, same width as command field. White bg, 4px radius, `box-shadow: 0 2px 8px rgba(0,0,0,0.08)`. Connected to Row 2 with no gap. Footer: keyboard hints only (no OK/Cancel buttons). ESC always returns to command tokens.

### COMP-H — Progressive form panel (extends COMP-G)
Adds: section counter top-right `N / 3` in `#555555` 11px. Completed-section summary line: `✓ [summary]` in `#2e7d32`, `#f5f5f5` bg, single compressed line per completed section. Fields: LUX standard (4px radius, 1px `#b0bec5`, 40px height).

### COMP-I — Vorgangshistorie panel
Width ~400px, overlays left portion of chat stream. White bg, 4px radius, `box-shadow: 0 4px 12px rgba(0,0,0,0.12)`.

**Header (two lines):**
- Line 1: entity badge + entity name in `#003064` 14px 500 + close (✕) top-right
- Line 2: sub-title — for Firma: Kammer region + legal form (e.g. `München und Oberbayern · GmbH`); for Carnet: status + limit; for Prüfung: Termin + status
- Below header: `Vorgangshistorie` section label, 12px 500 `#003064`

**Entry list:** vertical, chronological (oldest top). Each entry row:
- Left: timestamp or date label in `#555555` 11px
- Left col: clerk name or system source badge (same badge variants as COMP-D)
- Right col: action label `#1a1a2e` 13px
- Detail line (if any): secondary text `#555555` 12px, indented to match right col

Date separators: 1px `#dce3ec` line + centered date label `#555555` 11px.

Source badges per entry: `[Portal]` `#00897b`, `[System]` `#9e9e9e`, `[Allianz]`/`[Zoll]` `#7c3aed`, clerk name `#0050a0` (own) or `#555555` (colleague).

**Trigger:** panel opens automatically when an entity is resolved in Zone 2 command field OR when a Vorgang is clicked in COMP-F sidebar. Panel coexists with any open Zone 2 form — it never replaces or obscures Zone 2.

---

## Frame Index

| Frame | Name | Shows |
|---|---|---|
| F-01 | Base layout | Three-zone shell, empty command field, populated Zone 3 |
| F-02 | State A | Entity resolved: Günther Maschinenbau AG, action hints below |
| F-03 | State B | Relation + method matched: Inhaber wechseln, parameter required |
| F-04 | State C | Fully resolved command, confirmation panel ready |
| F-05 | State D1 | Inline field transform: Limit ändern |
| F-06 | State D2 | Inline entity list: Inhaber wechseln, multiple candidates |
| F-07 | State D3 | Mini-form: Adresse bearbeiten (2–4 fields) |
| F-08 | State E1–E4 | Direct Carnet lookup path (4 sub-states in one frame) |
| F-09 | State F1–F3 + interrupt | Progressive inline form: Firma neu anlegen |
| F-10 | State G | Full-width table: Warenpositionen bearbeiten |
| F-11 | Der Strom | Populated chat history + Vorgangshistorie panel open |
| F-12 | Transaction | TX mode banner + reviewer view |
| F-13 | Reset hint | Staged historic command + amber warning banner |
| F-14 | Entity focus | Vorgangshistorie panel open + Zone 2 form active simultaneously |

---

## Frame Specs

---

### F-01 — Base layout

Three zones, top to bottom:

**Zone 1 — Scope bar (fixed, two tiers, ~80px total):**
```
Tier 1 (~40px, #003064, white text/icons):   BK Musterstadt [logo pill, left]   Katrin · 🔔 · ⚙ · 👤 [right]
Tier 2 (~40px, #ffffff, bottom border #dce3ec):   Heimathafen [workspace label, left, #1a1a2e 14px 500]   ≡ [hamburger right, #555555]
```

**Zone 2 — Command field (vertically centered in middle band):**
- COMP-B with Row 1 empty (show placeholder text), Row 2 empty, Row 3 Beispiele chips visible:
  `günther carnet limit 45000`  `becker adresse`  `prüfung p-012 genehmigen`  `carnet günther inhaber wechseln`  `müller email`
- No preview panel below

**Zone 3 — Der Strom (fills remaining height, scrollable):**
- COMP-F (Offene Vorgänge) as a full-height left sidebar (~220px); chat Strom occupies the remaining width to the right
- COMP-E (Jetzt-Linie) separates history from Zone 2; spans the Strom column only (not over the sidebar)
- Chat history above the Jetzt-Linie: 3–4 Sie:/Aktion: pairs using sample data (see Data section)
- One standalone Aktion: (system event, no preceding Sie:)

**COMP-F content for F-01 (two entries, mixed state):**
```
[Firma] ∧  Limit prüfen                     ← expanded
           Katrin
           Becker Präzisionstechnik GmbH
           München und Oberbayern
  10:02  Thomas  Adresse aktualisiert
                   Gewerbepark 8, 80335 München

[Prüfung] ∨  Genehmigung offen              ← collapsed
             Katrin
```

---

### F-02 — State A: entity resolved

**Command field:**
```
Row 1:  günther▌          ← plain text, entity not yet locked
Row 2:  (no action dialog — entity not yet confirmed)
```

**Preview panel (COMP-G below Row 2):**
```
Günther Maschinenbau AG  ·  [Firma]  ·  Aachen
Aktionen:    anrufen  ·  email  ·  adresse bearbeiten
Verwandt:    Carnet #2024-00456 (aktiv)  ·  Prüfung #2024-P-019 (bestätigt)

(weitertippen oder Tab zum Auswählen)
```

Actions shown as inline keyword chips (not buttons). Tab/arrow keys select. Click also works as secondary affordance.

---

### F-03 — State B: relation + method matched, parameter required

**Command field:**
```
Row 1:  [#2024-00456 ×]  [✓ Inhaber wechseln ×]  ▌
         └ Carnet chip    └ action chip (green)
Row 2:  (action dialog — COMP-G, see below)
```

Entity chip and action chip are rendered inline inside Row 1. Cursor sits after the last chip.

**Preview panel:**
```
Carnet #2024-00456  ·  Günther Maschinenbau AG
→ Inhaber wechseln  ·  Ziel-Firma: ▌
  Vorschlag: Müller Werkzeugbau GmbH  (Space zum Übernehmen)
```

**Mid-typing sub-state (show as inset or annotation):**
```
Row 1:  günther carnet verschieben müll▌
Row 2:  ✓ #2024-00456  ✓ Carnet #2024-00456  ✓ Inhaber wechseln

Preview:  → Ziel-Firma: müll▌  →  Müller Werkzeugbau GmbH  (Space)
```

---

### F-04 — State C: fully resolved, confirmation panel

**Command field:**
```
Row 1:  günther carnet verschieben müller
Row 2:  ✓ #2024-00456  ✓ Carnet #2024-00456  ✓ Inhaber wechseln  ✓ Müller Werkzeugbau GmbH
```

**Confirmation panel (COMP-G, replaces preview):**
```
┌─────────────────────────────────────────────────────────────────────────┐
│  Carnet #2024-00456 · Günther Maschinenbau AG                           │
│  → Inhaber wechseln zu: Müller Werkzeugbau GmbH                        │
│                                                                         │
│  [ENTER zum Ausführen]              [ESC Abbrechen]                     │
└─────────────────────────────────────────────────────────────────────────┘
```

No modal. Panel is below Row 2, inline.

---

### F-05 — State D1: inline field transform

Used when a single scalar parameter cannot be typed as a token (e.g. currency input with validation). Command context shown as fixed label above.

**Command field:**
```
Row 1:  günther carnet limit
Row 2:  ✓ #2024-00456  ✓ Carnet #2024-00456  ✓ Limit ändern
```

**Inline field (COMP-G):**
```
Label:    Carnet #2024-00456 · Günther Maschinenbau AG  →  Limit ändern

Input:    [  45.000 €  _________________________________ ]   ENTER  ESC
           ↑ current value pre-filled
```

TAB or ENTER confirms. ESC returns to resolved State B.

---

### F-06 — State D2: inline entity list

Used when parameter must be chosen from known domain objects and clerk pressed Space without narrowing to one match.

**Command field:**
```
Row 1:  günther carnet inhaber wechseln
Row 2:  ✓ #2024-00456  ✓ Carnet #2024-00456  ✓ Inhaber wechseln
```

**Inline list (COMP-G):**
```
Label:    Carnet #2024-00456  →  Inhaber wechseln zu:

          ○  Müller Werkzeugbau GmbH          (Aachen, aktiv)
          ○  Becker Präzisionstechnik GmbH    (München, aktiv)
          ○  Schmidt & Söhne Logistik KG      (München, gesperrt)

          [weitertippen zum Filtern]           ESC Abbrechen
```

Arrow keys navigate. ENTER selects and executes.

---

### F-07 — State D3: mini-form

Used for 2–4 structured fields (Adresse, Kontakt).

**Command field:**
```
Row 1:  [Becker Präzisionstechnik GmbH ×]  adresse▌
         └ Firma chip (#00897b)
Row 2:  mini-form (COMP-G, directly below Row 1, no gap):
```

**Mini-form (COMP-G):**
```
Header:   Becker Präzisionstechnik GmbH  →  Adresse bearbeiten

          Anrede          [ z.B. Sie, Du                ]
          Straße          [ Gewerbepark                 ]
          Hausnummer / PLZ[ 8        ]  [ 80335         ]
          Ort             [ München                     ]

          ENTER Speichern · TAB nächstes Feld · ESC Abbrechen
```

TAB moves between fields. SHIFT+TAB moves back. No Next/Back buttons.

---

### F-08 — State E1–E4: direct Carnet lookup (4 sub-states)

Show all four as vertically stacked or 2×2 within the frame, labeled E1–E4.

**E1 — Carnet resolved by partial number:**
```
Row 1:  carnet 2024▌
Row 2:  ✓ #2024-00456

Preview:
  Carnet #2024-00456  ·  aktiv  ·  Limit: 45.000 €
  Inhaber:  Günther Maschinenbau AG
  → inhaber wechseln  ·  limit  ·  details
```

**E2 — Action token typed, Aktueller Inhaber visible:**
```
Row 1:  carnet günther inhaber wechseln▌
Row 2:  ✓ #2024-00456  ✓ Carnet #2024-00456  ✓ Inhaber wechseln

Preview:
  #2024-00456  Günther Maschinenbau AG
  → Inhaber wechseln  (Neuen Inhaber eingeben)

  Aktueller Inhaber: Günther Maschinenbau AG   [light grey bg row, full width]

  Vorschläge:  [Müller Werkzeugbau GmbH]  [Becker Präzisionstechnik GmbH]  [Schmidt & Söhne Logistik KG]
               ↑ horizontal chip row — click or type to select

  ↓ Weitertippen um Parameter einzugeben, oder ENTER für Dialog
```

Vorschläge shown as a horizontal row of chips (not vertical list).

**E3 — Parameter typed, Inhaber matched:**
```
Row 1:  carnet 2024 inhaber wechseln müll▌
Row 2:  ✓ #2024-00456  ✓ Inhaber wechseln

Preview:  → Ziel-Firma: müll▌  →  Müller Werkzeugbau GmbH  (Space)
```

**E4 — Fully resolved, confirmation:**
```
Row 1:  carnet günther inhaber wechseln schmidt
Row 2:  ✓ #2024-00456  ✓ Carnet #2024-00456  ✓ Inhaber wechseln  ✓ Schmidt & Söhne Logistik KG

Confirmation panel:
┌──────────────────────────────────────────────────────────────────┐
│  #2024-00456 · Günther Maschinenbau AG                           │
│  → Inhaber wechseln zu: Schmidt & Söhne Logistik KG              │
│                                                                  │
│  [ENTER  zum Ausführen]              [ESC  Abbrechen]            │
└──────────────────────────────────────────────────────────────────┘
```

---

### F-09 — State F1–F3 + interrupt: progressive inline form

Show F1, F2, F3, and F-interrupt as 4 sub-states. Each panel replaces its content in-place — no page transition.

**F1 — Section 1:**
```
Row 1:  firma neu anlegen▌
Row 2:  ✓ Neue Firma anlegen

Panel (COMP-H):
┌────────────────────────────────────────────────────────────────────────┐
│  Neue Firma anlegen                                              1 / 3 │
│                                                                        │
│  Firmenname *    [ ________________________________ ]                   │
│  Rechtsform *    [ GmbH ▾ ]                                           │
│  Kammerbezirk *  [ Aachen ▾ ]                                         │
│                                                                        │
│  TAB → nächster Abschnitt                          ESC Abbrechen       │
└────────────────────────────────────────────────────────────────────────┘
```

**F2 — Section 2, completed summary visible:**
```
Panel (COMP-H):
┌────────────────────────────────────────────────────────────────────────┐
│  Neue Firma anlegen                                              2 / 3 │
│  ✓ Günther Maschinenbau AG · GmbH · Aachen         [#2e7d32, #f5f5f5] │
│                                                                        │
│  Straße *        [ Musterstraße 14                 ]                   │
│  Hausnummer      [ 14    ]                                             │
│  PLZ *           [ 52062 ]    Ort *  [ Aachen      ]                   │
│  Land            [ Deutschland ▾ ]                                     │
│                                                                        │
│  TAB → nächster Abschnitt    SHIFT+TAB ← zurück    ESC Abbrechen      │
└────────────────────────────────────────────────────────────────────────┘
```

PLZ + Ort on same row (30%/70%).

**F3 — Section 3, two summary lines + Zusammenfassung:**
```
Panel (COMP-H):
┌────────────────────────────────────────────────────────────────────────┐
│  Neue Firma anlegen                                              3 / 3 │
│  ✓ Günther Maschinenbau AG · GmbH · Aachen                            │
│  ✓ Musterstraße 14, 52062 Aachen, Deutschland                         │
│                                                                        │
│  Ansprechpartner *  [ R. Günther                   ]                   │
│  Telefon            [ +49 241 8800-0               ]                   │
│  E-Mail             [ r.guenther@guenther-mb.de    ]                   │
│                                                                        │
│  ENTER  Firma anlegen              ESC Abbrechen                       │
│                                                                        │
│  Zusammenfassung:                                                      │
│  ─────────────────────────────────────────────────────────────────     │
│  Günther Maschinenbau AG · GmbH · Kammer Aachen                        │
│  Musterstraße 14, 52062 Aachen                                         │
│  Ansprechpartner: R. Günther · +49 241 8800-0                          │
└────────────────────────────────────────────────────────────────────────┘
```

Footer shows `ENTER Firma anlegen` (not TAB forward) — this is the execution point.

**F-interrupt — Draft saved after ESC:**
```
Offene Vorgänge sidebar (new entry at top):
┌────────────────────────────────────────────────────────────────────────┐
│ [Entwurf]  Firma neu anlegen  ·  2/3 Abschnitte  ·  vor 4 Min         │
│            Günther Maschinenbau AG · GmbH · Aachen                     │
└────────────────────────────────────────────────────────────────────────┘
```

`[Entwurf]` badge: `#e65100` bg, white text, pill.

---

### F-10 — State G: full-width table

Zone 2 expands to fill Zone 3's space. Zone 1 remains fixed.

**Command field:**
```
Row 1:  carnet 456 warenpositionen▌
Row 2:  ✓ #2024-00456  ✓ Warenpositionen bearbeiten
```

**Full-width panel (extends to fill Zone 3 area):**
```
┌────────────────────────────────────────────────────────────────────────────────────┐
│  Warenpositionen · Carnet #2024-00456 · Günther Maschinenbau AG                    │
│                                                                                    │
│  Pos   Beschreibung                    Menge     Einzelwert     Gesamtwert  Zoll-Nr│
│  ───   ────────────────────────────    ─────     ──────────     ──────────  ───────│
│   1    Fräsmaschine CNC-400            2         22.500 €       45.000 €    8459.61│
│   2    Drehmaschine TL-200             1         28.000 €       28.000 €    8458.11│
│   3    Messgerät Typ-B                 4          1.250 €        5.000 €    9031.80│
│  ───   ────────────────────────────    ─────     ──────────     ──────────  ───────│
│   +    [Neue Position hinzufügen]                               Σ 78.000 €         │
│                                                                                    │
│  ENTER Speichern                                                ESC Abbrechen      │
└────────────────────────────────────────────────────────────────────────────────────┘
```

Table: monospace columns, Roboto header row. Editable cells: subtle `#dce3ec` inset border on focus. `+ Neue Position` text in `#0050a0`. Sum row bold, right-aligned.

---

### F-11 — Der Strom: populated chat history

Full chat history visible above the Jetzt-Linie (COMP-E). Command field (COMP-B) anchored below Jetzt-Linie.

**Chat content (top to bottom, oldest first):**

```
Sie:                                               09:14
┌──────────────────────────────────┐
│  günther carnet limit 45000      │   ← COMP-C
└──────────────────────────────────┘

                          Aktion:              09:14
   ┌──────────────────────────────────────────────────┐
   │  [Carnet]  Carnet #2024-00456                    │   ← COMP-D (own, ↩ button)
   │  Günther Maschinenbau AG                         │
   │  Limit geändert: 35.000 → 45.000 €         ↩    │
   └──────────────────────────────────────────────────┘

                          Aktion:              09:31
   ┌──────────────────────────────────────────────────┐
   │  [System]  Carnet #789                           │   ← COMP-D3 (system, no ↩)
   │  Import: Limit adjustiert (Nachtlauf)            │
   └──────────────────────────────────────────────────┘

Sie:                                               10:02
┌──────────────────────────────────┐
│  becker adresse                  │   ← COMP-C
└──────────────────────────────────┘

                          Aktion:              10:02
   ┌──────────────────────────────────────────────────┐
   │  Thomas · Firma Becker                         │   ← COMP-D2 (colleague, no ↩)
   │  Adresse aktualisiert: Hauptstr. 14 → Nr. 16    │
   └──────────────────────────────────────────────────┘

Sie:                                               10:45
┌──────────────────────────────────┐
│  prüfung p-012 genehmigen       │   ← COMP-C
└──────────────────────────────────┘

                          Aktion:              10:45
   ┌──────────────────────────────────────────────────┐
   │  [Prüfung]  Katrin · Prüfung #2024-P-012      │   ← COMP-D (own, ↩ button)
   │  Genehmigt                                  ↩    │
   └──────────────────────────────────────────────────┘

══ Jetzt-Linie (COMP-E) ══════════════════════════════════

[COMP-B — command field, empty]
```

**Vorgangshistorie panel (COMP-I) open on left, overlaying chat stream):**
```
┌────────────────────────────────────────────────────────────┐
│  Vorgangshistorie · Carnet #2024-00456                 ✕   │
│  Günther Maschinenbau AG · aktiv · Limit: 45.000 €         │
│  ↑ ältere Einträge                                         │
│                                                            │
│  2024-03-01  [Portal]  Antrag eingegangen                  │
│              e-ata.de · R. Günther                          │
│  2024-03-02  [System]  Limitprüfung bestanden              │
│  2024-03-03  Thomas  Carnet ausgestellt                  │
│              Limit: 20.000 € · Laufzeit: 12 Monate        │
│  2024-04-10  [System]  Import: Adresse aktualisiert        │
│  2024-04-15  Katrin  Limit geändert                      │
│              20.000 → 35.000 €                             │
│  2024-05-02  Katrin  Limit geändert                      │
│              35.000 → 45.000 €                             │
│  ── Heute ──────────────────────────────────────────       │
│  10:15  Katrin  Inhaber wechseln                         │
│         → Müller Werkzeugbau GmbH                          │
└────────────────────────────────────────────────────────────┘
```

---

### F-12 — Transaction mode

**Transaction banner (above Zone 2, persistent while TX is open):**
```
╔══════════════════════════════════════════════════════════════╗
║  TRANSAKTION  ·  Entwurf  ·  3 Schritte  ·  Katrin        ║
║  [Einreichen zur Prüfung]          [Transaktion verwerfen]   ║
╚══════════════════════════════════════════════════════════════╝
```
Background `#fff3e0`, border `#e65100`. Buttons: primary/secondary variants.

**Command field with TX chip:**
```
Row 1:  günther carnet limit▌
Row 2:  [TX #TX-2024-007]  ✓ #2024-00456  ✓ Carnet #2024-00456  ✓ Limit ändern
         └─ amber bg #e65100, white text, no ✓ prefix — always leftmost
```

**Zone 3 — Transaction card (Entwurf):**
```
10:55  Katrin   TRANSAKTION #TX-2024-007  [Entwurf]
       Schritt 1  Carnet #2024-00456  →  Limit ändern: 35.000 → 45.000 €
       Schritt 2  Firma Becker        →  Adresse aktualisiert
       Schritt 3  Prüfung #2024-P-012 →  Genehmigt
       ── Noch nicht ausgeführt ──────────────────────────
```
Transaction card: amber left border `#e65100`, `[Entwurf]` amber badge.

**Reviewer view (show as second sub-state in frame):**
```
11:20  Thomas   TRANSAKTION #TX-2024-007  [Zur Prüfung]
       Schritt 1  Carnet #2024-00456  Limit: 35.000 € → 45.000 €    ✓
       Schritt 2  Firma Becker        Adresse: Hauptstr. 14 → Nr. 16 ✓
       Schritt 3  Prüfung #2024-P-012 Status: ausstehend → genehmigt ✓
       ────────────────────────────────────────────────────────────
       [ENTER Alle ausführen]     [Schritt ablehnen ▾]    [ESC]
```

---

### F-13 — Reset hint

**Command field with recalled historic command:**
```
Row 1:  günther carnet limit 45000
Row 2:  ✓ #2024-00456  ✓ Carnet #2024-00456  ✓ Limit ändern  ✓ 45.000 €
```

**Reset hint banner (COMP-G variant, between Row 2 and preview area):**
```
┌─────────────────────────────────────────────────────────────────────────┐
│  ⚠ Zurücksetzen auf 09:14 — ENTER macht diese Aktion und alle          │
│    abhängigen Folgeaktionen rückgängig.                                  │
│                                                                         │
│    Rückgängig:  1 abhängige Aktion (Inhaber wechseln, 10:15)  [#c62828] │
│    Erhalten:   2 unabhängige Aktionen (becker adresse, prüfung p-012) [#2e7d32] │
│                                                                         │
│    [ENTER Zurücksetzen + neu ausführen]    [ESC Abbrechen]              │
└─────────────────────────────────────────────────────────────────────────┘
```
Background `#fff3e0`, left border `3px #e65100`. Warning icon `⚠` in `#e65100`. Rückgängig line in `#c62828`. Erhalten line in `#2e7d32`.

Banner appears ONLY when staged tokens match a prior `Sie:` entry. Not shown for new commands.

---

### F-14 — Entity focus: Vorgangshistorie panel + active form

Shows what happens when the clerk selects an entity from COMP-F (sidebar) while a form is already open in Zone 2. Both coexist — the panel shows the entity's full history while Zone 2 continues accepting input.

**Sidebar (COMP-F) — selected entry highlighted:**
```
[Firma]  Becker Präzisionstechnik GmbH     ← selected, subtle highlight
         H. Becker
```

**Zone 3 — Strom with Vorgangshistorie panel (COMP-I) open on left:**
```
┌────────────────────────────────────────────────────────────┐
│  [Firma]  Becker Präzisionstechnik GmbH                ✕   │
│  München und Oberbayern · GmbH                             │
│  Vorgangshistorie                                          │
│  ─────────────────────────────────────────────────────     │
│  10:02  Thomas  Adresse aktualisiert                     │
│                   Gewerbepark 8, 80335 München             │
└────────────────────────────────────────────────────────────┘
```

Panel width ~400px, left-anchored, overlays part of the chat Strom. Rest of Strom visible to the right. No dimming overlay — both areas remain interactive.

**Zone 2 — D3 form (Adresse bearbeiten) simultaneously active:**
```
Row 1:  [Becker Präzisionstechnik GmbH ×]  adresse▌
         └ Firma chip (#00897b, inline)
Row 2:  mini-form (COMP-G, no gap below Row 1):

  Header:  Becker Präzisionstechnik GmbH  →  Adresse bearbeiten

  Anrede          [ z.B. Sie, Du                ]
  Straße          [ Gewerbepark                 ]
  Hausnummer / PLZ[ 8        ]  [ 80335         ]
  Ort             [ München                     ]

  ENTER Speichern · TAB nächstes Feld · ESC Abbrechen
```

Entity header chip (top of form panel): `#00897b` bg, white text, pill — matches the Firma badge. Same entity anchors both the COMP-I panel and the form.

**Key constraint:** COMP-I closes automatically when the entity token is removed from Row 2, or when the clerk clicks ✕. It does NOT close when a form is submitted — the next state would show the result as a new `Aktion:` bubble in the Strom.

---

## Sample Data

**Firmen:**
- Günther Maschinenbau AG, Kammer Aachen, Ansprechpartner: R. Günther, Tel: +49 241 8800-0
- Müller Werkzeugbau GmbH, Kammer Aachen, Ansprechpartner: S. Müller, Tel: +49 241 9900-1
- Becker Präzisionstechnik GmbH, Kammer München, Ansprechpartner: H. Becker, Tel: +49 89 2100-5
- Schmidt & Söhne Logistik KG, Kammer München, Ansprechpartner: W. Schmidt, Tel: +49 89 3300-2

**Carnets:**
- #2024-00456, Inhaber: Günther Maschinenbau AG, Limit: 45.000 €, Status: aktiv
- #2024-00789, Inhaber: Müller Werkzeugbau GmbH, Limit: 20.000 €, Status: aktiv
- #2024-01001, Inhaber: Schmidt & Söhne Logistik KG, Limit: 80.000 €, Status: gesperrt

**Prüfungen:**
- #2024-P-012, Firma: Becker Präzisionstechnik, Termin: 2024-06-15, Status: Genehmigung ausstehend
- #2024-P-019, Firma: Günther Maschinenbau, Termin: 2024-07-03, Status: bestätigt

**Benutzer Katrin:** Kammern Aachen + München. Erlaubt: anrufen, E-Mail, Adresse bearbeiten, Limit ändern, Inhaber wechseln, Prüfung genehmigen. Gesperrt: Carnet stornieren, Firma löschen.

**Benutzer Thomas:** Kammer Aachen only. Erlaubt: anrufen, E-Mail, Adresse bearbeiten. Gesperrt: alle Carnet- und Prüfungs-Mutationen.

Use only the entities listed above — do not invent additional records.

---

## Synonyms (autocomplete wiring)

```
anrufen     = telefon = phone = call = kontakt
email       = mail = schreiben = nachricht
stornieren  = löschen = cancel = delete
verschieben = übertragen = transfer = inhaber wechseln
bearbeiten  = editieren = ändern = update = edit
genehmigen  = freigeben = bestätigen = approve
limit       = kreditlimit = betrag
```

---

## Token resolver rules

Evaluation order: Firma → related entity → action → parameter.

| Input | Step 1 | Step 2 | Step 3 | Step 4 |
|---|---|---|---|---|
| `günther carnet verschieben müller` | Firma: Günther AG | related Carnet: #2024-00456 | action: Inhaber wechseln | param: Müller Werkzeugbau GmbH |
| `günther carnet limit` | Firma: Günther AG | related Carnet: #2024-00456 | action: Limit ändern | — |
| `günther prüfung genehmigen` | Firma: Günther AG | related Prüfung: #2024-P-019 | action: Genehmigen | — |
| `günther adresse` | Firma: Günther AG | — | action: Adresse bearbeiten | — |
| `carnet 2024` | Carnet: #2024-00456 (partial number) | — | — | — |
| `carnet günther` | Carnet: #2024-00456 (via Inhaber name) | — | — | — |
| `carnet günther inhaber wechseln` | Carnet: #2024-00456 | — | action: Inhaber wechseln | — |
| `carnet 2024 inhaber wechseln müller` | Carnet: #2024-00456 | — | action: Inhaber wechseln | param: Müller Werkzeugbau GmbH |

Rules:
- `carnet` / `prüfung` after a Firma token = relation keyword (switch active entity). Never an action synonym.
- `carnet` / `prüfung` as **first token** = direct entity lookup. Next token = partial number OR partial Inhaber name.
- No match on relation type for a Firma → show: `Keine [Carnets / Prüfungen] gefunden für [Firmenname]`

---

## Form hierarchy

| Situation | Pattern | Fields |
|---|---|---|
| One scalar value (Limit, Termin) | Inline token (State B/C) | 1 |
| 2–4 structured fields | D3 mini-form | 2–4 |
| 5–12 fields, sequential | State F progressive | 5–12, sectioned |
| Tabular / spatial layout | State G full-width | any |
| 12+ fields with branching | State F + auto-save draft | 12+ |

---

## Constraints

- Big click panes: all interactive rows, chips, and history entries use full-width / full-row hit areas — no pixel-precise targets; minimise required hand-eye coordination
- No navigation bar, no sidebar nav, no hamburger menu
- No separate detail pages
- No modal dialogs — the command preview IS the confirmation
- No OK/Cancel button pairs — ENTER executes, ESC cancels, always
- No pagination — Offene Vorgänge shows top 5 only
- No empty state illustrations, no onboarding flows
- No gradients, no decorative illustrations
- `carnet`, `prüfung`, `firma`, `kammer` are never action synonyms
