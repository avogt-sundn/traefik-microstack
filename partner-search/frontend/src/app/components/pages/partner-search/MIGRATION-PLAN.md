# Migration Plan: Multi-Field Search → Google-Style Single-Input Search

## Overview

Replace the 6-field form (`partnerNr`, `alphacode`, `name`, `street`, `postalCode`, `city`) with a
single text input. A **token analyzer** running on both the frontend (for real-time chip display)
and the backend (as the canonical decision-maker) maps free text to structured `SearchCriteria`.
A new Spring Boot service (`app-partner`) with its own PostgreSQL database replaces the external
`PartnerGatewayService` dependency in the dev/demo environment and owns the server-side tokenizer.

### Fundamental Goals

- **Real-time suggestions**: instant feedback while typing with intelligent suggestions based on your data and search patterns.
- **Entity-aware**: the system knows your data entities (partners, groups, addresses) and their attributes for precise searches.
- **Advanced filters**: use operators for precise filtering and complex queries — e.g. `partnerNr:>100000` or `plz:>80000`.

---

## 1. Token Analyzer Design

### 1.1 Input Syntax — Two Modes

**Implicit mode** (everyday use): user just types naturally.
```
12345 München Musterstraße Müller
```

**Explicit mode** (power user): prefix with `fieldAlias:value` to override ambiguity.
```
plz:801* stadt:München name:Müller & Partner
```

Recognized prefixes: `nr:`, `code:`, `name:`, `str:` / `strasse:`, `plz:` / `zip:`, `stadt:` / `city:`

---

### 1.2 Live Re-Classification as the User Types

The tokenizer runs inside a `valueChanges.pipe(debounceTime(300), distinctUntilChanged())`
subscription, so every edit to the input triggers a full re-tokenization. This means
classification is **not committed until the user stops typing** — partial tokens update their
chips as the token grows:

```
User types: "3"      → too short, no chip
User types: "33"     → too short, no chip
User types: "331"    → [PLZ: 331]         (3 digits, PostalCodeClassifier wins)
User types: "3310"   → [PLZ: 3310]
User types: "33100"  → [PLZ: 33100]       (5 digits, still PostalCode)
User types: "331002" → [Nr: 331002]       (6 digits, PostalCodeClassifier guard fails,
                                           PartnerNumberClassifier takes over)
```

This works because `PostalCodeClassifier.canClassify` checks `^[0-9*]{3,5}$` — six digits
fail that guard, so the token falls through the pipeline to `PartnerNumberClassifier`. No
special handling is required; the priority order resolves it naturally.

---

### 1.3 User Overrule and Classification Locking

Automatic classification can be wrong. The user must be able to correct it without learning
syntax. Two mechanisms work together:

**Mechanism 1 — Implicit re-type**: typing more characters changes the token and the classifier
re-runs automatically (as shown above). Covers the common incremental case.

**Mechanism 2 — Chip click → reclassify dropdown**: each chip is clickable. Clicking opens a
small dropdown listing every field the token *could plausibly* map to. Selecting a different
field rewrites the raw input in-place: the token is prefixed with the explicit prefix syntax
(`nr:33100`, `plz:33100`, etc.) and the input caret is repositioned after it.

```
Chip [PLZ: 33100]  ← user clicks
        ↓
  dropdown opens:
    • PLZ (current)
    • Partnernummer   ← user selects
        ↓
  input rewritten: "... nr:33100 ..."
  chip becomes: [Nr: 33100 🔒]
```

**Mechanism 3 — Power-user explicit prefix**: the user can type `nr:33100` directly. This
bypasses implicit classification entirely. `ExplicitPrefixClassifier` (priority 10) always
fires first and sets `explicit = true` on the resulting token.

**Classification locking**: a token is *locked* when it carries an explicit prefix — either
typed by the user or injected by a chip-click. Locked tokens:
- Are not re-classified on subsequent keystrokes
- Render their chip with a lock icon to signal the override is active
- Release their lock if the user edits away the prefix in the raw input

The canonical source of truth is always the raw text in the input box. Locking is not stored
separately — it is derived purely from the presence of an explicit prefix in the string. This
means undo (`Ctrl+Z`) naturally restores the previous classification.

---

### 1.4 Implicit Classification Rules (applied in order)

| Priority | Rule | Maps to |
|---|---|---|
| 1 | Token matches `^[0-9]{6,20}$` | `partnerNr` |
| 2 | Token matches `^[0-9*]{3,5}$` (short digit sequence / wildcard) | `postalCode` |
| 3 | Token contains a street keyword suffix (case-insensitive): `str`, `straße`, `weg`, `allee`, `platz`, `gasse`, `ring`, `damm`, `ufer`, `stieg` — OR token ends with a house-number pattern (`\s\d+[a-z]?$`) | `street` |
| 4 | Token matches `^[A-Z0-9*]{3,10}$` (all-uppercase + digits, short) | `alphacode` |
| 5 | Token contains only letters (including umlauts), 2–35 chars, single word | `city` (tentative) |
| 6 | Remaining text / multi-word phrases / quoted strings (`"..."`) | `name` |

**Conflict resolution**: if both `postalCode` and `partnerNr` could match, the shorter token wins
`postalCode`. Two short digit tokens → first → postalCode, second → partnerNr (order-based
fallback with warning chip).

**Quoted strings**: `"Müller & Söhne"` → forces the full token → `name` regardless of content.

---

### 1.5 Per-Token Content-Assist (Completion Micro-Search)

After classification, the token enters an interactive completion phase analogous to
content-assist in an IDE: the classified field determines *which* completion endpoint is called,
the partial value is the prefix, and the returned suggestions are valid endings that exist in the
actual partner database.

**Token state machine**:

```
INCOMPLETE  →  fewer characters than the minimum for this field (no chip shown)
CLASSIFYING →  enough chars, classifier running (chip shown with spinner, no completions yet)
COMPLETING  →  classified, completion request in flight (chip shows field label + spinner)
SUGGESTED   →  completions returned, dropdown open (chip shows field label, dropdown below input)
CONFIRMED   →  user selected a suggestion or pressed Enter/Space (chip shows enriched display)
LOCKED      →  explicit prefix present — bypasses completion, auto-confirmed
```

Transition triggers:
- `INCOMPLETE → CLASSIFYING`: token length reaches field minimum (2–3 chars depending on field)
- `CLASSIFYING → COMPLETING`: classifier assigns a field; completion API call fires (debounced 300 ms)
- `COMPLETING → SUGGESTED`: completion response arrives with ≥ 1 result
- `COMPLETING → CONFIRMED`: completion response arrives with 0 results (token is valid but has no
  suggestions; treated as a wildcard and confirmed as-is)
- `SUGGESTED → CONFIRMED`: user picks from dropdown or presses Space/Tab to accept top suggestion
- `CLASSIFYING → LOCKED`: `ExplicitPrefixClassifier` fires; no completion call made

**Completion call per field** (against `GET /api/partner/complete`):

Code-like fields use **prefix search** (`LIKE prefix%`) — users always type them left-to-right.
Text fields use **contains search** (`LIKE %term%`) — a user typing "burg" expects "Hamburg"
and "Augsburg", not only cities that start with "burg". Contains search on text fields requires
the `pg_trgm` PostgreSQL extension and a GIN trigram index; both are **required**, not optional.

| Classified field | Match strategy | Completion query | Enriched display example |
|---|---|---|---|
| `postalCode` | prefix | `postal_code LIKE prefix%` | `33100 — Paderborn` |
| `alphaCode` | prefix | `alpha_code ILIKE prefix%` | `MULL` |
| `partnerNr` | prefix | `partner_number LIKE prefix%` | `331002` |
| `city` | **contains** | `lower(city) LIKE '%' \|\| lower(term) \|\| '%'` | `Hamburg` (for "burg") |
| `street` | **contains** | `lower(street) LIKE '%' \|\| lower(term) \|\| '%'` | `Hauptstraße` (for "straße") |
| `name` | **contains** | `lower(name1) LIKE '%' \|\| lower(term) \|\| '%'` | `Müller GmbH` (for "üller") |

All queries are capped at `partner.complete.max-results` (default: 15). No completion is fired
for tokens carrying an explicit prefix (state `LOCKED`).

**UX flow** (the IDE content-assist analogy):

