# Foundation: Clerk Mental Model (Sachbearbeiter)

The top layer of any administrative system is not its data model or its API — it is the **mental model the clerk brings to the desk**. Sachbearbeiter think in Vorgänge, not in database records. They think in actions they are permitted to take, not in CRUD operations. A system that exposes its data model to the clerk has failed before the first interaction.

The design question is: *which metaphors does this user already know, and how do we surface the system through those metaphors?*

---

## The clerk's mental model

A Sachbearbeiter in administration operates with three stable concepts:

| Concept | What it means to the clerk | Wrong system equivalent |
|---|---|---|
| **Vorgang** | A case with a history, a current state, and pending actions | A database row |
| **Zuständigkeit** | What I am responsible for and permitted to act on | A permission bitmask |
| **Arbeitsschritt** | A discrete action that advances a Vorgang and leaves a trace | A form submit |

The system must speak these three words back to the clerk. Every screen, every search result, every autocomplete suggestion must be expressible in these terms.

---

## The perception layer: how metaphors are presented

Before any interaction, the clerk needs to answer three questions at a glance:

1. **Where am I?** — Which Kammerbezirk, which Vorgang type, which Zuständigkeit scope
2. **What is waiting for me?** — Open Vorgänge in my scope that require action
3. **What can I do right now?** — Actions available from this position without navigation

These map to three UI zones that must be visually stable — the clerk's peripheral vision should confirm orientation without active reading:

```
┌─────────────────────────────────────────────────────────────┐
│  Scope bar   [Kammer: Aachen ▾]  [Benutzer: K. Huber]       │  ← Where am I
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  🔍  günther aachen verschieben müller_              │  │  ← What can I do
│  │      ╰─ Carnet #2024-00456 · Günther Maschinenbau   │  │
│  │         → Zu anderer Firma verschieben: Müller GmbH  │  │
│  │         [ENTER zum Ausführen]                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Offene Vorgänge (3)          Zeitstrahl                    │  ← What is waiting
│  ─────────────────            ─────────────────────────────  │
│  Carnet #456  Limit ändern    09:14 K.Huber  Carnet #789    │
│  Firma Becker Adresse prüfen  10:02 T.Klein  Firma Müller   │
│  Prüfung #12  Genehmigung     10:45 K.Huber  Prüfung #12   │
└─────────────────────────────────────────────────────────────┘
```

---

## The search field is a command interpreter, not a filter

The central search field is the highest-leverage element in the UI. It must do three things simultaneously as the clerk types:

1. **Resolve entities** — find Firmen, Carnets, Prüfungen, Kammern by any token (name, number, partial string)
2. **Expose attributes** — show relevant properties of matched entities (Limit, Inhaber, Status, Adresse)
3. **Offer methods** — show the actions available on matched entities, filtered by the clerk's Zuständigkeit

This is not a search box. It is the clerk's command line — a direct expression of intent over the domain object graph.

### Micro-interaction flow: token-by-token resolution

Each token narrows the entity set **and** updates the available action set. The clerk never sees a results page — they see a continuously narrowing intention:

```
Keystroke sequence          What the system shows
──────────────────          ────────────────────────────────────────────────
"g"                    →    Günther Maschinenbau AG  ·  Gauss Metallbau GmbH
"gün"                  →    Günther Maschinenbau AG                          [entity resolved]
"gün car"              →    Günther Maschinenbau AG  ›  Carnet #2024-00456   [relation followed]
"gün car ver"          →    Günther Maschinenbau AG  ›  Carnet #2024-00456
                                ACTION: Zu anderer Firma verschieben ↵        [method matched]
"gün car ver mül"      →    … verschieben → Müller Werkzeugbau GmbH          [parameter resolved]
[ENTER]                →    Arbeitsschritt ausgeführt · Zeitstrahl aktualisiert
```

Each stage of the flow narrows along three axes simultaneously:
- **Entity axis**: which objects match
- **Relation axis**: which connected objects are in scope
- **Method axis**: which actions are available on the resolved entity, given the clerk's permissions

### The autocomplete contract

The autocomplete is not a suggestion list — it is the **type system made visible**. What it shows is exactly what the domain model permits:

```
resolve(tokens)           →  Entity | null
actions(entity, user)     →  Action[]          ← filtered by Zuständigkeit at query time
parameters(action)        →  ParameterSpec[]   ← e.g. "Ziel-Firma" for verschieben
complete(tokens)          →  CommandPreview    ← the full resolved command before ENTER
```

The synonym layer sits between the clerk's vocabulary and the domain identifiers:

```
"anrufen" = "telefon" = "phone" = "call"    →  action: kontaktAufnehmen(kanal=TELEFON)
"stornieren" = "löschen" = "cancel"         →  action: stornieren()
"verschieben" = "übertragen" = "transfer"   →  action: inhaberWechsel()
```

This decoupling means a French-speaking clerk can type "appeler" and hit the same action. The synonym map is a domain concern, not a UI concern.

---

## Authorization shapes the interface, it does not filter it

A Sachbearbeiter in Kammer Aachen must not see a disabled "Limit ändern" button that is greyed out because they lack the permission. They must not see the button at all. The UI is not a permission display system — it is a **permission-scoped workspace**.

This has one structural consequence: **actions must be filtered at query time, not render time**.

```
POST /search
{
  tokens: ["günther", "carnet", "verschieben"],
  user:   { id: "khuber", kammern: ["aachen"] },
  perms:  ["edit_carnets", "view_firmen"]
}
→ {
  entity:  Carnet #2024-00456,
  actions: [inhaberWechsel, limitAendern],   ← only what khuber can do
  preview: "Zu anderer Firma verschieben"
}
```

The clerk never encounters a dead end. Every path through the command interpreter leads to either a valid action or no result — never to a forbidden one.

---

## Der Strom — a conversation between clerk and system

The history is a **chat transcript**. The clerk already knows this pattern from WhatsApp, Slack, iMessage, Teams — every messaging app they use daily. The command field is anchored at the bottom (like the message input). History flows upward above it. The most recent exchange is directly above the input.

The conversation has two speakers with distinct visual alignment:

- **Sie:** (left-aligned) — the clerk's typed command. What I said.
- **Aktion:** (right-aligned) — the system's response. What happened.

```
      ↑ scroll up to see older exchanges

  ┌──────────────────────────────────────────────────────────────────┐
  │                                                                  │
  │  Sie:                                             09:14          │
  │  ┌────────────────────────────────┐                              │
  │  │  günther carnet limit 45000    │                              │
  │  └────────────────────────────────┘                              │
  │                                                                  │
  │                             Aktion:                    09:14     │
  │            ┌─────────────────────────────────────────────────┐   │
  │            │  Carnet #456 · Günther Maschinenbau AG          │   │
  │            │  Limit geändert: 35.000 → 45.000 €             │   │
  │            └─────────────────────────────────────────────────┘   │
  │                                                                  │
  │                             Aktion:                    09:31     │
  │            ┌─────────────────────────────────────────────────┐   │
  │            │  [System] Carnet #789                           │   │
  │            │  Import: Limit adjustiert (Nachtlauf)           │   │
  │            └─────────────────────────────────────────────────┘   │
  │                                                                  │
  │  Sie:                                             10:02          │
  │  ┌────────────────────────────────┐                              │
  │  │  becker adresse                │                              │
  │  └────────────────────────────────┘                              │
  │                                                                  │
  │                             Aktion:                    10:02     │
  │            ┌─────────────────────────────────────────────────┐   │
  │            │  T. Klein · Firma Becker                        │   │
  │            │  Adresse aktualisiert: Hauptstr. 14 → Nr. 16   │   │
  │            └─────────────────────────────────────────────────┘   │
  │                                                                  │
  │  Sie:                                             10:45          │
  │  ┌────────────────────────────────┐                              │
  │  │  prüfung p-012 genehmigen     │                              │
  │  └────────────────────────────────┘                              │
  │                                                                  │
  │                             Aktion:                    10:45     │
  │            ┌─────────────────────────────────────────────────┐   │
  │            │  K. Huber · Prüfung #2024-P-012                │   │
  │            │  Genehmigt                                      │   │
  │            └─────────────────────────────────────────────────┘   │
  │                                                                  │
  │══════════════════════ Jetzt-Linie ═══════════════════════════════│
  │  [command field — the present moment]                            │
  └──────────────────────────────────────────────────────────────────┘
```

---

### Why chat, not two parallel columns

The earlier design used parallel Arbeitsstrahl/Vorgangsstrahl columns. The chat model is superior because:

1. **The clerk already has the spatial reflex.** Left = what I typed. Right = what came back. Bottom = where I type next. Zero learning cost.
2. **Causality is explicit.** A "Sie:" bubble followed by an "Aktion:" bubble shows cause and effect as a visual pair. No guide lines needed — the pairing is structural.
3. **Colleague and system events integrate naturally.** An "Aktion:" bubble without a preceding "Sie:" is clearly something that happened without the clerk's input — like receiving a message in a group chat.
4. **The ↑ key is shell history AND chat scroll.** Press ↑ with an empty input = recall last command. Exactly like every chat app and every terminal.

---

### The two concepts survive inside the chat

The Arbeitsstrahl and Vorgangsstrahl are not gone — they are rendered differently:

| Old concept | New rendering |
|---|---|
| Arbeitsstrahl entry | "Sie:" bubble (left, blue tint, monospace) |
| Vorgangsstrahl entry (own action) | "Aktion:" bubble (right, white, blue left border) |
| Vorgangsstrahl entry (colleague) | "Aktion:" bubble (right, grey background, no border) |
| Vorgangsstrahl entry (system) | "Aktion:" bubble (right, grey background, grey border) |

The Kassenbuch contract holds: entries are never edited, never deleted, never reordered. The append-only ledger is now rendered as a chat transcript — same guarantees, better spatial metaphor.

---

### Interaction rules

- **↑ in empty command field:** cycles through "Sie:" entries (latest first), restoring tokens — does NOT re-execute
- **Click a "Sie:" bubble:** restores those tokens to command field
- **Click an "Aktion:" bubble:** pre-fills command field with the entity token for follow-up
- **New result after ENTER:** "Aktion:" bubble slides in from below, directly above the Jetzt-Linie
- **Scroll:** up = older, down = newer. Bottom of scroll = present. Always.

---

## Vorgangshistorie — the full entity Kassenbuch

The chat stream shows the clerk's personal conversation with the system. But a Vorgang has a much longer and wider history than any one clerk's actions — it includes customer submissions, colleague work, system imports, external partner responses, and automated rule engines.

This full history lives in the **Vorgangshistorie**: a panel that opens when the clerk selects a specific entity (via Offene Vorgaenge sidebar or by clicking an entity badge in the chat).

### Two views, two questions

| View | Question it answers | Scope | Sources |
|---|---|---|---|
| Chat stream | "What did I do?" | My session, all entities | **Only me + system follow-up events.** Colleague actions never appear here. |
| Vorgangshistorie | "What happened to this entity?" | One entity, full lifecycle | Everyone: me, colleagues, portal, system, external partners |

### The Kassenbuch contract applies to both

Both views share the same underlying guarantees: append-only, sequential, attributed, irreversible. The difference is the lens:

- The chat stream is **first-person**: my commands, my results, chronological within my session
- The Vorgangshistorie is **entity-centric**: everything that ever happened to Carnet #456, from the initial portal submission to the most recent mutation, regardless of who caused it

### Source attribution

Every entry in the Vorgangshistorie carries a source badge that tells the clerk where the event originated:

| Source | Badge | Meaning |
|---|---|---|
| Own action | Clerk name (blue) | I did this |
| Colleague | Clerk name (grey) | Another Sachbearbeiter did this |
| Customer portal | `[Portal]` | The partner submitted via e-ata.de |
| System automation | `[System]` | Nightly import, rule engine, scheduled task |
| External partner | `[Allianz]`, `[Zoll]` | Rückbürge response, customs authority |

This solves the problem the chat stream cannot: when the clerk opens a Vorgang they haven't touched in days, they see everything that happened — including events they never caused and would never see in their own chat history.

### Spatial placement

The Vorgangshistorie opens as a **sidebar panel** (expanding from the Offene Vorgaenge column to ~400px). It overlays the left portion of the chat stream but does not hide the command field — the clerk can still type and execute while the panel is open. Close with ✕ or ESC.

This is not a separate page. It is not a modal. It is a focused lens that the clerk opens, reads, and closes without leaving the single screen.

---

## Why no modal dialogs

A modal dialog is an interruption. It says: *stop what you're doing, answer this question, then return*. For a Sachbearbeiter processing 80 Vorgänge a day, every modal is a context switch — the current Vorgang disappears behind an overlay, peripheral awareness of the Zeitstrahl is lost, and the clerk must re-orient after dismissal.

