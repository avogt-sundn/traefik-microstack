# PostgreSQL reicht für Suche – Wichtige Techniken für Einsteiger erklärt

Eine übliche Reaktion beim Aufbau einer Suche ist, direkt zu Elasticsearch zu greifen. Dieses Dokument erklärt, warum PostgreSQL 15 — bereits im Stack — jede Suchanforderung des Partner-Service abdeckt, ohne eine zweite Datenbankengine einzuführen, und führt jede Technik von den Grundlagen aus.

---

## Warum nicht direkt zu Elasticsearch?

Elasticsearch ist eine spezialisierte Suchmaschine auf Basis von Apache Lucene. Für einige Anwendungsfälle ist es wirklich besser: Indizierung von hunderten Millionen Dokumenten, gewichtete Volltext-Rankings über viele Felder und Echtzeit-Analysen über Append-only-Logs. Aber es bringt echte Kosten mit sich:

- Ein zweiter zustandsbehafteter Dienst, der betrieben, gesichert und synchronisiert werden muss
- Daten müssen von PostgreSQL nach Elasticsearch kopiert und konsistent gehalten werden (doppelte Schreibvorgänge oder eine CDC-Pipeline wie Debezium)
- Eventuelle Konsistenz: Ein Write in PostgreSQL ist nicht sofort in Elasticsearch sichtbar
- Erhebliche Betriebskomplexität: Cluster-Größenplanung, Shard-Konfiguration, Index-Lifecycle-Management
- Überprovisioniert für ein Dataset von ~500–50.000 Partnern

Für den Partner-Suchdienst läuft jede Abfrage gegen eine einzelne `partner`-Tabelle mit bekannten Spalten. PostgreSQL kann das mit den richtigen Techniken gut. Es gibt kein Synchronisationsproblem, weil nur ein Datenspeicher vorhanden ist.

---

## Technik 1: `LIKE` und `ILIKE` – Präfix- und Substring-Matching

### Was das ist

`LIKE` vergleicht einen String mit einem Muster. `%` steht für beliebige Zeichenfolgen. `_` steht für genau ein Zeichen.

```sql
-- Zeilen, bei denen postal_code mit "331" beginnt
SELECT * FROM partner WHERE postal_code LIKE '331%';

-- Zeilen, bei denen city irgendwo "mün" enthält
SELECT * FROM partner WHERE city LIKE '%mün%';
```

`ILIKE` ist die case-insensitive Version:

```sql
-- Trifft auf "München", "münchen", "MÜNCHEN"
SELECT * FROM partner WHERE city ILIKE 'mün%';
```

### Warum es für Partner-Suche wichtig ist

Jede Completion-Abfrage ist eine **Präfixsuche** — der Benutzer hat den Anfang eines Wertes eingegeben und möchte gültige Fortsetzungen sehen. `LIKE 'prefix%'` ist genau das Muster.

### Die Performance-Falle und wie Indizes helfen

Ein einfaches `LIKE '%something%'` (Führender Wildcard) kann einen normalen Index nicht nutzen und erzwingt einen Full Table Scan. Aber `LIKE 'prefix%'` (nur Trailing-Wildcard) *kann* einen Btree-Index nutzen – mit einer Bedingung: die Spalte muss in der richtigen Kollation sortiert sein.

```sql
-- Dieser Index unterstützt WHERE postal_code LIKE '331%'
CREATE INDEX idx_partner_postal_code ON partner (postal_code);

-- Für case-insensitive Präfixsuche den lower-case Wert indizieren
CREATE INDEX idx_partner_city ON partner (lower(city));

-- Query muss exakt Ausdruck matchen
SELECT * FROM partner WHERE lower(city) LIKE lower('Mün') || '%';
```

Faustregel: **Trailing-Wildcard LIKE auf indexierter Spalte ist schnell; führender Wildcard LIKE ist Full Scan.** Für das Completion-Endpoint sind alle Abfragen Trailing-Wildcard, also funktionieren Btree-Indizes hervorragend.

---

## Technik 2: Volltextsuche – `tsvector`, `tsquery` und GIN-Indizes

Präfix-Matching funktioniert für strukturierte Felder wie Postleitzahl und alpha_code. Für das `name`-Feld tippen Nutzer Wörter aus irgendwo im mehrteiligen Namen (`name1`, `name2`, `name3`). Ein einfaches `ILIKE` auf einer Spalte würde Ergebnisse verpassen, in denen das Wort in `name2` steht. Volltextsuche löst das.

### `tsvector` – das vorverarbeitete Dokument