```
User types: "331"
  → PostalCodeClassifier fires  → state: COMPLETING
  → GET /api/partner/complete?field=postalCode&prefix=331&limit=15
  → response: [
      { value: "33100", display: "33100 — Paderborn" },
      { value: "33102", display: "33102 — Paderborn" },
      { value: "33104", display: "33104 — Paderborn" }
    ]
  → state: SUGGESTED
  → dropdown opens below input

User presses ↓ then Enter (or clicks "33100 — Paderborn")
  → token confirmed as postalCode="33100", chip shows [PLZ: 33100 — Paderborn ✓]
  → state: CONFIRMED
  → dropdown closes, caret moves to next position in input

User types " Mü"
  → new token "Mü", too short → INCOMPLETE
User types " Müll"
  → CityClassifier fires → COMPLETING
  → GET /api/partner/complete?field=city&prefix=Müll&limit=15
  → response: ["Müllheim", "Müllrose"]
  → state: SUGGESTED ...
```

**Final search execution**: the Search button ANDs all confirmed token values and fires
`GET /api/partner/search?q=<raw input>`. The backend re-tokenizes the raw string (which now
contains exact confirmed values, possibly with explicit prefixes injected during chip interactions)
and executes the partner query. Unconfirmed tokens (user did not select from dropdown) are passed
as-is; the backend treats them as prefix wildcards.

**Nothing changes** in the final `PartnerGroupSearchResponse` shape or the treetable display.

---

### 1.6 Tokenizer Output (updated)

```typescript
type TokenState = 'INCOMPLETE' | 'CLASSIFYING' | 'COMPLETING' | 'SUGGESTED' | 'CONFIRMED' | 'LOCKED';

interface CompletionItem {
  value: string;          // the exact value to insert (e.g. "33100")
  display: string;        // enriched label for dropdown (e.g. "33100 — Paderborn")
}

interface TokenizedQuery {
  tokens: RecognizedToken[];
  warnings: string[];
}

interface RecognizedToken {
  raw: string;
  field: keyof SearchCriteria;
  label: string;                          // i18n key, e.g. 'partner.search.fields.postalCode'
  explicit: boolean;                      // true = user-prefixed → chip shows lock icon
  alternatives: (keyof SearchCriteria)[]; // other fields this token could map to → chip dropdown
  state: TokenState;
  completions: CompletionItem[];          // populated when state = SUGGESTED
  confirmedDisplay?: string;              // enriched display after confirmation, e.g. "33100 — Paderborn"
}
```

`SearchCriteria` is assembled from tokens in `CONFIRMED` or `LOCKED` state only at search-fire
time. Tokens still in `COMPLETING` or `SUGGESTED` use their raw value as a prefix wildcard.

---

## 2. UI Design

### 2.1 Template Layout

```
+--------------------------------------------------+
|  [search icon]  331 Müll                    [x]  |
+--------------------------------------------------+
  [PLZ: ...]    [Name: ...]
   ^ COMPLETING  ^ COMPLETING

                    ↓  completion response arrives for "331"

+--------------------------------------------------+
|  [search icon]  331 Müll                    [x]  |
+--------------------------------------------------+
  [PLZ: 331 ⟳]   [Name: Müll ⟳]
  ┌──────────────────────┐
  │ 33100 — Paderborn    │  ← dropdown anchored below active token chip
  │ 33102 — Paderborn    │
  │ 33104 — Paderborn    │
  └──────────────────────┘

                    ↓  user selects "33100 — Paderborn"

+--------------------------------------------------+
|  [search icon]  33100 Müll                  [x]  |  ← input value updated
+--------------------------------------------------+
  [PLZ: 33100 — Paderborn ✓]   [Name: Müll ⟳]
```

- Single `<mat-form-field>` with a `matInput`; cursor position is tracked to identify the active
  token
- Below the input: `<mat-chip-set>` renders one chip per `RecognizedToken`
- Chip visual states:
  - `COMPLETING` / `SUGGESTED`: field label + spinner, then dropdown opens
  - `CONFIRMED`: field label + enriched display + checkmark (`✓`)
  - `LOCKED` (explicit prefix): field label + lock icon (`🔒`)
  - `INCOMPLETE`: no chip rendered
- Completion dropdown is a `MatAutocomplete` panel anchored to the input, filtered to the
  active token's `completions` list
- Chips are color-coded per field type; `alternatives` drives a secondary reclassify action
  visible on hover/focus

### 2.2 Keyboard Help Bar

A single compact line of keyboard hints appears directly below the chip row. It is always
visible while the search field has focus and hidden otherwise (`(focus)` / `(blur)` on the
host element).

```
+--------------------------------------------------+
|  [search icon]  33100 Müll                  [x]  |
+--------------------------------------------------+
  [PLZ: 33100 — Paderborn ✓]   [Name: Müll ⟳]
  ┌──────────────────────┐
  │ Müller GmbH          │
  │ Müllerei Bauer       │
  └──────────────────────┘

  ↑↓ navigate  ·  TAB accept & next  ·  ENTER search  ·  ESC dismiss
```

| Key | Action |
|---|---|
| `↑` / `↓` | Move selection within the open completion dropdown |
| `TAB` | Accept the highlighted completion, close dropdown, advance caret past the confirmed token (ready for the next token) |
| `ENTER` (dropdown open) | Accept highlighted completion, same as TAB |
| `ENTER` (no dropdown) | Execute the partner search with all current tokens |
| `ESC` | Dismiss the open dropdown without accepting; token stays in `COMPLETING` state |
| `Backspace` (at token boundary) | Removes the preceding confirmed token from the raw input and returns it to `INCOMPLETE` |

The help bar is a plain `<div>` with `aria-live="polite"` so screen readers announce it when
focus enters the field. It is not a tooltip — it is always in the DOM when the field is focused
so keyboard-only users see it without any hover interaction.

---

### 2.3 Example Searches Panel

A collapsible panel labelled **"Beispiele"** (or translated via i18n key
`partner.search.examples.title`) sits below the keyboard help bar. It is expanded by default on
first use and collapses after the first successful search (preference stored in `localStorage`).

Each example is a clickable row. Clicking it populates the input field with that string and
immediately runs through classification + completion bootstrap (tokens appear as chips in
`CONFIRMED` state where the value is unambiguous, `SUGGESTED` where completions are available).

```
Beispiele  ▾
────────────────────────────────────────────────────
  123456                   → Suche nach Partnernummer
  33100 Paderborn          → PLZ + Stadt
  Musterstraße 7           → Straße mit Hausnummer
  Müller GmbH              → Name (Freitext)
  MULL* 801*               → Alphacode-Wildcard + PLZ-Bereich
  nr:123456 plz:33100      → Explizite Felder (Experten-Modus)
────────────────────────────────────────────────────
```

Each row has three columns:
- **Query string** — monospaced, clickable, inserted verbatim into the input on click
- **Arrow** — visual separator
- **Description** — plain language explanation, translated via Transloco

The examples list is defined in a static config array (not fetched from the backend) so it
renders instantly without a network call. i18n keys follow the pattern
`partner.search.examples.<n>.query` and `partner.search.examples.<n>.description`.

Example config shape (in `partner-search.config.ts`):

```typescript
static readonly SEARCH_EXAMPLES: SearchExample[] = [
  { query: '123456',              descriptionKey: 'partner.search.examples.partnerNr' },
  { query: '33100 Paderborn',     descriptionKey: 'partner.search.examples.plzCity' },
  { query: 'Musterstraße 7',      descriptionKey: 'partner.search.examples.street' },
  { query: 'Müller GmbH',         descriptionKey: 'partner.search.examples.name' },
  { query: 'MULL* 801*',          descriptionKey: 'partner.search.examples.wildcards' },
  { query: 'nr:123456 plz:33100', descriptionKey: 'partner.search.examples.explicit' },
];
```

---

### 2.4 Footer Buttons

Keep "Reset" and "Search" as-is. "Create New Partner" remains unchanged.

---

## 3. File-by-File Changes

### New: `partner-search-tokenizer.service.ts`
Pure `@Injectable`, zero external deps.
- `tokenize(input: string): TokenizedQuery`
- `detokenize(criteria: SearchCriteria): string` — rebuilds a display string from stored criteria
  (for page reload / back-navigation support)

### New: `partner-search-tokenizer.service.spec.ts`
Test matrix covering:
- Pure digit inputs of various lengths
- Street keywords in various positions
- Quoted name tokens
- Explicit `plz:` / `nr:` prefix overrides
- Mixed realistic inputs (e.g. `"12345 München Musterstr. 7 MULL*"`)