Modal dialogs also break the command metaphor. The clerk has been building a command token by token — `günther carnet limit` — and is mentally *inside* that command. A modal ejects them from that context into a separate dialog world with its own OK/Cancel contract. The cognitive cost is disproportionate to the task.

**The inline panel is the alternative.** It anchors to the command field and stays within Zone 2. The resolved command label remains visible above the input at all times — the clerk never loses the context that brought them here. ESC always means "back to the tokens I had", not "close this window and figure out where I was".

Three inline variants cover all cases:

| Variant | When to use | Example actions |
|---|---|---|
| **D1 — field transformation** | One scalar parameter | Limit ändern, Termin verschieben |
| **D2 — filtered list** | Parameter must be an existing domain object | Inhaber wechseln, Zuständigkeit übertragen |
| **D3 — mini-form** | 2–4 structured fields | Adresse bearbeiten, Ansprechpartner ändern |

All three share one keyboard contract: **Tab** moves between fields, **ENTER** executes, **ESC** returns to the command tokens. No OK button, no Cancel button — the clerk never has to read a button label to know how to proceed.

The deeper reason: a modal dialog is a UI designer's tool for managing their own uncertainty about context. When the command metaphor is implemented correctly — when the preview line already shows the clerk exactly what will happen — there is nothing left to confirm in a modal. The confirmation *is* the preview.

---

## The Arbeitsstrahl is a commit history — reset, not undo

Traditional undo is a stack: Ctrl+Z pops the last action, then the one before, in strict reverse order. This model breaks when the clerk performed independent actions interleaved with dependent ones — undoing action 5 to fix action 3 would also destroy action 4, even if action 4 touched a completely different entity.

The Arbeitsstrahl uses a different model: **git reset with automatic branch separation**.

---

### The clerk's mental model: one trail

The clerk sees a single linear trail of "Sie:" entries — their personal command history. It looks like a straight line:

```
  Sie: 09:14  günther carnet limit 45000
  Sie: 09:31  becker adresse
  Sie: 10:02  prüfung p-012 genehmigen
  Sie: 10:15  günther carnet inhaber wechseln müller     ← depends on 09:14
  Sie: 10:30  schmidt firma anlegen                      ← independent
```

The clerk never sees branches, never sees a DAG, never manages parallel timelines. One trail, one scroll, one history.

---

### Reset: go back to any point

The clerk can **reset to any prior "Sie:" entry** — by clicking it or by selecting it from a context menu. This means: "I want to be back at the state where this was my last action."

What happens:

1. All entries **after** the reset point are evaluated for **causal dependency**.
2. Entries that **depend** on the reset point (modified the same entity, used its output as input) are marked as undone — their corresponding "Aktion:" results are reversed.
3. Entries that are **causally independent** (touched different entities, had no data dependency on the undone entries) survive automatically — they remain in the trail as if nothing happened.

```
  Reset to 09:14:

  Sie: 09:14  günther carnet limit 45000          ← reset point (kept)
  Sie: 09:31  becker adresse                      ← independent → kept
  Sie: 10:02  prüfung p-012 genehmigen            ← independent → kept
  ╌╌╌ [10:15 günther carnet inhaber wechseln]     ← dependent on Carnet #456 → UNDONE
  Sie: 10:30  schmidt firma anlegen               ← independent → kept
```

