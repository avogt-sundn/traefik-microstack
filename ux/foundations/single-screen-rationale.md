# Foundation: Why One Screen

The Sachbearbeiter dashboard is one page. Not one page with sub-pages. Not one page with tabs that reveal other pages. One page, three zones, zero navigation. This document explains why, with references to systems that got this right and systems that got it wrong.

---

## The problem: context switching is the enemy

A clerk in IHK Carnet administration handles 60–100 Vorgaenge per day across multiple entity types (Firmen, Carnets, Pruefungen) in multiple Kammerbezirke. The entities are heterogeneous: a Firma has addresses and contacts, a Carnet has limits and Inhaber, a Pruefung has deadlines and approval chains. The clerk's experience with each entity type varies — a new hire knows Firmen well but struggles with Carnet limit rules; a veteran does Carnet mutations in their sleep but rarely touches Pruefungen.

Traditional enterprise UIs force the clerk to navigate between these entity types. Each navigation is a context switch: lose the current screen, find the right menu item, wait for the new page, re-orient, act, navigate back. SAP GUI is the canonical bad example — 7400+ transaction codes, each opening a new screen with its own layout. ServiceNow improves this with a unified list-detail pattern but still separates queues from actions from history.

The cost of navigation is not the click. It is the **re-orientation after arrival**. Every screen transition requires the clerk to answer: *Where am I now? What can I do here? How do I get back?* For a high-volume worker this re-orientation tax compounds into hours of lost productivity per week.

---

## The hypothesis: eliminate navigation, eliminate re-orientation

If the clerk never leaves a single screen, they never need to re-orient. The three questions ("Where am I? What's waiting? What can I do?") are answered by three fixed zones that never move, never disappear, never change layout. The clerk's peripheral vision confirms orientation without active reading.

This is not a novel idea. It is the design principle behind every high-performance professional tool that optimizes for sustained throughput:

| System | One-screen principle | What it proves |
|---|---|---|
| Bloomberg Terminal | Single screen, keyboard commands, no page navigation | Financial analysts process thousands of data points per day without losing context. Navigation would be fatal to throughput. |
| Unix shell (bash/zsh) | One prompt, command history, output scrolls above | Operators compose complex operations without leaving the command line. History (↑) is recall, not navigation. |
| Vim/Emacs | One buffer visible, modal commands, no dialog boxes | Programmers edit at the speed of thought because the interface never interrupts with a navigation event. |
| Spotlight / Alfred / Raycast | One input field resolves entities and triggers actions | macOS power users bypass the Finder entirely. The command palette *is* the interface. |
| Superhuman (email) | Single-screen triage, keyboard shortcuts, no folder navigation | Email processing speed doubles vs. Gmail because every action is reachable from the current position. |

And the systems that prove the failure of the alternative:

| System | Navigation-heavy pattern | What it costs |
|---|---|---|
| SAP GUI | Transaction codes → separate screens | Clerks memorize paths instead of doing work. Training costs are measured in months. |
| ServiceNow | List → Detail → Related List → Back | Every ticket interaction is 3–5 page loads. Queue awareness is lost during detail work. |
| Jira | Board → Issue → Sub-task → Back to Board | Developers lose board context when deep in an issue. The board is a separate cognitive space. |
| Oracle Forms | Menu → Form → Tab → Sub-form → Save → Navigate back | Each CRUD operation requires 4–6 navigation steps. No peripheral awareness of queue state. |

---

## The metaphors that make one screen possible

Eliminating navigation requires replacing it with something. The clerk still needs to reach different entity types, perform different actions, see different time horizons. The replacement is not a menu — it is a set of metaphors that compress navigation into in-place state transitions:

### 1. The Command Line (Zone 2)

**Source metaphor:** Unix shell, Spotlight, VS Code Command Palette (Ctrl+Shift+P).

The clerk types tokens. Each token narrows the entity set and updates the available actions. There is no "search results page" — the result *is* the narrowing of the command field's resolution strip. Navigation between entity types happens by typing a different token, not by clicking a different tab.

**Why it works for varying experience levels:** A novice clerk types `günther` and sees all available actions listed. A veteran types `gün car ver mül` and executes in under 2 seconds. The same interface serves both — the difference is how many tokens the clerk needs to type before they recognize the right action. The interface does not punish expertise and does not block novices.