### Modified: `partner-search.html`
- Remove the 6 `<shared-validated-form-field>` instances and the 3 `<div class="search-row">` wrappers
- Add single `<mat-form-field>` with search input, leading search icon, and `MatAutocomplete` panel
- Add `<mat-chip-set>` below the input for real-time token chips
- Add keyboard help bar `<div>` below the chip row, shown only when field is focused
- Add `SEARCH_EXAMPLES` panel below the help bar (`@if (examplesVisible)`) with click handler
- Keep `@if` blocks for the no-results panel and treetable unchanged

### Modified: `partner-search.ts`
- Replace `FormGroup` (6 controls) with `FormControl<string>` (`searchQuery`)
- Remove the 6 `readonly *Validators` fields
- Add `recognizedTokens: RecognizedToken[] = []`
- Add `fieldFocused = false` (controls keyboard help bar visibility)
- Add `examplesVisible = !localStorage.getItem('partner-search-examples-collapsed')`
- Add `applyExample(example: SearchExample)` — sets control value, collapses panel, fires tokenization
- Inject `PartnerSearchTokenizerService` and `PartnerCompletionService`
- Wire `valueChanges.pipe(debounceTime(300), distinctUntilChanged())` → `tokenize()` → update chips → fire completions per token
- `search()` calls `tokenizer.tokenize(rawInput)`, passes `criteria` to `searchService`, collapses examples panel
- `resetForm()` clears the single control and resets token states

### Modified: `partner-search.service.ts`
- Refactor `performSearch()` to accept `SearchCriteria` directly instead of `FormGroup`
- `updateUrlParams()` writes a single `q=<rawInput>` param instead of 6 individual params

### Modified: `partner-search.config.ts`
- Remove `SEARCH_FORM_FIELDS` (no longer needed)
- Add `SEARCH_EXAMPLES: SearchExample[]` static array (see section 2.3)
- Add `SearchExample` interface: `{ query: string; descriptionKey: string }`

### Modified: `validator.constants.ts`
- Replace `atLeastOneFieldValidator` with a simple `minLength(3)` on the raw input control;
  field-level validation is now the tokenizer's responsibility

---

## 4. URL Param Strategy

Switch from:
```
/search?partnerNr=123&name=Müller&city=München
```
to:
```
/search?q=123+Müller+München
```

On `ngOnInit`, read `q` and populate the single control. For backward-compatibility with old
deep-links carrying the 6 individual params, call `detokenize(criteria)` on first load to rebuild
the equivalent query string.

---

## 5. Shared Component Consideration

`<shared-validated-form-field>` is used by other pages and stays untouched. Only
`partner-search.html` drops its usage.

---

## 6. Implementation Sequence

```
Step 1 — Tokenizer service + unit tests (no UI changes yet)
Step 2 — Adapt partner-search.service.ts to accept SearchCriteria directly
Step 3 — Migrate partner-search.ts to single FormControl + tokenizer wiring
Step 4 — Update partner-search.html template
Step 5 — Update URL param encoding/decoding
Step 6 — Integration test: verify existing API call params are correctly populated
```

---

## 7. What Does NOT Change (Frontend)

- `PartnerTreetableService` and `SearchCriteria` interface
- The treetable result display
- `createNewPartner()` flow
- All other pages in the `partner` app

---

---

# Backend Plan: app-partner Service + Infrastructure

---

## B1. Orchestration Strategy (High-Level)

The tokenizer lives in **two places** with a single shared specification:

```
Browser (Angular)
  │
  │  real-time (debounced)
  ├──► Frontend Tokenizer (TypeScript)
  │        └── drives chip display only — UX concern
  │
  │  on Search button
  └──► GET /api/partner/search?q=<raw string>
          │
          ▼
       Traefik  (/api/partner → app-partner)
          │
          ▼
       app-partner  (Spring Boot, Java 25)
          │
          ├──► PartnerQueryTokenizer  ← canonical tokenizer, same rules as frontend
          │         └── TokenizedQuery { criteria, tokens, warnings }
          │
          ├──► PartnerSearchService
          │         └── builds SQL from criteria (ILIKE + full-text)
          │
          └──► PostgreSQL  (postgres-partner)
                    ├── partner table  (GIN index on name_tsv, btree on postal_code / alpha_code)
                    └── partner_group table
```

**Why dual tokenizer?**
- The frontend tokenizer drives instant visual feedback (chips) without a network round-trip.
- The backend tokenizer is the **single source of truth** for what is actually searched. This
  prevents classification drift between client builds and ensures all API consumers (future mobile
  apps, integrations) get identical results.
- Both tokenizers are tested against the same shared specification table (see Section B3).

**API surface exposed by app-partner:**

| Endpoint | Purpose |
|---|---|
| `GET /api/partner/search?q=<raw>` | Smart search — raw string, server tokenizes |
| `GET /api/partner/search/structured` | Backwards-compat — accepts individual query params |
| `GET /api/partner/complete?field=<f>&prefix=<p>&limit=<n>` | **Content-assist completions** — per-field prefix lookup, max `n` results |
| `GET /api/partner/{partnerNumber}` | Single partner detail |
| `GET /api/partner/groups/{groupNumber}/members` | Group member expansion |

The Angular `PartnerGatewayService` (OpenAPI-generated) is **not replaced** — instead the
`environment.apiGatewayUrl` is pointed at the new service and a new `/search?q=` method is added
to the OpenAPI spec.

---

## B2. PostgreSQL Schema (postgres-partner)

```sql
-- Partner and group entities
CREATE TABLE partner (
    id                BIGSERIAL    PRIMARY KEY,
    partner_number    VARCHAR(20)  UNIQUE,
    alpha_code        VARCHAR(10),
    name1             VARCHAR(35),
    name2             VARCHAR(35),
    name3             VARCHAR(35),
    firstname         VARCHAR(35),
    street            VARCHAR(35),
    house_number      VARCHAR(10),
    postal_code       VARCHAR(5),
    city              VARCHAR(35),
    type              CHAR(1)      NOT NULL DEFAULT 'P',   -- 'P' Partner, 'V' Verbund
    group_type        VARCHAR(10),                         -- 'INTERN' | 'EXTERN'
    group_number      BIGINT,
    -- Full-text vector: updated by trigger, searched with GIN index
    name_search_vec   TSVECTOR
        GENERATED ALWAYS AS (
            to_tsvector('german',
                coalesce(name1, '') || ' ' ||
                coalesce(name2, '') || ' ' ||
                coalesce(name3, '') || ' ' ||
                coalesce(firstname, ''))
        ) STORED
);

-- Indexes
CREATE INDEX idx_partner_alpha_code  ON partner (alpha_code);
CREATE INDEX idx_partner_postal_code ON partner (postal_code);
CREATE INDEX idx_partner_city        ON partner (lower(city));
CREATE INDEX idx_partner_name_tsv    ON partner USING GIN (name_search_vec);
CREATE INDEX idx_partner_group_nr    ON partner (group_number);
```

**Seed data**: a Flyway migration `V2__seed_demo_partners.sql` inserts ~500 realistic demo
partners so the search can be exercised immediately after `docker compose up`.

---

## B3. Server-Side Tokenizer — Strategy Pattern Design

### B3.1 Why a Strategy Pattern

A flat priority table in a single method has two failure modes as the field set grows:

1. **Context blindness**: once `postalCode` is claimed by a short digit token, the next short
   digit token should fall through to `partnerNr`. A plain if-else cannot express this without
   accumulating local state inline, which makes the logic hard to follow and impossible to test
   in isolation.

2. **Closed to extension**: adding a new classifiable field (e.g. `birthday`, `email`) means
   editing the central method and reasoning about all existing branches again.

The Strategy pattern solves both: each classifier is an independent class with its own
`canClassify` guard, and a shared `ClassificationContext` object carries the "already claimed"
state through the pipeline run.

---

### B3.2 Core Abstractions

```java
// The shared contract
public interface TokenClassifier {
    /** Lower number = higher priority. */
    int priority();

    /**
     * Returns true if this classifier wants to handle the token.
     * ctx.isFieldClaimed(field) lets classifiers yield when their field is taken.
     */
    boolean canClassify(String token, ClassificationContext ctx);

    /** Called only when canClassify returned true. */
    RecognizedToken classify(String token, boolean explicit);
}

// Mutable state for one tokenization run — passed through the pipeline
public final class ClassificationContext {
    private final Set<String> claimedFields = new HashSet<>();
    private final List<String> allTokens;        // full token list for look-ahead

    public boolean isFieldClaimed(String field)  { return claimedFields.contains(field); }
    public void    claimField(String field)      { claimedFields.add(field); }
    public List<String> getAllTokens()           { return allTokens; }
}

// Output
public record TokenizedQuery(
    SearchCriteria       criteria,
    List<RecognizedToken> tokens,
    List<String>         warnings
) {}

public record RecognizedToken(
    String       raw,
    String       field,
    boolean      explicit,        // true = user-prefixed; chip renders lock icon
    List<String> alternatives     // other fields this token could map to; drives chip dropdown
) {}
```

