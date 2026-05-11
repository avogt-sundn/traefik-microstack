# PostgreSQL Is Enough for Search — Key Techniques Explained for Beginners

A common reaction when building a search feature is to reach for Elasticsearch. This document
explains why PostgreSQL 15 — already in the stack — covers every search requirement of the
partner service without introducing a second database engine, and walks through each technique
from first principles.

---

## Why Not Jump to Elasticsearch?

Elasticsearch is a dedicated search engine built on Apache Lucene. It is genuinely better than
PostgreSQL for some things: indexing hundreds of millions of documents, ranked full-text scoring
across many fields, and real-time analytics over append-only logs. But it comes with real costs:

- A second stateful service to operate, back up, and keep in sync with the primary database
- Data must be copied from PostgreSQL into Elasticsearch and kept consistent (dual writes or
  a CDC pipeline like Debezium)
- Eventual consistency: a write to PostgreSQL is not immediately visible in Elasticsearch
- Significant operational complexity: cluster sizing, shard configuration, index lifecycle management
- Overkill for a dataset of ~500–50 000 partners

For the partner search service, every query is against a single `partner` table with known
columns. PostgreSQL handles this well with the right techniques. There is no synchronisation
problem because there is only one data store.

---

## Technique 1: `LIKE` and `ILIKE` — Prefix and Substring Matching

### What it is

`LIKE` matches a string against a pattern. `%` matches any sequence of characters. `_` matches
exactly one character.

```sql
-- Rows where postal_code starts with "331"
SELECT * FROM partner WHERE postal_code LIKE '331%';

-- Rows where city contains "mün" anywhere
SELECT * FROM partner WHERE city LIKE '%mün%';
```

`ILIKE` is the case-insensitive version:

```sql
-- Matches "München", "münchen", "MÜNCHEN"
SELECT * FROM partner WHERE city ILIKE 'mün%';
```

### Why it matters for partner search

Every completion query is a **prefix search** — the user has typed the beginning of a value
and wants to see valid continuations. `LIKE 'prefix%'` is exactly that pattern.

### The performance trap and how indexes fix it

A plain `LIKE '%something%'` (leading wildcard) cannot use a normal index and forces a full
table scan. But `LIKE 'prefix%'` (trailing wildcard only) *can* use a btree index — with one
condition: the column must be sorted in the right collation.

```sql
-- This index supports  WHERE postal_code LIKE '331%'
CREATE INDEX idx_partner_postal_code ON partner (postal_code);

-- For case-insensitive prefix search, index the lowercased value
CREATE INDEX idx_partner_city ON partner (lower(city));

-- Query must match the index expression exactly
SELECT * FROM partner WHERE lower(city) LIKE lower('Mün') || '%';
```

Rule of thumb: **trailing-wildcard `LIKE` on an indexed column is fast; leading-wildcard `LIKE`
is a full scan**. For the completion endpoint, every query is trailing-wildcard, so btree
indexes work perfectly.

---

## Technique 2: Full-Text Search — `tsvector`, `tsquery`, and GIN Indexes

Prefix matching works for structured fields like postal codes and alpha codes. For the `name`
field, users type words from anywhere in a multi-part name (`name1`, `name2`, `name3`). A
simple `ILIKE` on one column would miss results where the word appears in `name2`. Full-text
search solves this.

### `tsvector` — the pre-processed document

A `tsvector` is a sorted list of **lexemes** (normalised word roots) derived from a text
column. PostgreSQL processes the raw text once at write time and stores the result. The
processing involves:

1. **Tokenisation** — splitting text into words
2. **Stop word removal** — common words like "und", "der", "die" are dropped
3. **Stemming** — words are reduced to their root form using a language-specific algorithm
   (for `'german'`: "Müller" → "mullr", "Gesellschaft" → "gesellschaft")

```sql
SELECT to_tsvector('german', 'Müller und Söhne GmbH');
-- Result: 'gmbh':4 'mullr':1 'sohn':3
-- Note: "und" removed (stop word), words stemmed
```

In the partner schema, the `name_search_vec` column is a **generated stored column** — it is
computed automatically by PostgreSQL whenever `name1`, `name2`, `name3`, or `firstname` change:

```sql
name_search_vec TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('german',
        coalesce(name1, '') || ' ' ||
        coalesce(name2, '') || ' ' ||
        coalesce(name3, '') || ' ' ||
        coalesce(firstname, ''))
) STORED
```

`GENERATED ALWAYS AS ... STORED` means the value lives in the table row like a normal column
but is always kept in sync by the database engine. You never update it manually.

### `tsquery` — the search expression

A `tsquery` is a normalised search term with optional boolean operators:

```sql
-- Find rows containing both "müller" and "gmbh" (stemmed)
SELECT * FROM partner WHERE name_search_vec @@ to_tsquery('german', 'Müller & GmbH');

-- Simpler: treat the whole string as space-separated AND terms
SELECT * FROM partner WHERE name_search_vec @@ plainto_tsquery('german', 'Müller GmbH');

-- Prefix search: the :* operator matches any word starting with the stem
SELECT * FROM partner WHERE name_search_vec @@ to_tsquery('german', 'mull:*');
```

The `@@` operator means "the tsvector matches the tsquery."

`plainto_tsquery` is the beginner-friendly version — it takes a plain string and treats spaces
as AND. `to_tsquery` gives full control with `&` (AND), `|` (OR), and `!` (NOT).

### The GIN index — making `@@` fast

A GIN (Generalised Inverted Index) maps each lexeme to the list of rows that contain it, just
like the index at the back of a book maps words to page numbers.

```sql
CREATE INDEX idx_partner_name_tsv ON partner USING GIN (name_search_vec);
```

With this index, `WHERE name_search_vec @@ plainto_tsquery('german', 'Müller')` jumps directly
to matching rows instead of scanning the whole table. Without it, every `@@` query reads every
row.

### The stemming caveat for completions

Because the tsvector stores stems, prefix queries against it have a subtle problem: the stem
for "Müller" is "mullr", not "müll". Typing "Müll" as a prefix does not reliably match the
stem "mullr". For the **completion endpoint** (typeahead prefix), use `ILIKE` against the raw
`name1` column instead. The GIN full-text index is correct for the **search endpoint** where
the user types complete words.

---

## Technique 3: Trigram Similarity — `pg_trgm`

### What a trigram is

A trigram is any sequence of three consecutive characters. The string "München" produces the
trigrams: `"  m"`, `" mü"`, `"münc"`, `"ünch"`, `"nche"`, `"chen"`, `"hen"`, `"en "`,
`"n  "`. Every string can be decomposed into its trigrams, and two strings are considered
similar if they share many trigrams.

### Why this matters

`ILIKE 'prefix%'` only matches strings that *start with* the prefix. If a user types "straße"
hoping to find "Hauptstraße", a prefix search fails — "Hauptstraße" does not start with
"straße". Trigrams support **substring matching** (`LIKE '%straße%'`) *with an index*:

```sql
-- Enable the extension (once per database)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create a trigram index
CREATE INDEX idx_partner_street_trgm ON partner USING GIN (lower(street) gin_trgm_ops);

-- Now a leading-wildcard LIKE uses the index instead of doing a full scan
SELECT * FROM partner WHERE lower(street) LIKE '%' || lower('straße') || '%';
```

### Fuzzy matching with `similarity()`

`pg_trgm` also provides a similarity score between 0 and 1:

```sql
-- Partners whose name is at least 40% similar to "Müler" (typo)
SELECT *, similarity(name1, 'Müler') AS score
FROM partner
WHERE similarity(name1, 'Müler') > 0.4
ORDER BY score DESC;
```

This gives **typo tolerance** — "Müler" matches "Müller" even though one letter is missing.

### When to use it — and the partner service does

The partner service uses **contains-completion** (`LIKE '%term%'` with trigram GIN indexes)
for the `city`, `street`, and `name` fields. This is a deliberate design decision, not a
future option:

- Typing "burg" must surface "Hamburg", "Augsburg", "Regensburg" — not only cities that
  start with "burg"
- Typing "straße" must surface "Hauptstraße", "Musterstraße", "Gartenstraße"
- Typing "üller" must surface "Müller GmbH"

Without trigram indexes, `LIKE '%term%'` requires a full table scan on every keystroke.
With the GIN trigram index, the lookup is index-backed and fast.

Code-like fields (`postal_code`, `alpha_code`, `partner_number`) stay on prefix search with
btree indexes — users type those from the left by convention and prefix is both correct and
faster for exact-structured values.

Typo tolerance (`similarity()`) remains an additive option that can be enabled without schema
changes if it becomes a requirement.

---

## Technique 4: `DISTINCT` for Completion Deduplication

Many partners share the same city or street. A completion query for city "München" should
return one suggestion, not 3 000 rows — one per partner in Munich. `DISTINCT` collapses
duplicate values:

```sql
-- Without DISTINCT: 3000 rows, all saying "München"
SELECT city FROM partner WHERE lower(city) LIKE 'münch%';

-- With DISTINCT: one row
SELECT DISTINCT city FROM partner WHERE lower(city) LIKE 'münch%' LIMIT 15;
```

`DISTINCT` on an indexed column is efficient because the index already stores values in sorted
order — PostgreSQL can walk the index and skip duplicates without reading the full table.

---

## Technique 5: `LIMIT` — Bounding Completion Results