**Discoverability without menus:** A clerk who does not yet know that Carnets exist cannot type `carnet`. To close this gap without adding a navigation menu, the command field in its empty state shows top-level category chips — `[Carnets]  [Firmen]  [Prüfungen]  [Verwaltung]` — as clickable mouse affordances that pre-fill the first token. Clicking `[Carnets]` is equivalent to typing `carnet`. The token model and the chip model are the same mechanism; the chips are a zero-vocabulary entry point for the first day on the job.

**Research support:** Raskin (2000), *The Humane Interface*, argues that a "monotonous" interface (one that works the same way everywhere) reduces cognitive load to near zero because the user never needs to learn a new interaction mode. The command field is monotonous: every entity type, every action, every parameter resolves through the same token-by-token mechanism.

### 2. The River (Zone 3 — Der Strom)

**Source metaphor:** Chat applications (WhatsApp, Slack, iMessage), terminal output, Git log.

Time flows in one direction. The present is at the bottom. The past rises above. New events materialize at the bottom and push older events upward. The clerk never asks "where is the latest event?" — it is always at the foot of the stream.

**Why it works for context switching:** When a clerk returns from a phone call or a bathroom break, they do not need to find a "refresh" button or navigate to a "recent activity" page. They look at the bottom of the Vorgangsstrahl and see exactly what changed while they were away. The stream *is* the answer to "what happened since I last looked?"

**Private vs. shared entries:** The stream contains two semantically distinct entry types. *Vorgangsstrahl* entries (Aktion: bubbles) are shared — they appear in every colleague's view and are the compliance audit record. *Arbeitsstrahl* entries (Sie: bubbles) are private — they record the clerk's own session commands and are not visible to others. Both appear in the same spatial stream, but they are visually distinct: Sie: bubbles carry a lock icon and a hover label "Nur für Sie — nicht im Protokoll." Shared Aktion: bubbles carry a source badge (clerk name, `[System]`, `[Portal]`, `[Allianz]`). The Kassenbuch contract — append-only, irreversible, attributed — applies to Aktion: entries only; Sie: entries are the private shell history.

**Research support:** Carroll & Rosson (1987), *The Paradox of the Active User*, showed that users resist learning new interface paradigms and instead apply metaphors from familiar tools. Chat is the most deeply trained spatial metaphor of the 2020s workforce — "bottom = now" is internalized by anyone who uses a phone. The Strom exploits this without teaching anything new.

### 3. The Kassenbuch (Zone 3 — Vorgangsstrahl)

**Source metaphor:** Double-entry bookkeeping, append-only ledgers, event sourcing.

The Vorgangsstrahl is not a log. It is a **Kassenbuch** — a concept every German Sachbearbeiter already knows from their professional training. A Kassenbuch entry is sequential, attributed, irreversible, and complete (who, what, when, with what result). The Vorgangsstrahl adopts this contract literally: entries are never edited, never deleted, never reordered.

**Why it works for trust:** Clerks in regulated administration must be able to prove what happened and when. A mutable activity log does not provide this guarantee. The Kassenbuch metaphor signals permanence and reliability — the clerk trusts that what they see is what happened, not a filtered or summarized view.

### 4. The Shell History (Zone 3 — Arbeitsstrahl)

**Source metaphor:** Bash history (↑ key), browser history, IDE local history.

The Arbeitsstrahl is private, replayable, and editable-before-execution. It answers "what was I doing before lunch?" and "how did I reach that Carnet last week?" by making the clerk's own command history visible and navigable.

**Why it works for expertise building:** A novice clerk can look at their own Arbeitsstrahl to see the token sequences that worked yesterday. Over time, the repeated patterns become muscle memory. The Arbeitsstrahl is both a safety net (recall what worked) and a training tool (see your own patterns).

---

## The zones as cognitive anchors

The three zones map to three cognitive needs that are stable across all tasks, all entity types, all experience levels:

| Zone | Cognitive need | Stability guarantee |
|---|---|---|
| Zone 1 — Scope bar | "Who am I and what can I see?" | Never scrolls, never hides, never changes layout |
| Zone 2 — Command field | "What am I doing right now?" | Always in the same position, always the same interaction model |
| Zone 3 — Der Strom | "What happened and what's waiting?" | Always below Zone 2, always flows in the same direction |