---

### B3.3 Classifier Implementations

Each classifier is an independent class. The pipeline is assembled by Spring injecting all
`TokenClassifier` beans and sorting them by `priority()`.

| Class | Priority | `canClassify` condition |
|---|---|---|
| `ExplicitPrefixClassifier` | 10 | token starts with a known prefix (`plz:`, `nr:`, `name:`, `str:`, `stadt:`, `code:`) |
| `PartnerNumberClassifier` | 20 | matches `^[0-9]{6,20}$` AND `partnerNumber` not claimed |
| `PostalCodeClassifier` | 30 | matches `^[0-9*]{3,5}$` AND `postalCode` not claimed |
| `StreetClassifier` | 40 | contains a street-suffix keyword (`straße`, `str`, `weg`, `allee`, `platz`, `gasse`, `ring`, `damm`, `ufer`, `stieg`) OR ends with house-number pattern `\s\d+[a-z]?` |
| `AlphaCodeClassifier` | 50 | matches `^[A-Z0-9*]{3,10}$` (no lowercase letters) AND `alphaCode` not claimed |
| `CityClassifier` | 60 | matches `^[\p{L}.\-]{2,35}$` (letters/umlauts, single word) AND `city` not claimed |
| `FallbackNameClassifier` | 999 | always returns `true` — accumulates remaining tokens into `name` |

**How digit ambiguity resolves itself** (no special-casing required):

```
Input: "80331 1234567 München"

Token "80331"   → PostalCodeClassifier  canClassify? yes (5 digits, postalCode free)  → claims postalCode
Token "1234567" → PostalCodeClassifier  canClassify? no  (postalCode already claimed)
                → PartnerNumberClassifier canClassify? yes (7 digits, partnerNumber free) → claims partnerNumber
Token "München" → CityClassifier        canClassify? yes → claims city
```

---

### B3.4 Populating `alternatives` (for the reclassify dropdown)

After the winning classifier is determined, the pipeline runs a **dry-run** over the remaining
classifiers (those that did not win) against the same token using a *read-only copy* of the
context (claimed fields are not changed). Every classifier whose `canClassify` returns true in
this dry-run is added to `alternatives`. This gives the chip dropdown a list of valid
reclassification choices without any extra per-classifier code.

```java
List<String> alternatives = classifiers.stream()
    .filter(c -> c != winner)
    .filter(c -> c.canClassify(token, readOnlyCtx))   // read-only copy, no mutations
    .map(c -> c.classify(token, false).field())
    .toList();
```

Because `FallbackNameClassifier` always returns true, `name` will almost always appear in
`alternatives` — which is correct: the user can always force any token into the name field.

---

### B3.6 `TokenizerPipeline` (the assembler)

```java
@Service
public class TokenizerPipeline {

    private final List<TokenClassifier> classifiers;   // injected sorted by priority()

    public TokenizerPipeline(List<TokenClassifier> classifiers) {
        this.classifiers = classifiers.stream()
            .sorted(Comparator.comparingInt(TokenClassifier::priority))
            .toList();
    }

    public TokenizedQuery tokenize(String input) {
        List<String> rawTokens = Tokenizer.split(input);   // respects quoted strings
        ClassificationContext ctx = new ClassificationContext(rawTokens);
        List<RecognizedToken> recognized = new ArrayList<>();

        for (String token : rawTokens) {
            boolean explicit = ExplicitPrefixClassifier.hasPrefix(token);
            classifiers.stream()
                .filter(c -> c.canClassify(token, ctx))
                .findFirst()
                .ifPresent(c -> {
                    RecognizedToken rt = c.classify(token, explicit);
                    recognized.add(rt);
                    ctx.claimField(rt.field());
                });
        }

        return TokenizedQuery.from(recognized, ctx.warnings());
    }
}
```

---

### B3.7 Frontend Mirror (TypeScript)

The same pattern applies in the Angular `PartnerSearchTokenizerService`. The interface and
pipeline are idiomatic TypeScript:

```typescript
interface TokenClassifier {
  readonly priority: number;
  canClassify(token: string, ctx: ClassificationContext): boolean;
  classify(token: string, explicit: boolean): RecognizedToken;
}

class ClassificationContext {
  private claimed = new Set<string>();
  canClaim(field: string): boolean { return !this.claimed.has(field); }
  claim(field: string): void       { this.claimed.add(field); }
}
```

Concrete classifiers are plain classes with no Angular deps, registered in an ordered array
inside `PartnerSearchTokenizerService`. This keeps each classifier independently unit-testable
with plain `new ExplicitPrefixClassifier()` — no `TestBed` required.

---

### B3.8 Extending the Classifier Set

To add a `BirthdayClassifier` (e.g. for `DD.MM.YYYY` tokens) in the future:

1. Create `BirthdayClassifier implements TokenClassifier` with `priority = 25`
2. `canClassify`: regex `^\d{2}\.\d{2}\.\d{4}$` AND `birthday` not claimed
3. Add `birthday` field to `SearchCriteria` and the SQL query builder
4. Add the corresponding frontend classifier class to the array

Zero changes to any existing classifier or the pipeline.

---

## B4. Completion Endpoint (`GET /api/partner/complete`)

### B4.1 Contract

```
GET /api/partner/complete?field=postalCode&prefix=331&limit=15

Response 200:
{
  "field": "postalCode",
  "prefix": "331",
  "completions": [
    { "value": "33100", "display": "33100 — Paderborn" },
    { "value": "33102", "display": "33102 — Paderborn" },
    { "value": "33104", "display": "33104 — Paderborn" }
  ]
}
```

`field` is a validated enum: `postalCode | city | street | alphaCode | partnerNumber | name`.
Unrecognized field → 400. `limit` is capped server-side at `partner.complete.max-results`
(default 15) regardless of the client value.

### B4.2 SQL per Field

All queries use `DISTINCT` to avoid duplicate chips in the dropdown. The `prefix` parameter is
always sanitised and appended with `%` — wildcard characters in the prefix are escaped.

Code-like fields use prefix queries (btree index). Text fields use contains queries (trigram
GIN index). The `:prefix` parameter is sanitised server-side: `%` and `_` are escaped before
being embedded in the pattern.

```sql
-- postalCode — prefix (codes are always entered left-to-right)
SELECT DISTINCT postal_code AS value,
       postal_code || ' — ' || city AS display
FROM   partner
WHERE  postal_code LIKE :prefix || '%'
ORDER  BY postal_code
LIMIT  :limit;

-- alphaCode — prefix
SELECT DISTINCT alpha_code AS value, alpha_code AS display
FROM   partner
WHERE  alpha_code ILIKE :prefix || '%'
ORDER  BY alpha_code
LIMIT  :limit;

-- partnerNumber — prefix
SELECT DISTINCT partner_number AS value, partner_number AS display
FROM   partner
WHERE  partner_number LIKE :prefix || '%'
ORDER  BY partner_number
LIMIT  :limit;

-- city — contains (trigram GIN index on lower(city))
-- "burg" matches "Hamburg", "Augsburg", "Regensburg"
SELECT DISTINCT city AS value, city AS display
FROM   partner
WHERE  lower(city) LIKE '%' || lower(:prefix) || '%'
ORDER  BY city
LIMIT  :limit;

-- street — contains (trigram GIN index on lower(street))
-- "straße" matches "Hauptstraße", "Musterstraße", "Gartenstraße"
SELECT DISTINCT street AS value, street AS display
FROM   partner
WHERE  lower(street) LIKE '%' || lower(:prefix) || '%'
ORDER  BY street
LIMIT  :limit;

-- name — contains (trigram GIN index on lower(name1))
-- "üller" matches "Müller", "Schüller", "Küller"
SELECT DISTINCT name1 AS value, name1 AS display
FROM   partner
WHERE  lower(name1) LIKE '%' || lower(:prefix) || '%'
ORDER  BY name1
LIMIT  :limit;
```

### B4.3 Indexes for Completion Performance

Prefix fields use btree indexes (fast left-anchored `LIKE`). Contains fields require trigram
GIN indexes — `pg_trgm` makes `LIKE '%term%'` index-backed instead of a full table scan.