The trail re-linearizes. The clerk sees their history minus the undone entries. The undone entries are not destroyed — they are preserved invisibly (like git's reflog) for audit purposes and potential re-application.

---

### The git analogy (internal model, not exposed to the user)

| Git concept | Arbeitsstrahl equivalent |
|---|---|
| Commit | A "Sie:" entry (atomic, named, timestamped) |
| Branch (main) | The clerk's single visible trail |
| `git reset --mixed <commit>` | Reset to a prior entry — undo dependent work, keep independent work |
| Orphaned commits (reflog) | Undone entries preserved for audit, invisible to clerk |
| Separate branch (auto-detected) | Independent work that survives the reset — the system infers this from entity-level causality |
| Rebase/cherry-pick | Re-applying an undone action after the clerk has fixed the earlier state |

The critical design choice: **the clerk never manages branches**. The system determines causality automatically by tracking which entities each "Sie:" entry touched. Two entries are independent if and only if they touched disjoint entity sets. This is computable from the Kassenbuch (every entry records which entity was affected).

---

### Causal dependency rules

Two entries are **causally dependent** if any of these hold:

1. **Same entity**: entry B modified the same entity that entry A modified (e.g. both touched Carnet #456)
2. **Output-as-input**: entry B used a value that entry A produced (e.g. A created a Firma, B assigned a Carnet to that Firma)
3. **Transitive**: if B depends on C and C depends on A, then B depends on A

Two entries are **independent** if none of the above hold. Independent entries survive any reset that doesn't include them directly.

---

### What the clerk sees on reset

1. **Click a "Sie:" bubble** in the chat history (or type `zurück 09:14`)
2. System shows a confirmation preview (same inline pattern as all other actions):
   ```
   → Zurücksetzen auf: 09:14 günther carnet limit 45000
     Rückgängig: 1 abhängige Aktion (Inhaber wechseln)
     Erhalten: 2 unabhängige Aktionen (becker adresse, prüfung genehmigen)
     [ENTER zum Ausführen]   [ESC Abbrechen]
   ```
3. After ENTER: the trail updates, the undone "Aktion:" entries fade out (brief animation), the command field is pre-filled with the reset-point tokens for immediate re-editing.

---

### Re-editing after reset

The most common reason to reset is: "I made a mistake in that action and want to redo it differently." After reset, the command field contains the tokens from the reset point. The clerk modifies one token and presses ENTER — a new, corrected action replaces the old one. The trail continues forward from there.

This is the exact workflow of `git reset` followed by a new commit: go back, fix, continue.

---

### Why not traditional undo

| Traditional undo (Ctrl+Z) | Arbeitsstrahl reset |
|---|---|
| Strict reverse order — must undo 5, 4, 3 to fix 3 | Direct jump to any entry — independent work preserved |
| No visibility of what will be undone | Confirmation preview shows exactly which actions are dependent |
| Unbounded — clerk doesn't know when to stop pressing Ctrl+Z | Targeted — clerk selects the specific point |
| Silent — no record that undo happened | Auditable — the reset itself is a Kassenbuch entry |
| Destroys intermediate state | Preserves undone entries in reflog for compliance |

---

### Audit trail: the reset is itself a Kassenbuch entry

The Vorgangsstrahl records the reset as an event:

```
  Aktion: 10:40  K. Huber · Arbeitsstrahl
  Zurückgesetzt auf 09:14 · 1 Aktion rückgängig gemacht
  Rückgängig: Carnet #456 Inhaber wechseln (10:15)
```

This means: resets are never invisible. The Kassenbuch remains append-only and complete — it now records both the original action AND its reversal. Compliance auditors see the full picture.

---

## Micro-interaction principles

**1. No navigation for common actions.** A clerk who needs to change a Limit should not leave the search result to reach a form. The action executes in context; the result appears in the timeline immediately below.

**2. Reset, not undo.** The clerk can jump to any prior entry in their trail. Causally dependent actions are reversed; independent actions survive. The reset is itself a recorded event — nothing is silently erased.

**3. Keyboard-first.** Sachbearbeiter process high volumes. Mouse-dependent workflows are expensive. Every path through the command interpreter must be completable without lifting hands from the keyboard.

**4. The completion preview is the confirmation dialog.** Before ENTER, the clerk sees the full resolved command in plain German. There is no separate confirmation modal — the preview line *is* the confirmation.

```
  Carnet #2024-00456 · Günther Maschinenbau AG
  → Inhaber wechseln zu: Müller Werkzeugbau GmbH
  [ENTER zum Ausführen]   [ESC zum Abbrechen]
```

---

## The right sequence for building this

1. **Name the clerk's three concepts** (Vorgang, Zuständigkeit, Arbeitsschritt) and map them to domain entities before any UI work
2. **Define the uniform entity interface**: `resolve()`, `actions(user, perms)`, `synonyms`, `history()`
3. **Design the command interpreter** as a domain service — not a UI component
4. **Wire authorization into query time** — the API returns only what the clerk may see and do
5. **Build the timeline as an append-only ledger** at the data layer
6. **Build the UI last** — three zones (scope bar, command field, timeline) that render the domain model, nothing more