The clerk's eyes have three fixed points. The peripheral vision confirms: scope (top), action (middle), context (bottom). This is not a dashboard in the BI sense (passive consumption). It is a **workbench** — a fixed spatial arrangement of tools that the craftsperson uses without looking for them.

**Design precedent:** The Bloomberg Terminal achieves this with a fixed four-panel layout that never changes across thousands of different data views. The panels are the cognitive anchor; the content within them changes. Our three zones serve the same function with a simpler geometry.

---

## What this rules out

This design decision has consequences that must be accepted, not negotiated:

1. **No detail pages.** There is no "partner detail view" or "Carnet detail view" as a separate screen. All detail is shown inline in Zone 2 (command resolution) or Zone 3 (stream entries).

2. **No settings page.** Scope is set in Zone 1. Preferences are a command (`einstellungen sprache deutsch`).

3. **No admin section.** Admin actions (user management, Kammer configuration) are commands like any other — they execute through Zone 2 and appear in Zone 3.

4. **No onboarding wizard.** A new clerk starts with the same screen as a veteran. The command field's suggestion mechanism *is* the onboarding — type anything, see what's possible.

5. **No dashboard widgets.** There are no KPI cards, no charts, no metric tiles. The Offene Vorgaenge list in Zone 3 *is* the only "dashboard" content — and it is actionable, not decorative.

---

## The URL contract: one screen does not mean zero URLs

A single-screen application that abandons the URL loses shareability, browser history, back-button behaviour, and test addressability. None of these require page navigation — they require `history.pushState()`.

The design commits to the following URL contract:

| State transition | URL update |
|---|---|
| Entity focused in command field | `/vorgang/{type}/{id}` e.g. `/vorgang/carnet/2024-00456` |
| Inline panel opened (form or detail) | `/vorgang/{type}/{id}/{action}` e.g. `/vorgang/carnet/2024-00456/inhaber-wechseln` |
| Vorgangshistorie sidebar opened | `/vorgang/{type}/{id}/historie` |
| Full-width panel (Zone 3 consumed) | `/vorgang/{type}/{id}/{panel}` e.g. `/vorgang/carnet/2024-00456/warenpositionen` |
| Panel or sidebar closed | Reverts to the entity URL |

`pushState` fires on every transition. No navigation event fires — the screen never unloads. The `popstate` event is intercepted and treated as a state restore inside the current screen: the command field and zones reconstruct from the URL parameters without a reload.

**Consequences:**
- A clerk can share a Vorgang by copying the address bar or using the copy-URL button on the entity header chip.
- Browser history reflects entity-level transitions. A supervisor can reconstruct a clerk's session from history.
- Support can reproduce a bug report from a URL.
- Automated tests navigate directly to `/vorgang/carnet/2024-00456` and the screen restores to that state — no token-typing required per test.
- The back button restores the previous entity state, not the previous page. The clerk never leaves the screen.

This resolves the strongest structural objection to the single-screen model. The choice is not "one screen vs. URLs" — it is "one screen with pushState" vs. "multi-route SPA with page transitions." Both have URLs. Only one eliminates re-orientation.

---

## Accessibility contract: BITV 2.0

The German public sector is bound by BITV 2.0, which implements WCAG 2.1 AA. A command-palette-primary interface is BITV-compliant when implemented correctly. The following are first-class requirements, not afterthoughts:

- **Command field:** `<input role="combobox" aria-autocomplete="list" aria-expanded aria-owns="suggestion-list">`. The suggestion list is a proper `role="listbox"` with `role="option"` children. Screen readers announce the match count and the currently highlighted suggestion on every keystroke.
- **Zone landmarks:** Zone 1 maps to `<header>`, Zone 2 to `<main>`, Zone 3 to `<region aria-label="Vorgangsstrahl">`. Screen reader users navigate by landmark without any additional affordance.
- **Category chips in the empty command field** serve as the mouse and screen-reader entry point for users who cannot type a token without prior vocabulary. They are standard `<button>` elements, not custom widgets.
- **Inline panels** use `role="dialog"` with `aria-modal="false"` (they are not full-screen modals) and `aria-labelledby` pointing to the resolved command label. Focus moves to the first panel field on open; ESC returns focus to the command field.
- **Keyboard contract is the accessibility contract.** TAB, SHIFT+TAB, ENTER, ESC, and ↑ are standard browser keys. No non-standard key bindings are used for required actions.