```sql
-- Enable trigram extension (once per database, requires superuser)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Prefix fields: btree indexes (already cover LIKE prefix%)
CREATE INDEX idx_partner_postal_code   ON partner (postal_code);
CREATE INDEX idx_partner_alpha_code    ON partner (alpha_code);
CREATE INDEX idx_partner_number_text   ON partner (partner_number);

-- Contains fields: GIN trigram indexes (cover LIKE '%term%')
CREATE INDEX idx_partner_city_trgm     ON partner USING GIN (lower(city)   gin_trgm_ops);
CREATE INDEX idx_partner_street_trgm   ON partner USING GIN (lower(street) gin_trgm_ops);
CREATE INDEX idx_partner_name1_trgm    ON partner USING GIN (lower(name1)  gin_trgm_ops);

-- Full-text search (search endpoint only, not completion)
CREATE INDEX idx_partner_name_tsv      ON partner USING GIN (name_search_vec);
```

`pg_trgm` is a bundled PostgreSQL extension — no separate installation is needed. It is
available in the `postgres:15-alpine` image used by `postgres-partner`.

### B4.4 Frontend Service: `PartnerCompletionService`

New Angular service that wraps the completion endpoint. Each call returns
`Observable<CompletionItem[]>` and is automatically cancelled if a newer token supersedes it
(via `switchMap`):

```typescript
@Injectable({ providedIn: 'root' })
export class PartnerCompletionService {

  complete(field: keyof SearchCriteria, prefix: string, limit = 15)
      : Observable<CompletionItem[]> {
    return this.http.get<CompletionResponse>(
      `/api/partner/complete`,
      { params: { field, prefix, limit } }
    ).pipe(
      map(r => r.completions),
      catchError(() => of([]))    // silent fallback — completions are advisory
    );
  }
}
```

The `PartnerSearch` component holds one `Subject<{field, prefix}>` per active token, each piped
through `debounceTime(300)` → `distinctUntilChanged()` → `switchMap(...)` →
`PartnerCompletionService.complete(...)`. Destroying/replacing a token automatically unsubscribes
its subject.

---

## B6. Search Query Construction

`PartnerSearchService` translates `SearchCriteria` → Spring Data JPA `Specification<Partner>`:

```
partnerNumber  →  exact match            (=)
alphaCode      →  ILIKE with * → %       (ILIKE)
name           →  full-text search       (name_search_vec @@ plainto_tsquery('german', :name))
postalCode     →  ILIKE with * → %       (ILIKE)
city           →  ILIKE with * → %       (ILIKE, lowercased)
street         →  ILIKE with * → %       (ILIKE)
```

All criteria are combined with AND. Empty/null criteria are omitted. The query always returns at
most 200 rows (configurable via `partner.search.max-results`).

The response shape is identical to the existing `PartnerGroupSearchResponse` so the Angular
`PartnerTreetableService` needs no changes.

---

## B7. New Backend Module: `backend/java-partner`

Directory structure mirrors `backend/java-two`:

```
backend/java-partner/
  pom.xml
  Dockerfile
  docker-compose.yaml
  src/main/java/com/example/partner/
    PartnerApplication.java
    controller/
      PartnerSearchController.java      ← GET /api/partner/search?q= and /search/structured
      PartnerCompletionController.java  ← GET /api/partner/complete?field=&prefix=&limit=
      PartnerController.java            ← GET /api/partner/{number}
      GroupController.java              ← GET /api/partner/groups/{number}/members
    search/
      TokenizerPipeline.java          ← assembles + runs the classifier chain
      TokenClassifier.java            ← interface
      ClassificationContext.java      ← per-run mutable state
      TokenizedQuery.java
      RecognizedToken.java
      SearchCriteria.java
      classifiers/
        ExplicitPrefixClassifier.java   ← priority 10
        PartnerNumberClassifier.java    ← priority 20
        PostalCodeClassifier.java       ← priority 30
        StreetClassifier.java           ← priority 40
        AlphaCodeClassifier.java        ← priority 50
        CityClassifier.java             ← priority 60
        FallbackNameClassifier.java     ← priority 999
    service/
      PartnerSearchService.java       ← builds JPA Specification, executes query
    model/
      Partner.java                    ← @Entity
      PartnerGroupSearchDto.java      ← response DTO (matches OpenAPI contract)
      PartnerGroupSearchResponse.java
    repository/
      PartnerRepository.java          ← JpaSpecificationExecutor<Partner>
  src/main/resources/
    application.properties
    db/migration/
      V1__create_partner_table.sql
      V2__seed_demo_partners.sql
    certs/  (same self-signed cert pattern as java-two)
  src/test/java/com/example/partner/
    search/
      PartnerQueryTokenizerTest.java  ← pure unit tests, no Spring context
    controller/
      PartnerSearchControllerTest.java
```

**`pom.xml` dependencies** (on top of Spring Boot parent):
- `spring-boot-starter-web`
- `spring-boot-starter-data-jpa`
- `spring-boot-starter-actuator`
- `org.postgresql:postgresql`
- `org.flywaydb:flyway-core`
- `org.flywaydb:flyway-database-postgresql`

---

## B8. `docker-compose.yaml` for app-partner

New file at `backend/java-partner/docker-compose.yaml`, included in the root
`docker-compose.yaml` via the existing `include:` mechanism:

```yaml
networks:
  default:
    name: docker-default-network
    external: true

services:
  postgres-partner:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app-partner-db
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 10s
      retries: 10

  app-partner:
    image: app-partner
    build:
      context: .
      dockerfile: Dockerfile
      network: host
    depends_on:
      postgres-partner:
        condition: service_healthy
    environment:
      DB_HOST: postgres-partner
    healthcheck:
      test: ["CMD", "curl", "-k", "-f", "https://localhost/actuator/health"]
      interval: 10s
      timeout: 10s
      retries: 10
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app-partner.rule=PathPrefix(`/api/partner`)"
      - "traefik.http.routers.app-partner.entrypoints=web,websecure"
      - "traefik.http.services.app-partner.loadbalancer.server.port=443"
      - "traefik.http.services.app-partner.loadbalancer.server.scheme=https"
      - "traefik.http.services.app-partner.loadbalancer.healthcheck.path=/actuator/health"
      - "traefik.http.services.app-partner.loadbalancer.healthcheck.port=443"
      - "traefik.http.routers.app-partner.priority=1000"
```

---

## B9. OpenAPI Spec & Angular Client Update

The `PartnerGatewayService` is OpenAPI-generated. Two changes are needed:

1. **Add new operation** to the OpenAPI spec:
   ```yaml
   /partner/search:
     get:
       operationId: searchPartnersByQuery
       parameters:
         - name: q
           in: query
           required: true
           schema:
             type: string
             minLength: 3
       responses:
         '200':
           content:
             application/json:
               schema:
                 $ref: '#/components/schemas/PartnerGroupSearchResponse'
   ```

2. **Regenerate the Angular client** (the existing `APIS` array and generated service files under
   `frontend/projects/partner/src/app/api/` are updated by the OpenAPI generator).

3. Update `environment.apiGatewayUrl` to point to `https://gateway/` (through Traefik) instead of
   the hardcoded external gateway URL.

The Angular `PartnerSearchService.performSearch()` switches from calling
`searchPartnersAndGroups(...)` (structured params) to calling `searchPartnersByQuery(rawInput)`,
letting the backend do the tokenization.

---

## B10. Backend Implementation Sequence

```
Step B1  — Create backend/java-partner module skeleton (pom.xml, Dockerfile, application.properties)
Step B2  — V1 Flyway migration: partner table + completion indexes
Step B3  — Partner JPA entity + PartnerRepository
Step B4  — PartnerQueryTokenizer + unit tests (no Spring context)
Step B5  — PartnerSearchService (Specification builder)
Step B6  — PartnerSearchController (?q= endpoint + /structured endpoint)
Step B7  — PartnerCompletionService + PartnerCompletionController
Step B8  — V2 Flyway migration: seed demo data (~500 partners with realistic postal codes + cities)
Step B9  — docker-compose.yaml + Traefik labels + include in root compose
Step B10 — OpenAPI spec update (add /complete + /search?q= operations) + Angular client regeneration
Step B11 — Implement frontend PartnerCompletionService + token state machine in PartnerSearch
Step B12 — Integration test: completion returns enriched results, final search ANDs confirmed values
```

---

## B11. Gap Analysis & Technology Assessment

### B11.1 Gaps in the Current Plan

The following items are referenced but not yet fully specified and must be resolved before
implementation begins.

---

**G1 — Input splitter `Tokenizer.split()` is unspecified**