Ein `tsvector` ist eine sortierte Liste von **Lexemen** (normalisierte Wortstämme), abgeleitet von einer Textspalte. PostgreSQL verarbeitet den Rohtext einmal beim Schreiben und speichert das Ergebnis. Verarbeitet wird:

1. **Tokenisierung** — Aufteilung in Wörter
2. **Stoppwort-Entfernung** — häufige Wörter wie "und", "der", "die" werden entfernt
3. **Stemming** — Wörter werden auf ihre Wurzel reduziert mit einem sprachspezifischen Algorithmus (für `german`: "Müller" → "mullr", "Gesellschaft" → "gesellschaft")

```sql
SELECT to_tsvector('german', 'Müller und Söhne GmbH');
-- Ergebnis: 'gmbh':4 'mullr':1 'sohn':3
-- Hinweis: "und" entfernt (Stoppwort), Wörter gestemmt
```

Im Partner-Schema ist die Spalte `name_search_vec` eine **GENERATED STORED**-Spalte — sie wird automatisch neu berechnet, wenn sich `name1`, `name2`, `name3` oder `firstname` ändern:

```sql
name_search_vec TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('german',
        coalesce(name1, '') || ' ' ||
        coalesce(name2, '') || ' ' ||
        coalesce(name3, '') || ' ' ||
        coalesce(firstname, ''))
) STORED
```

`GENERATED ALWAYS AS ... STORED` bedeutet, der Wert wird wie eine normale Spalte auf der Festplatte gespeichert, aber immer konsistent durch die DB-Engine gehalten. Du aktualisierst ihn nie manuell.

### `tsquery` — der Suchausdruck

Ein `tsquery` ist ein normalisierter Suchbegriff mit optionalen booleschen Operatoren:

```sql
-- Zeilen, die sowohl "müller" als auch "gmbh" enthalten (gestemmt)
SELECT * FROM partner WHERE name_search_vec @@ to_tsquery('german', 'Müller & GmbH');

-- Einfacher: ganzer String als AND-Terms interpretiert
SELECT * FROM partner WHERE name_search_vec @@ plainto_tsquery('german', 'Müller GmbH');

-- Präfixsuche: :* matcht jedes Wort, das mit der Stammform beginnt
SELECT * FROM partner WHERE name_search_vec @@ to_tsquery('german', 'mull:*');
```

Der Operator `@@` bedeutet "tsvector matched tsquery".

`plainto_tsquery` ist die anfängerfreundliche Version — sie behandelt Leerzeichen als AND. `to_tsquery` bietet volle Kontrolle mit `&` (AND), `|` (OR) und `!` (NOT).

### GIN-Index — macht `@@` schnell

Ein GIN (Generalized Inverted Index) mappt jedes Lexem auf die Liste der Zeilen, in denen es vorkommt, ähnlich wie ein Register am Ende eines Buches Wörter zu Seitenzahlen zuordnet.

```sql
CREATE INDEX idx_partner_name_tsv ON partner USING GIN (name_search_vec);
```

Mit diesem Index springt `WHERE name_search_vec @@ plainto_tsquery('german', 'Müller')` direkt zu passenden Zeilen, statt sämtliche Zeilen zu lesen. Ohne Index würde jede `@@`-Abfrage jede Zeile scannen.

### Stemming-Caveat für Completion

Weil der tsvector Stämme speichert, hat Präfixsuche einen subtilen Nachteil: der Stamm von "Müller" ist "mullr", nicht "müll". Tippt ein Nutzer "Müll" als Präfix, ergibt das nicht zuverlässig einen Treffer auf "mullr". Für das **Completion-Endpoint** (Typahead Präfix) verwende `ILIKE` auf den Rohwert `name1`. Der GIN-Volltextindex ist richtig für die **Search-API**, wo der Nutzer vollständige Wörter eingibt.

---

## Technik 3: Trigramm-Ähnlichkeit — `pg_trgm`

### Was ein Trigramm ist

Ein Trigramm ist jede Folge von drei aufeinanderfolgenden Zeichen. Der String "München" liefert die Trigramme: "  m", " mü", "mün", "ünc", "nch", "che", "hen", "en ", "n  ". Jeder String lässt sich in Trigramme zerlegen, und zwei Strings sind ähnlich, wenn sie viele Trigramme teilen.

### Warum das wichtig ist

`ILIKE 'prefix%'` trifft nur Strings, die mit dem Präfix beginnen. Wenn ein Nutzer "straße" tippt und "Hauptstraße" erwartet, dann schlägt Präfixsuche fehl — "Hauptstraße" beginnt nicht mit "straße". Trigramme ermöglichen **Substring-Matching** (`LIKE '%straße%'`) *mit Index*:

```sql
-- Erweiterung (einmalig pro DB)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigramm-Index
CREATE INDEX idx_partner_street_trgm ON partner USING GIN (lower(street) gin_trgm_ops);

-- Jetzt nutzt führendes Wildcard LIKE den Index statt Full Scan
SELECT * FROM partner WHERE lower(street) LIKE '%' || lower('straße') || '%';
```

### Fuzzy-Matching mit `similarity()`

`pg_trgm` bietet auch einen Ähnlichkeitswert zwischen 0 und 1:

```sql
-- Partner mit mind. 40% Ähnlichkeit zu "Müler" (Tippfehler)
SELECT *, similarity(name1, 'Müler') AS score
FROM partner
WHERE similarity(name1, 'Müler') > 0.4
ORDER BY score DESC;
```

Das liefert **Tippfehler-Toleranz** — "Müler" findet "Müller", obwohl ein Buchstabe fehlt.

### Wann es eingesetzt wird – und der Partner-Service tut es

Der Partner-Service benutzt **Contains-Completion** (`LIKE '%term%'` mit Trigramm-GIN-Indizes) für die Felder `city`, `street` und `name`. Das ist eine bewusste Designentscheidung, kein späteres Feature:

- Eingabe "burg" muss "Hamburg", "Augsburg", "Regensburg" liefern — nicht nur Städte, die mit "burg" beginnen
- Eingabe "straße" muss "Hauptstraße", "Musterstraße", "Gartenstraße" liefern
- Eingabe "üller" muss "Müller GmbH" liefern

Ohne Trigramm-Indizes würde `LIKE '%term%'` bei jedem Tastenanschlag einen Full Table Scan erfordern. Mit GIN Trigramm-Index ist die Suche indexgestützt und schnell.

Code-ähnliche Felder (`postal_code`, `alpha_code`, `partner_number`) bleiben bei Präfixsuche mit Btree-Indizes — Nutzer geben diese von links nach rechts typischerweise ein und Prefix ist sowohl korrekt als auch schneller als Trigramm.

Tippfehler-Toleranz (`similarity()`) bleibt eine optionale Erweiterung, die ohne Schemaänderung aktiviert werden kann, falls sie später gebraucht wird.

---

## Technik 4: `DISTINCT` zur De-duplication bei Completion

Viele Partner haben dieselbe Stadt oder Straße. Eine Completion-Abfrage für "München" sollte eine Vorschlagzeile liefern, nicht 3000 Zeilen (jeweils ein Partner in München). `DISTINCT` fasst Duplikate zusammen:

```sql
-- Ohne DISTINCT: 3000 Zeilen, alle "München"
SELECT city FROM partner WHERE lower(city) LIKE 'münch%';

-- Mit DISTINCT: eine Zeile
SELECT DISTINCT city FROM partner WHERE lower(city) LIKE 'münch%' LIMIT 15;
```

`DISTINCT` auf einer indexierten Spalte ist effizient, weil der Index Werte bereits sortiert speichert — PostgreSQL kann den Index durchlaufen und Duplikate überspringen, ohne die ganze Tabelle zu lesen.

---

## Technik 5: `LIMIT` – Ergebnisse begrenzen

Completion-Abfragen dürfen keine unbeschränkten Ergebnisse zurückgeben. `LIMIT` begrenzt die Ergebnismenge auf DB-Ebene; es werden keine unnötigen Zeilen gelesen, übertragen oder in JSON serialisiert:

```sql
SELECT DISTINCT postal_code, city
FROM partner
WHERE postal_code LIKE '33%'
ORDER BY postal_code
LIMIT 15;
```

Die Datenbank stoppt, sobald sie 15 distinct Werte gefunden hat. Mit Btree-Index auf `postal_code` ist das extrem schnell — Einträge werden in Reihenfolge gelesen und früh beendet.

---

## Technik 6: `GENERATED ALWAYS AS STORED` – abgeleitete Spalten aktuell halten

PostgreSQL 12 hat gespeicherte generierte Spalten eingeführt. Eine generierte Spalte wird aus anderen Spalten berechnet und auf der Festplatte gespeichert. Sie ist immer konsistent — du kannst sie nicht manuell setzen, weil das nicht erlaubt ist.

```sql
-- Definiert in CREATE TABLE
name_search_vec TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('german', coalesce(name1,'') || ' ' || coalesce(name2,'') || ' ' || coalesce(name3,'') )
) STORED
```

Wenn du `UPDATE partner SET name1 = 'Schulze'` machst, berechnet PostgreSQL `name_search_vec` automatisch neu. Der GIN-Index auf dieser Spalte wird ebenfalls von der Indexwartung aktualisiert. Du musst keinen Trigger oder Anwendungs-Code schreiben, um es synchron zu halten.