---

## How complex forms survive without wizards

The hardest objection to the single-screen model: "But we have a 12-field Carnet application form. You can't type that into a command line." Correct — and the answer is not "make the clerk type 12 tokens." The answer is that complex data entry is a *different interaction mode* that Zone 2 supports without breaking the single-screen contract.

### Why wizards exist — and what they actually solve

A wizard solves two problems:

1. **Sequencing** — the user must fill fields in a particular order because later fields depend on earlier choices (e.g. country → postal code format → city autocomplete).
2. **Cognitive chunking** — showing 12 fields at once overwhelms; showing 3 at a time feels manageable.

Both problems are real. But the wizard's *solution* — a separate multi-page flow with Next/Back navigation — introduces three new problems:

- **Loss of context.** The clerk loses sight of the stream, the pending queue, and the scope bar. They are "inside" the wizard, disconnected from their workspace.
- **Non-reversible commitment.** Going "Back" in a wizard often discards subsequent steps. The clerk fears losing work and over-commits to each step.
- **Exit ambiguity.** Can I close this wizard? Will my progress be saved? What if I need to answer a phone call mid-wizard? Every wizard invents its own answer to these questions.

SAP's "Guided Procedures" and ServiceNow's "Record Producers" are canonical examples: multi-step form wizards that isolate the user from their operating context. The user finishes the wizard and must re-orient to the main workspace — the exact re-orientation tax this design eliminates.

### The alternative: progressive inline expansion

Zone 2 already has the D3 pattern (inline multi-field panel). For complex forms, D3 scales via **progressive disclosure within the same spatial slot**:

```
Command:     firma neu anlegen
Row 2:       ✓ Neue Firma anlegen

Below Zone 2 (expanded panel, replacing preview area):
┌────────────────────────────────────────────────────────────────────────┐
│  Neue Firma anlegen                                              1 / 3 │
│                                                                        │
│  Firmenname     [ ________________________________ ]                    │
│  Rechtsform     [ GmbH ▾ ]                                            │
│  Kammerbezirk   [ Aachen ▾ ]                                          │
│                                                                        │
│  [TAB → weiter]                             [ESC Abbrechen]            │
└────────────────────────────────────────────────────────────────────────┘
```

After TAB on the last field of section 1, the panel *replaces its own content* with section 2:

```
┌────────────────────────────────────────────────────────────────────────┐
│  Neue Firma anlegen                                              2 / 3 │
│  ✓ Günther Maschinenbau AG · GmbH · Aachen                            │
│                                                                        │
│  Straße         [ ________________________________ ]                    │
│  Hausnummer     [ ____ ]                                               │
│  PLZ            [ _____ ]   Ort  [ __________________ ]                │
│  Land           [ Deutschland ▾ ]                                      │
│                                                                        │
│  [TAB → weiter]   [SHIFT+TAB ← zurück]         [ESC Abbrechen]        │
└────────────────────────────────────────────────────────────────────────┘
```

Key properties:

| Property | Wizard | Inline expansion |
|---|---|---|
| Occupies full viewport | Yes — the workspace disappears | No — Zone 1 (scope) and Zone 3 (stream) remain visible |
| Navigation model | Next / Back buttons (new interaction to learn) | TAB / SHIFT+TAB (same keys the clerk already uses everywhere) |
| Progress indicator | Step dots or breadcrumb (separate UI element) | `1 / 3` counter + summary line of completed sections |
| Exit semantics | Ambiguous (close? save draft? lose work?) | ESC always means "discard and return to command tokens" — same as every other state |
| Context loss | Complete — no stream, no queue visible | None — peripheral vision still sees Offene Vorgaenge and recent stream entries |
| Resumption | "Where was I?" after interruption | The panel is still there. The command field still shows the tokens that led here. |

### The sequencing problem: field dependencies without page transitions

When field B depends on field A's value (e.g. Rechtsform determines which additional fields appear), the inline panel handles this with **in-place field mutation**:

```
Rechtsform:  [ GmbH ▾ ]    →   shows: Stammkapital, Geschäftsführer
Rechtsform:  [ AG ▾ ]      →   shows: Grundkapital, Vorstand, Aufsichtsrat
Rechtsform:  [ e.K. ▾ ]    →   shows: Inhaber (only one field)
```

The panel's field set changes when the controlling field changes — no page transition, no animation, no Next button. The clerk sees the consequence of their choice immediately in the same spatial position.

This is the pattern used by TurboTax (inline field reveal), Stripe's payment form (card type → field set), and macOS System Preferences (category selection → inline panel content change). All three prove that dependent field sequences do not require page navigation.

### The chunking problem: too many fields at once

Miller's 7±2 limit applies to simultaneous choices, not to sequential ones. The inline panel shows 3–5 fields per section — well within working memory. The completed-section summary line (`✓ Günther Maschinenbau AG · GmbH · Aachen`) compresses previous answers into a single scannable line, freeing working memory for the current section.

This is Sweller's "worked example effect" applied to forms: show the completed part as a compressed result, not as editable fields the user must re-read. The clerk focuses only on what's still open.

### The interruption problem: phone rings mid-form

In a wizard: the clerk must decide whether to abandon (lose work) or rush through (risk errors). There is no "pause" button.

In the inline expansion: the clerk does nothing. The panel stays. Zone 3 continues to update (new stream entries appear). If the clerk needs to act on something urgent, they press ESC — the tokens remain in the command field, the form is discarded, and they handle the interruption. When ready, pressing ↑ recalls the last command tokens and they start over.

For forms where partial state is valuable (long applications), the system can auto-save to a draft Vorgang visible in Offene Vorgaenge:

```
[Entwurf]  Firma neu anlegen  ·  2/3 Abschnitte  ·  vor 4 Min
```

Clicking that row restores the panel at section 2 with all previous answers pre-filled. The clerk never explicitly "saves a draft" — the system preserves state as a natural consequence of the Kassenbuch model (every intention, even incomplete, is an event).

### When inline expansion is not enough

There is one case where the inline panel genuinely cannot serve: when the form requires **spatial layout that exceeds the panel's width** — e.g. a side-by-side comparison of two addresses, or a drag-and-drop reordering of Warenposition items.

For this case, Zone 2 expands to **consume Zone 3 temporarily**:

```
┌────────────────────────────────────────────────────────────────────────┐
│  ZONE 1 — scope bar (unchanged, still visible)                         │
├────────────────────────────────────────────────────────────────────────┤
│  Row 1:  warenposition 456 bearbeiten                                  │
│  Row 2:  ✓ #2024-00456  ✓ Warenpositionen bearbeiten                  │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  FULL-WIDTH PANEL (Zone 3 hidden while this is open)            │  │
│  │                                                                 │  │
│  │  Pos   Beschreibung              Menge    Wert         Zoll-Nr  │  │
│  │  1     Fräsmaschine CNC-400      2        45.000 €     8459.61  │  │
│  │  2     Drehmaschine TL-200       1        28.000 €     8458.11  │  │
│  │  3     [neue Position]           _        _            _        │  │
│  │                                                                 │  │
│  │  [ENTER Speichern]                          [ESC Abbrechen]     │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ── Zone 3 resumes below when panel closes ──────────────────────────  │
└────────────────────────────────────────────────────────────────────────┘
```

Zone 3 is not destroyed — it is pushed below the viewport. The clerk can still scroll down to see the stream if needed. When the panel closes (ENTER or ESC), Zone 3 returns to its normal position. The contract is preserved: Zone 1 never moves, the command field never disappears, ESC always exits.

### The wizard replacement hierarchy

| Complexity | Pattern | Fields | Example |
|---|---|---|---|
| 1 parameter | Inline token (State B/C) | 1 | Limit aendern, Termin verschieben |
| 2–4 fields | D3 mini-form | 2–4 | Adresse bearbeiten, Ansprechpartner |
| 5–12 fields, sequential | Progressive inline expansion | 5–12, sectioned | Firma neu anlegen, Carnet beantragen |
| Spatial/tabular layout | Full-width panel (Zone 3 consumed) | Any | Warenpositionen, Vergleichsansicht |
| >12 fields, branching logic | Progressive expansion + auto-save draft | 12+ | Full Carnet application with Warenprüfung |