`TokenizerPipeline` calls `Tokenizer.split(input)` and the frontend equivalent splits on
whitespace, but neither is defined. Edge cases that require explicit rules:

| Input | Expected tokens |
|---|---|
| `"Müller & Söhne"` | one token: `Müller & Söhne` (quoted, preserve spaces) |
| `Müller-Bauer` | one token: `Müller-Bauer` (hyphen is part of a name) |
| `Musterstr.` | one token: `Musterstr.` (trailing dot, part of street abbreviation) |
| `nr:33100` | one token: `nr:33100` (prefix syntax, no split on `:`) |
| `plz:331 München` | two tokens: `plz:331`, `München` |

Rule: split on whitespace outside of double-quoted spans. Within quotes, spaces are preserved
and the quotes are stripped from the token value. The splitter must be a standalone
`QuerySplitter` utility class (Java) / function (TypeScript) with its own unit tests before
the pipeline can be tested end-to-end.

---

**G2 — Token character range not tracked**

Section 2.1 says "cursor position is tracked to identify the active token" but gives no
implementation. Each `RecognizedToken` must carry `startIndex` and `endIndex` (byte positions
in the raw input string) so the component can:
- Determine which token the caret is currently inside (`selectionStart` between `startIndex`
  and `endIndex`)
- Splice `value` from a completion selection into the correct substring of the raw input

Add to `RecognizedToken`:
```typescript
startIndex: number;   // position of first char of raw token in the input string
endIndex: number;     // position after last char
```
The `QuerySplitter` must produce these alongside each token string.

---

**G3 — Input rewrite on completion acceptance is unspecified**

When the user accepts "33100 — Paderborn", only `value="33100"` replaces the partial token.
The splice is:
```typescript
const before = rawInput.slice(0, token.startIndex);
const after  = rawInput.slice(token.endIndex);
const newRaw = before + completion.value + after;
searchControl.setValue(newRaw, { emitEvent: true });
// caret → token.startIndex + completion.value.length
```
This must be implemented in the component and covered by a unit test (no `TestBed` needed —
pure string manipulation).

---

**G4 — `detokenize()` output format undefined**

Section 4 calls `detokenize(criteria)` for backward-compat URL migration but never specifies
the output format. Decision needed:

- **Option A** — implicit form: `"33100 München Müller"` — looks natural but loses field
  fidelity; re-tokenization may reclassify differently than the original search.
- **Option B** — explicit form: `"plz:33100 stadt:München name:Müller"` — lossless, always
  re-tokenizes identically. Recommended.

Use Option B. Document it as the canonical round-trip format.

---

**G5 — `name` completion SQL is incorrect**

Section B4.2 uses `to_tsquery('german', :prefix || ':*')` for name completions. The German
Snowball stemmer transforms words before storing them in the tsvector (e.g. "Müller" → stem
"mullr"). A prefix search for "Müll" will not match the stored stem. For the *completion*
endpoint (prefix typeahead), use plain `ILIKE` against `name1`:

```sql
-- name completion — use ILIKE, not tsquery
SELECT DISTINCT name1 AS value, name1 AS display
FROM   partner
WHERE  lower(name1) LIKE lower(:prefix) || '%'
ORDER  BY name1
LIMIT  :limit;
```

The GIN full-text index (`name_search_vec`) remains correct for the *search* endpoint (B6)
where full words are matched against stemmed tokens.

Add a btree index for name completion:
```sql
CREATE INDEX idx_partner_name1 ON partner (lower(name1));
```

---

**G6 — `PartnerCompletionService` missing from backend module**

Section B7 directory structure lists `PartnerCompletionController.java` but omits the service
layer. Add:
```
service/
  PartnerSearchService.java
  PartnerCompletionService.java   ← executes per-field completion SQL, enforces limit cap
```

---

**G7 — `CompletionResponse` / `CompletionItem` absent from OpenAPI spec**

Section B9 adds `searchPartnersByQuery` but does not add the `/complete` endpoint or its
response models. The Angular client needs generated types for both. Add to the OpenAPI spec:

```yaml
/partner/complete:
  get:
    operationId: completePartnerField
    parameters:
      - { name: field,  in: query, required: true,  schema: { type: string } }
      - { name: prefix, in: query, required: true,  schema: { type: string, minLength: 2, maxLength: 35 } }
      - { name: limit,  in: query, required: false, schema: { type: integer, default: 15 } }
    responses:
      '200':
        content:
          application/json:
            schema: { $ref: '#/components/schemas/CompletionResponse' }

CompletionResponse:
  properties:
    field:       { type: string }
    prefix:      { type: string }
    completions: { type: array, items: { $ref: '#/components/schemas/CompletionItem' } }

CompletionItem:
  properties:
    value:   { type: string }
    display: { type: string }
```

---

**G8 — OpenAPI spec file location not identified**

The Angular client is auto-generated (`NOTE: This class is auto generated by OpenAPI
Generator`). The source spec file that drives the generator is not referenced anywhere in the
plan. It must be located (or created) before B9 can proceed. Typical locations: a sibling
`openapi/` directory, a separate gateway repository, or a `src/main/resources/openapi.yaml`
in the backend. This must be established before Step B9.

---

**G9 — i18n translation keys not enumerated**

The plan references i18n keys throughout (`partner.search.examples.*`,
`partner.search.fields.*`, chip field labels) but never lists all keys that must be added to
`de.json`, `en.json`, and `fr.json`. A complete key list must be produced as part of Step 4
(template update). Minimum new keys required:

```
partner.search.placeholder
partner.search.help.navigate
partner.search.help.tab
partner.search.help.enter
partner.search.help.esc
partner.search.help.backspace
partner.search.examples.title
partner.search.examples.partnerNr
partner.search.examples.plzCity
partner.search.examples.street
partner.search.examples.name
partner.search.examples.wildcards
partner.search.examples.explicit
partner.search.token.field.postalCode
partner.search.token.field.city
partner.search.token.field.street
partner.search.token.field.alphaCode
partner.search.token.field.partnerNr
partner.search.token.field.name
```

---

**G10 — `@HostListener('keydown')` conflict**

`partner-search.ts` currently has a `@HostListener('keydown')` that fires `search()` on Enter.
The new keyboard handling (↑↓ dropdown navigation, TAB accept, ENTER dual role, ESC dismiss)
is far more complex. The existing host listener must be replaced with a `(keydown)` binding on
the `matInput` element directly, using `$event` to inspect both `key` and whether the
`MatAutocomplete` panel is currently open (`autocomplete.isOpen`).

---

**G11 — `FallbackNameClassifier` accumulation logic unspecified**

The plan says it "accumulates remaining tokens into `name`" but `classify()` takes a single
token. If the input is `"Müller GmbH"` without quotes, the splitter produces two tokens:
`"Müller"` and `"GmbH"`. Both are letters-only; `CityClassifier` claims `"Müller"` (city not
yet taken), then `CityClassifier` can't claim `"GmbH"` (city taken), so `FallbackNameClassifier`
takes `"GmbH"` as `name`. The result: city=Müller, name=GmbH — which is wrong.

Two options:
- **Option A** — `FallbackNameClassifier` is stateful: once it fires for one token, it also
  claims a virtual `city` field so `CityClassifier` can no longer win for subsequent tokens.
- **Option B** — introduce a `MultiWordNameDetector` pre-pass: consecutive unclassified
  letter-only tokens with no space classification are merged into a single quoted-string token
  before the pipeline runs.

Option B is cleaner. Specify it as part of `QuerySplitter` post-processing.

---

### B11.2 Technology Assessment

**Everything in this plan can be implemented with Angular, Spring Boot, and PostgreSQL 15.
No additional technology is required.**

| Concern | Solution in existing stack |
|---|---|
| Token classification | Pure TypeScript / Java — no library |
| Completion dropdown | `MatAutocomplete` (Angular Material — already a dependency) |
| Chip display with states | `MatChipSet` / `MatChip` (Angular Material) |
| Per-token request cancellation | RxJS `switchMap` (already in Angular) |
| Full-text name search | PostgreSQL `TSVECTOR` + `GIN` index + `plainto_tsquery` (Postgres 15 ✓) |
| Prefix completion queries | PostgreSQL `ILIKE` + btree index (native) |
| `GENERATED ALWAYS AS STORED` column | PostgreSQL 12+ feature (Postgres 15 ✓) |
| Schema migrations + seed data | Flyway (`flyway-core` + `flyway-database-postgresql`) |
| Dynamic search query building | Spring Data JPA `Specification` + `JpaSpecificationExecutor` |
| Service isolation + routing | Traefik `PathPrefix` label (already used by java-two) |
| Self-signed TLS on new service | Existing cert generation script + keystore pattern |