Vergleich mit Alternative — manuell gepflegte Spalte oder Trigger — die erfordert mehr Code, mehr Tests und birgt Konsistenzrisiko, falls ein Codepfad den Trigger überspringt.

---

## Technik 7: parametrisierte Abfragen – Verhinderung von SQL-Injection

Jeder Wert aus Benutzerinput (z.B. `prefix` Parameter im Completion-Endpoint) muss als Bind-Parameter übergeben werden, niemals in den SQL-String konkatenieren.

```java
// FALSCH — SQL-Injection-Risiko, wenn prefix z.B. ' oder % enthält
String sql = "SELECT city FROM partner WHERE city LIKE '" + prefix + "%'";

// RICHTIG — prefix ist Bind-Parameter, der DB-Driver escaped ihn
Partner.find("lower(city) LIKE lower(?1) || '%'", prefix);
```

Der Partner-Service escaped zusätzlich `%` und `_` in prefix vor dem Anhängen von `%`:

```java
String safePre = prefix.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
// Query: WHERE city ILIKE :prefix ESCAPE '\\'
```

Das verhindert, dass ein Benutzer mit `%` als Prefix alles matcht.

---

## Alles zusammen — welche Technik für welches Feld

| Feld | Completion-Strategie | Completion-Index | Search-Technik | Search-Index |
|---|---|---|---|---|
| `postal_code` | Präfix — `LIKE prefix%` | Btree auf `postal_code` | `ILIKE` mit `*`→`%` | Btree |
| `alpha_code` | Präfix — `ILIKE prefix%` | Btree auf `alpha_code` | `ILIKE` mit `*`→`%` | Btree |
| `partner_number` | Präfix — `LIKE prefix%` | Btree | exakt `=` | Btree |
| `city` | **Contains** — `LIKE '%term%'` | GIN Trigramm auf `lower(city)` | `ILIKE` mit `*`→`%` | GIN Trigramm |
| `street` | **Contains** — `LIKE '%term%'` | GIN Trigramm auf `lower(street)` | `ILIKE` mit `*`→`%` | GIN Trigramm |
| `name` | **Contains** — `LIKE '%term%'` auf `name1` | GIN Trigramm auf `lower(name1)` | `@@ plainto_tsquery('german',…)` auf `name_search_vec` | GIN Volltext |

**Warum die Aufteilung zwischen Präfix und Contains?**

Code-ähnliche Felder (`postal_code`, `alpha_code`, `partner_number`) werden typischerweise von links nach rechts eingegeben — ein Benutzer sucht Postleitzahl 33100 mit "3", "33", "331". Präfixsuche ist sowohl korrekt als auch schneller, weil Btree-Indizes kompakter sind als Trigramm-Indizes.

Textfelder (`city`, `street`, `name`) werden eher als Fragmente eingegeben. Ein Nutzer erinnert sich an "straße", aber nicht, ob es "Haupt-", "Muster-" oder "Garten-" ist. Das Erzwingen von linksbündiger Eingabe verschlechtert die UX gegenüber dem älteren sechsspalten Ansatz. Contains-Completion löst das; das ist der Grund, warum der Single-Field-Ansatz *besser* ist, nicht nur bequemer.

Das `name`-Feld verwendet zwei verschiedene Indizes für zwei verschiedene Operationen: den Trigramm-Index für **Completion** (partieller Text, Rohzeichen) und den Volltext-GIN-Index für **Search** (ganze Wörter, gestemmt, sprachebewusst). Das ist nicht redundant — jeder Index beantwortet eine andere Frage.

---

## Wenn PostgreSQL nicht mehr ausreicht

PostgreSQL ist die falsche Wahl, wenn:

- Das Dataset wächst über ~10 Millionen Zeilen und Relevanz-ranking wird benötigt
  (Elasticsearch hat ein eingebautes BM25 Modell; PostgreSQLs `ts_rank` ist einfacher)
- Fuzzy-Ranking über mehrere Felder zugleich gebraucht wird (beste Übereinstimmung über name/city/street mit einem Score)
- Near-Realtime-Suche in einem schreibintensiven Event-Stream erforderlich ist
  (Elasticsearch ist dafür optimiert; PostgreSQLs MVCC-Overhead ist höher)
- Facettensuche mit Aggregationen über viele Dimensionen simultan benötigt wird

Keines davon trifft auf den Partner-Service im aktuellen Umfang zu. Wenn das Dataset auf Millionen von Partnern wächst und gewichtete Ergebnisse nötig werden, ist der nächste Schritt Elasticsearch als Read-Replica (gefüttert von einer CDC-Pipeline aus PostgreSQL) — nicht die Ablösung von PostgreSQL.