Completion queries must never return unbounded results. `LIMIT` caps the result set at the
database level, meaning no unnecessary rows are read, transferred over the network, or
serialised into JSON:

```sql
SELECT DISTINCT postal_code, city
FROM partner
WHERE postal_code LIKE '33%'
ORDER BY postal_code
LIMIT 15;
```

The database stops as soon as it has found 15 distinct values. With a btree index on
`postal_code`, this is extremely fast — it reads index entries in order and stops early.

---

## Technique 6: `GENERATED ALWAYS AS STORED` — Keeping Derived Columns Fresh

PostgreSQL 12 introduced stored generated columns. A generated column is computed by the
database from other columns and stored on disk. It is always consistent — you cannot set it
to a wrong value because you cannot set it at all.

```sql
-- Defined in CREATE TABLE
name_search_vec TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('german', coalesce(name1,'') || ' ' || coalesce(name2,'') || ' ' || coalesce(name3,''))
) STORED
```

When you `UPDATE partner SET name1 = 'Schulze'`, PostgreSQL automatically recomputes
`name_search_vec`. The GIN index on that column is then updated by the index maintenance
mechanism. You never write a trigger or application code to keep them in sync.

Contrast with the alternative — a manually-maintained column or trigger — which requires
more code, more testing, and creates a consistency risk if any code path skips the trigger.

---

## Technique 7: Parameterised Queries — Preventing SQL Injection

Every value from user input (the `prefix` parameter in the completion endpoint) must be passed
as a bind parameter, never concatenated into the SQL string.

```java
// WRONG — SQL injection risk if prefix contains ' or %
String sql = "SELECT city FROM partner WHERE city LIKE '" + prefix + "%'";

// CORRECT — prefix is a bind parameter, the DB driver handles escaping
Partner.find("lower(city) LIKE lower(?1) || '%'", prefix);
```

The partner service additionally escapes `%` and `_` in the prefix before appending `%`:

```java
String safePre = prefix.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
// Query: WHERE city ILIKE :prefix ESCAPE '\'
```

This prevents a user typing `%` as their prefix from matching every row in the table.

---

## Putting It All Together — Which Technique for Which Field

| Field | Completion strategy | Completion index | Search technique | Search index |
|---|---|---|---|---|
| `postal_code` | prefix — `LIKE prefix%` | btree on `postal_code` | `ILIKE` with `*`→`%` | btree |
| `alpha_code` | prefix — `ILIKE prefix%` | btree on `alpha_code` | `ILIKE` with `*`→`%` | btree |
| `partner_number` | prefix — `LIKE prefix%` | btree on `partner_number` | exact `=` | btree |
| `city` | **contains** — `LIKE '%term%'` | GIN trigram on `lower(city)` | `ILIKE` with `*`→`%` | GIN trigram |
| `street` | **contains** — `LIKE '%term%'` | GIN trigram on `lower(street)` | `ILIKE` with `*`→`%` | GIN trigram |
| `name` | **contains** — `LIKE '%term%'` on `name1` | GIN trigram on `lower(name1)` | `@@ plainto_tsquery('german',…)` on `name_search_vec` | GIN full-text |

**Why the split between prefix and contains?**

Code-like fields (`postal_code`, `alpha_code`, `partner_number`) are typed left-to-right by
convention — a user looking up postal code 33100 starts with "3", then "33", then "331". Prefix
search is both correct and faster for these because btree indexes are more compact than trigram
indexes.

Text fields (`city`, `street`, `name`) are typed as fragments. A user searching for a street
remembers "straße" but not whether it is "Haupt-", "Muster-", or "Garten-". Forcing them to
type from the start of the name degrades the experience to worse than the old six-field form.
Contains-completion solves this; it is the reason the single-field approach is *better*, not
just more convenient.

The `name` field uses two different indexes for two different operations: the trigram index
for **completion** (partial text, raw characters) and the full-text GIN index for **search**
(whole words, stemmed and language-aware). This is not redundant — each index answers a
different question.

---

## When PostgreSQL Is Not Enough

PostgreSQL becomes the wrong tool for search when:

- The dataset grows beyond ~10 million rows and relevance-ranked results are needed
  (Elasticsearch has a built-in BM25 scoring model; PostgreSQL's `ts_rank` is simpler)
- Cross-field fuzzy ranking is needed (finding the "best" match across name, city, and street
  simultaneously with a single relevance score)
- Near-real-time search over a write-heavy stream of events (Elasticsearch is optimised for
  this; PostgreSQL's MVCC overhead is not)
- Faceted search with aggregations over many dimensions simultaneously

None of these apply to the partner search service at its current scale. If the dataset grows
to millions of partners and ranked results become a requirement, adding Elasticsearch as a
read-replica (fed by a CDC pipeline from PostgreSQL) is the right next step — not replacing
PostgreSQL.