**Optional additions that are not required but would improve quality:**

| Addition | Value | Cost |
|---|---|---|
| Lombok | Eliminates JPA entity and DTO boilerplate | Low — one `pom.xml` dependency |
| Testcontainers | Integration tests spin up a real PostgreSQL instance; avoids H2 incompatibility with `to_tsquery` and `ILIKE` behaviour differences | Medium — test-scope dependency + Docker in CI |
| `pg_trgm` PostgreSQL extension | **Required** for contains-completion on `city`, `street`, and `name` fields — typing "burg" surfaces "Hamburg"; typing "straße" surfaces "Hauptstraße" | Bundled with PostgreSQL 15, zero extra installation |

**What is explicitly NOT needed:**
- Elasticsearch / OpenSearch — PostgreSQL full-text is sufficient at ~500–50 000 partners;
  see [`backend/POSTGRESQL-SEARCH-TECHNIQUES.md`](../../../../../../../../../backend/POSTGRESQL-SEARCH-TECHNIQUES.md)
  for a detailed explanation of the techniques used and when PostgreSQL stops being enough
- Redis — no caching layer needed; completion queries are fast with btree indexes
- WebSockets / SSE — standard HTTP request-response for completions is correct
- A separate tokenizer microservice — each backend service owns it directly

---

---

# Dual-Backend Competition Plan: Spring Boot vs. Quarkus

---

## C1. Why Quarkus for This Use Case

See [`backend/QUARKUS-ADVANTAGES.md`](../../../../../../../../../backend/QUARKUS-ADVANTAGES.md)
for the full rationale. Summary of the ten advantages relevant to partner search:

| # | Advantage | Key benefit |
|---|---|---|
| 1 | **Native image (GraalVM/Mandrel)** | < 50 ms start, ~60 MB image — critical for the high-frequency completion endpoint |
| 2 | **RESTEasy Reactive** | Non-blocking I/O handles more concurrent completions with fewer threads |
| 3 | **Hibernate ORM Panache** | Completion query is one line vs. a Spring `Specification` hierarchy |
| 4 | **SmallRye OpenAPI** | Spec auto-generated from JAX-RS annotations; resolves gap G8 |
| 5 | **Build-time classpath scanning** | No warm-up latency on first request after cold start |
| 6 | **Dev mode** | Sub-second live reload — faster iteration on classifier logic |
| 7 | **Smaller Docker images** | Native: ~60 MB; JVM: ~180 MB vs Spring Boot JVM ~220 MB |
| 8 | **MicroProfile Config** | Profile overrides (`%dev.`, `%test.`) in one file, no YAML profile split |
| 9 | **Dev Services** | Zero-config PostgreSQL container for `@QuarkusTest`; resolves Testcontainers setup cost |
| 10 | **Existing infra proof** | `java-three` already validates TLS, Traefik, Panache, native on this exact stack |

---

## C2. API Contract — The Shared Specification

Both backends must expose an **identical API contract**. The contract is defined once as an
OpenAPI 3.1 spec and is the single source of truth for both implementations. Neither backend
is allowed to diverge from it.

**Canonical location**: `openapi/partner-search-api.yaml` at the repository root. This
resolves **gap G8**.

The Quarkus implementation **generates** its spec from JAX-RS annotations via SmallRye OpenAPI
and the generated spec is **validated against** `partner-search-api.yaml` in CI (using
`openapi-diff` or `swagger-cli validate`). The Spring Boot implementation similarly validates
its generated spec. Any deviation is a build failure.

### Shared endpoints (both backends, identical paths and schemas)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/partner/search?q=` | Smart search — raw string, backend tokenizes |
| `GET` | `/api/partner/search/structured` | Backwards-compat structured params |
| `GET` | `/api/partner/complete?field=&prefix=&limit=` | Per-field content-assist completions |
| `GET` | `/api/partner/{partnerNumber}` | Single partner detail |
| `GET` | `/api/partner/groups/{groupNumber}/members` | Group member expansion |

### Health endpoints (differ by framework, Traefik is configured per service)

| Framework | Health path |e
|---|---|
| Spring Boot | `/actuator/health` |
| Quarkus | `/q/health` |

---

## C3. Module Layout

```
backend/
  spring-partner/          ← Spring Boot implementation (renamed from java-partner)
    pom.xml
    Dockerfile
    docker-compose.yaml
    src/...

  quarkus-partner/         ← Quarkus implementation (new)
    pom.xml
    Dockerfile             ← JVM variant (mirrors java-three/Dockerfile)
    Dockerfile.native      ← Native variant (mirrors java-three/Dockerfile.native)
    docker-compose.yaml
    src/...

openapi/
  partner-search-api.yaml  ← Canonical contract, version-controlled
```

Both modules share `postgres-partner` — the same PostgreSQL instance with the same Flyway
migrations and seed data. This ensures the two backends are compared against identical data,
making performance and correctness comparisons meaningful.

The Flyway migrations live in `openapi/db/` (a neutral location) and are copied into both
`src/main/resources/db/migration/` during the build, or referenced via a shared Maven module.
An alternative is to keep them in `spring-partner` only and have `quarkus-partner` reference
the same migration files via a Docker volume or shared classpath resource.

---

## C4. Quarkus Module: `backend/quarkus-partner`

### C4.1 Dependencies (`pom.xml`)

Based on `java-three/pom.xml`, adding the extensions needed for this service:

```xml
<dependencies>
  <!-- REST layer -->
  <dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-rest-jackson</artifactId>        <!-- RESTEasy Reactive + Jackson -->
  </dependency>

  <!-- Database -->
  <dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-hibernate-orm-panache</artifactId>
  </dependency>
  <dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-jdbc-postgresql</artifactId>
  </dependency>
  <dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-flyway</artifactId>
  </dependency>

  <!-- Observability -->
  <dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-smallrye-health</artifactId>
  </dependency>
  <dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-smallrye-openapi</artifactId>    <!-- live spec at /q/openapi, solves G8 -->
  </dependency>

  <!-- Testing -->
  <dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-junit5</artifactId>
    <scope>test</scope>
  </dependency>
  <dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>rest-assured</artifactId>
    <scope>test</scope>
  </dependency>
</dependencies>
```

### C4.2 `application.properties`

```properties
quarkus.datasource.db-kind=postgresql
quarkus.datasource.username=postgres
quarkus.datasource.password=postgres
quarkus.datasource.jdbc.url=jdbc:postgresql://${DB_HOST:postgres-partner}:5432/app-partner-db

quarkus.hibernate-orm.schema-management.strategy=none      # Flyway owns the schema
quarkus.flyway.migrate-at-start=true
quarkus.flyway.locations=classpath:db/migration

quarkus.http.insecure-requests=disabled
quarkus.tls.key-store.p12.path=certs/keystore.p12
quarkus.tls.key-store.p12.password=changeit
quarkus.native.resources.includes=certs/keystore.p12

quarkus.smallrye-openapi.path=/q/openapi
quarkus.swagger-ui.always-include=true

partner.search.max-results=200
partner.complete.max-results=15
```

### C4.3 Directory Structure

```
backend/quarkus-partner/
  pom.xml
  Dockerfile
  Dockerfile.native
  docker-compose.yaml
  src/main/java/com/example/partner/
    resource/                          ← JAX-RS uses "resource" not "controller"
      PartnerSearchResource.java       ← @Path("/api/partner/search")
      PartnerCompletionResource.java   ← @Path("/api/partner/complete")
      PartnerResource.java             ← @Path("/api/partner/{partnerNumber}")
      GroupResource.java               ← @Path("/api/partner/groups/{groupNumber}/members")
    search/
      TokenizerPipeline.java           ← identical interface to spring-partner
      TokenClassifier.java
      ClassificationContext.java
      QuerySplitter.java
      TokenizedQuery.java
      RecognizedToken.java
      SearchCriteria.java
      classifiers/                     ← identical classifier classes
        ExplicitPrefixClassifier.java
        PartnerNumberClassifier.java
        PostalCodeClassifier.java
        StreetClassifier.java
        AlphaCodeClassifier.java
        CityClassifier.java
        FallbackNameClassifier.java
    service/
      PartnerSearchService.java        ← uses Panache instead of JPA Specification
      PartnerCompletionService.java
    model/
      Partner.java                     ← extends PanacheEntity (or uses PanacheRepository)
      PartnerGroupSearchDto.java       ← same DTO shape as spring-partner
      PartnerGroupSearchResponse.java
      CompletionResponse.java
      CompletionItem.java
  src/main/resources/
    application.properties
    db/migration/                      ← same SQL files as spring-partner
      V1__create_partner_table.sql
      V2__seed_demo_partners.sql
    certs/
  src/test/java/com/example/partner/
    search/
      TokenizerPipelineTest.java       ← same test cases as spring-partner (copy by spec)
    resource/
      PartnerSearchResourceTest.java   ← @QuarkusTest + RestAssured
```