Every level uses the same keyboard contract (TAB forward, SHIFT+TAB back, ENTER execute, ESC exit), the same spatial anchor (Zone 2 expands downward, never replaces the scope bar), and the same resumption model (command tokens remain, drafts appear in Offene Vorgaenge).

### What this proves

The wizard pattern exists because designers assumed that "complex form" requires "separate page." It does not. It requires:
1. Chunked presentation (sections of 3–5 fields)
2. Clear progress indication (counter + summary)
3. Reversibility within the current session (SHIFT+TAB, ESC)
4. Interruptibility without data loss (auto-draft)

All four are achievable within a panel that expands inside Zone 2 without ever replacing the clerk's workspace. The single-screen contract holds for forms of any complexity — the panel grows, the screen does not split.

**Design precedent:** Gmail's compose window (expands inline, never navigates away), Notion's inline database rows (complex structured data edited in an expanding panel), Linear's issue creation (multi-field form in a command-palette-style overlay that keeps the board visible behind it).

---

## Validation requirement

The theoretical arguments in this document are necessary but not sufficient. **Before committing to production implementation, run a usability study with five representative IHK Carnet clerks** — ideally one first-week hire, two clerks with one to three years of experience, and two veterans. Measure:

- Task completion time for a set of representative Vorgaenge (Limit ändern, Inhaber wechseln, Firma neu anlegen, Carnet beantragen)
- Error rate and recovery time
- Time-to-first-productive-action for the first-week clerk
- Subjective confidence score after 30 minutes

The comparison baseline should be the clerk's current tool, not a hypothetical Fiori-style SPA. The hypothesis is not that this design beats a well-designed alternative — it is that it beats the system clerks are actually using today. If the study does not support the hypothesis, the design should adapt, not the data.

---

## References

- Raskin, J. (2000). *The Humane Interface.* Addison-Wesley. — Monotonous interfaces, habit formation, zero-cognitive-overhead interaction.
- Carroll, J. M., & Rosson, M. B. (1987). The Paradox of the Active User. In *Interfacing Thought.* MIT Press. — Users apply existing metaphors; design with the metaphors they already have.
- Miller, G. A. (1956). The Magical Number Seven, Plus or Minus Two. *Psychological Review*, 63(2). — Working memory limits; three zones stay within cognitive budget.
- Sweller, J. (1988). Cognitive Load During Problem Solving. *Cognitive Science*, 12(2). — Extraneous load (navigation) competes with germane load (the actual task).
- Nielsen, J. (1994). 10 Usability Heuristics. — #1 Visibility of system status (the stream), #3 User control (ESC always works), #7 Flexibility and efficiency (tokens scale with expertise).
- Cooper, A. (2004). *The Inmates Are Running the Asylum.* — Perpetual intermediates: design for the user who is past novice but not expert. The command field serves all three levels simultaneously.
- Tognazzini, B. (2003). First Principles of Interaction Design. AskTog. — Principle of Consistency (same keyboard contract everywhere), Principle of Defaults (top candidate selected, ENTER confirms). Direct precedent for the candidate list auto-select on single match.
- Gentner, D., & Nielsen, J. (1996). The Anti-Mac Interface. *Communications of the ACM*, 39(8). — Command-line metaphors recover efficiency lost to WIMP; the token field is an Anti-Mac surface made safe by the suggestion layer.
- Buxton, W. (2007). *Sketching User Experiences.* Morgan Kaufmann. — Low-fidelity prototyping as the only honest way to validate novel interaction models before implementation investment. Supports the prototype-first approach of the `ux/prototype/` closure.
- Shneiderman, B. (1983). Direct Manipulation: A Step Beyond Programming Languages. *IEEE Computer*, 16(8). — Entity chips as direct objects; action tokens as manipulations on those objects. The command field is a direct-manipulation surface in text form.
- Bret Victor (2011). Explorable Explanations. worrydream.com. — Immediate feedback as a first-order design constraint. Every token change must produce a visible preview change within one animation frame. Grounds the 50 ms latency target in `instant-command-resolution.mdx`.