### C4.4 Key Implementation Differences vs. Spring Boot

| Concern | Spring Boot (`spring-partner`) | Quarkus (`quarkus-partner`) |
|---|---|---|
| REST annotations | `@RestController`, `@GetMapping`, `@RequestParam` | `@Path`, `@GET`, `@QueryParam` (JAX-RS) |
| Dependency injection | Constructor injection (`@Autowired` or implicit) | `@Inject` (CDI) |
| Bean scope | `@Service`, `@Component` | `@ApplicationScoped` |
| ORM query style | `JpaSpecificationExecutor<Partner>` + `Specification` | `Partner.find("lower(city) LIKE lower(?1)", prefix + "%")` (Panache) |
| Health endpoint | `/actuator/health` | `/q/health` (SmallRye) |
| OpenAPI spec | Springdoc or manually maintained | Auto-generated at `/q/openapi` (SmallRye OpenAPI) |
| Config profiles | `application-dev.properties` / YAML | `%dev.` prefix in `application.properties` |
| Flyway activation | `spring.flyway.*` | `quarkus.flyway.*` |
| Test DB | Testcontainers (manual setup) | Quarkus Dev Services (zero config, auto-spins PostgreSQL) |
| Native build | Not applicable | `Dockerfile.native` + Mandrel builder (already in repo) |

### C4.5 Panache Search Query Example

The `PartnerSearchService` in Quarkus replaces the Spring `Specification` builder with a
Panache `PanacheQuery`:

```java
@ApplicationScoped
public class PartnerSearchService {

    public List<Partner> search(SearchCriteria c) {
        StringBuilder query = new StringBuilder("1=1");
        Map<String, Object> params = new HashMap<>();

        if (c.partnerNumber() != null) {
            query.append(" AND partnerNumber = :partnerNumber");
            params.put("partnerNumber", c.partnerNumber());
        }
        if (c.postalCode() != null) {
            query.append(" AND postalCode LIKE :postalCode");
            params.put("postalCode", c.postalCode().replace("*", "%") + "%");
        }
        if (c.city() != null) {
            query.append(" AND lower(city) LIKE lower(:city)");
            params.put("city", c.city().replace("*", "%") + "%");
        }
        if (c.name() != null) {
            query.append(" AND name_search_vec @@ plainto_tsquery('german', :name)");
            params.put("name", c.name());
        }
        // ... street, alphaCode

        return Partner.find(query.toString(), params)
                      .page(0, maxResults)
                      .list();
    }
}
```

The `name_search_vec @@ plainto_tsquery(...)` expression requires a native query for Panache
since it uses a PostgreSQL-specific operator. Use `@NamedNativeQuery` or
`Partner.findNative(...)` for the name criterion only, falling back to JPQL for the rest.

---

## C5. Traefik Routing for Competition

Both services expose the same `/api/partner` path. Traefik must route between them. Three
operational modes are supported via compose override:

### Mode 1 — Exclusive (default): one backend active at a time

Each `docker-compose.yaml` registers its own router. Only one compose file is included in
the root `docker-compose.yaml` at any given time. Switch by editing the `include:` list.

### Mode 2 — Weighted round-robin (A/B comparison under load)

Both services are active. Traefik's **weighted service** (file provider) splits traffic:

```yaml
# infrastructure/traefik/traefik_conf.yml  (dynamic config, file provider)
http:
  services:
    partner-weighted:
      weighted:
        services:
          - name: partner-spring@docker
            weight: 50
          - name: partner-quarkus@docker
            weight: 50

  routers:
    partner-weighted-router:
      rule: "PathPrefix(`/api/partner`)"
      entryPoints: [websecure]
      service: partner-weighted
      priority: 1000
```

Both Docker services set `traefik.enable=true` but use **different service names** and
**no router label** (the router is owned by the file provider):
- `spring-partner` labels: `traefik.http.services.partner-spring.loadbalancer.server.port=443`
- `quarkus-partner` labels: `traefik.http.services.partner-quarkus.loadbalancer.server.port=443`

### Mode 3 — Header-based routing (explicit selection per request)

Useful for testing: a `X-Backend: quarkus` header routes a specific request to the Quarkus
service regardless of weights, enabling targeted verification without changing weights.

```yaml
# file provider addition
  routers:
    partner-quarkus-explicit:
      rule: "PathPrefix(`/api/partner`) && HeadersRegexp(`X-Backend`, `quarkus`)"
      service: partner-quarkus@docker
      priority: 1100        # higher than weighted router
      entryPoints: [websecure]
    partner-spring-explicit:
      rule: "PathPrefix(`/api/partner`) && HeadersRegexp(`X-Backend`, `spring`)"
      service: partner-spring@docker
      priority: 1100
      entryPoints: [websecure]
```

---

## C6. Shared Tokenizer Specification

The tokenizer classification rules are **duplicated by specification** — two independent
implementations tested against the same inputs and expected outputs. There is no shared JAR.

A `tokenizer-spec.json` file in `openapi/` defines the canonical test cases:

```json
[
  { "input": "33100",              "field": "postalCode",   "raw": "33100" },
  { "input": "3310012",            "field": "partnerNumber","raw": "3310012" },
  { "input": "Musterstraße 7",     "field": "street",       "raw": "Musterstraße 7" },
  { "input": "München",            "field": "city",         "raw": "München" },
  { "input": "MULL*",              "field": "alphaCode",    "raw": "MULL*" },
  { "input": "\"Müller & Söhne\"", "field": "name",         "raw": "Müller & Söhne" },
  { "input": "nr:33100",           "field": "partnerNumber","raw": "33100", "explicit": true }
]
```

Both `PartnerQueryTokenizerTest.java` (Spring Boot) and `TokenizerPipelineTest.java` (Quarkus)
load this file and assert against every case. A divergence between the two implementations
shows up as a test failure in whichever one is wrong.

The TypeScript frontend tokenizer tests load the same JSON (imported as a test fixture) and
assert the same cases, making all three implementations contractually bound to one spec.

---

## C7. Competition Implementation Sequence

Backend steps now split into parallel tracks after the shared contract and schema are
established:

```
Step C1  — Write openapi/partner-search-api.yaml (canonical contract)
Step C2  — Write openapi/tokenizer-spec.json (shared classifier test cases)
Step C3  — Write V1__create_partner_table.sql + V2__seed_demo_partners.sql (shared)

── Spring Boot track ──────────────────────────────────────────────────
Step S1  — spring-partner: module skeleton, pom.xml, Dockerfile
Step S2  — spring-partner: Partner @Entity + PartnerRepository
Step S3  — spring-partner: QuerySplitter + TokenizerPipeline + classifiers
           (tests load tokenizer-spec.json, must all pass)
Step S4  — spring-partner: PartnerSearchService (Specification builder)
Step S5  — spring-partner: PartnerCompletionService + SQL queries
Step S6  — spring-partner: controllers, validate generated spec vs canonical
Step S7  — spring-partner: docker-compose.yaml, include in root compose, smoke test

── Quarkus track (can start in parallel with S1) ──────────────────────
Step Q1  — quarkus-partner: module skeleton, pom.xml, Dockerfile + Dockerfile.native
Step Q2  — quarkus-partner: Partner extends PanacheEntity
Step Q3  — quarkus-partner: QuerySplitter + TokenizerPipeline + classifiers
           (tests load tokenizer-spec.json, must all pass)
Step Q4  — quarkus-partner: PartnerSearchService (Panache queries)
Step Q5  — quarkus-partner: PartnerCompletionService + SQL queries
Step Q6  — quarkus-partner: resources, validate /q/openapi vs canonical
Step Q7  — quarkus-partner: docker-compose.yaml, include in root compose, smoke test
Step Q8  — quarkus-partner: native build test (Dockerfile.native)

── Integration ────────────────────────────────────────────────────────
Step I1  — Traefik file provider: weighted router + header-based routing
Step I2  — Frontend: PartnerCompletionService + token state machine
Step I3  — Contract test: both backends return identical responses for same inputs
Step I4  — Load test: compare throughput and latency under concurrent completions
```
