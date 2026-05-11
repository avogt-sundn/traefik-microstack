-- V3: Seed partners with intentional attribute overlaps.
--
-- How the tokenizer classifies multi-word input (relevant for understanding each group):
--
--   wordTokenCount = number of tokens matching ^[\p{L}.\-]{2,35}$ (pure-letter words).
--   CityClassifier (priority 60) fires ONLY when wordTokenCount <= 1.
--
--   Pattern 1 — street + postal code:
--     "Hauptstraße 80331"  → street="Hauptstraße"  postalCode="80331"
--     Works because "80331" is not a word token → wordTokenCount=1 → city disabled
--     but street is already claimed → city fires on nothing.
--
--   Pattern 2 — tsvector AND (both words must appear in name1/name2/name3/firstname):
--     "Logistik Hamburg"   → wordTokenCount=2 → city disabled
--                          → both become name tokens → merged name="Logistik Hamburg"
--                          → plainto_tsquery('german','Logistik Hamburg') = logistik & hamburg
--     Only matches if the company name itself contains BOTH words.
--     → Companies in this group deliberately embed the city name in name1.
--
--   Pattern 3 — single-word city search:
--     "Paderborn"          → wordTokenCount=1 → city="Paderborn" → all 4 Paderborn partners
--
--   Pattern 4 — postal code prefix only:
--     "33100"              → postalCode="33100" → 1 exact result
--     "331"  (autocomplete prefix) → 3 PLZs: 33100, 33102, 33104
--                                    (33098 starts with "330", not "331")
--
-- ─────────────────────────────────────────────────────────────────────────────
-- GROUP A: Hauptstraße across cities — disambiguate with postal code (Pattern 1)
--
--   "Hauptstraße"          → 4 results  (+ existing 100001 München)
--   "Hauptstraße 80331"    → 1  (100001 München — existing)
--   "Hauptstraße 50825"    → 1  (100046 Köln)
--   "Hauptstraße 22765"    → 1  (100047 Hamburg)
--   "Hauptstraße 70499"    → 1  (100048 Stuttgart)
-- ─────────────────────────────────────────────────────────────────────────────
-- GROUP B: "Logistik" companies — disambiguate with tsvector AND (Pattern 2)
--   Company names embed the city so that "Logistik <City>" matches exactly one.
--
--   "Logistik" (structured ?name=)  → 4 results  (+ 100005 Fischer Logistik)
--   "Logistik Hamburg"   → 1  (100049 "Hamburg Logistik GmbH")
--   "Logistik Stuttgart" → 1  (100050 "Stuttgart Logistik AG")
--   "Logistik Leipzig"   → 1  (100051 "Leipzig Logistik KG")
--   "Fischer Logistik"   → 1  (100005 existing — only match with both words in name)
-- ─────────────────────────────────────────────────────────────────────────────
-- GROUP C: Paderborn cluster — PLZ 330xx–331xx — prefix "331" → 3 PLZs
--   (V4 renamed 100053–100055 to standalone words for German FTS stemming)
--
--   "Paderborn"            → 5 results  (100052–100055 + 200007 Verbund)
--   "33100"                → 1  (100052 Paderborner Metallbau GmbH)
--   "33098"                → 1  (100053 Paderborner Buch GmbH — V4 renamed)
--   "Paderborn Metallbau"  → 1  (100052, tsvector: paderborn & metallbau ✓)
--   "Paderborn Buch"       → 1  (100053, tsvector: paderborn & buch ✓)
--   "Paderborn Auto"       → 1  (100054, tsvector: paderborn & auto ✓)
--   "Paderborn Medizin"    → 1  (100055, tsvector: paderborn & medizin ✓)
-- ─────────────────────────────────────────────────────────────────────────────
-- GROUP D: "Bau" companies — city embedded in name1 (Pattern 2)
--
--   "Bau" (structured ?name=)  → 6+ results
--   "Bau Hamburg"   → 1  (100056 "Hamburg Bau GmbH")
--   "Bau Köln"      → 1  (100057 "Kölner Bau Service AG", tsvector: kölner→köln ✓)
--                          Note: 100004 Wagner Bau AG has no "köln" in name → won't match
--   "Bau München"   → 1  (100058 "München Bau KG")
-- ─────────────────────────────────────────────────────────────────────────────
-- GROUP E: Frankfurt cluster — city in name1 (Pattern 2 + single-word city)
--
--   "Frankfurt"           → 4 results  (100059, 100060, + 100005 Fischer Logistik
--                                        + 200005 Mittelstandsgruppe Verbund)
--   "Frankfurt Verlag"    → 1  (100059, tsvector: frankfurt & verlag ✓)
--   "Frankfurt Vertrieb"  → 1  (100060, tsvector: frankfurt & vertrieb ✓)
-- ─────────────────────────────────────────────────────────────────────────────
-- GROUP F: "Müller" variants — city embedded in name1 (Pattern 2)
--   Note: existing 100001 "Müller GmbH" (München) has no city in name1,
--   so "Müller München" finds only 100063, not 100001.
--   This intentionally demonstrates the tsvector boundary.
--
--   "Müller" (single word)  → city="Müller" → 0 results (no city named Müller)
--   "Müller GmbH"           → 3 results  (100001 + 100061 + 100063, all have "müller" & "gmbh")
--   "Müller Hannover"       → 1  (100061)
--   "Müller Hamburg"        → 1  (100062)
--   "Müller München"        → 1  (100063 "Müller München GmbH"; NOT 100001 — no "münchen" in name1)
-- ─────────────────────────────────────────────────────────────────────────────
-- GROUP G: Schillerstraße across cities — disambiguate with postal code (Pattern 1)
--   Existing: 100002 Schmidt & Söhne, Schillerstraße 5, 10117 Berlin
--
--   "Schillerstraße"        → 3 results
--   "Schillerstraße 10117"  → 1  (100002 Berlin — existing)
--   "Schillerstraße 80336"  → 1  (100064 München)
--   "Schillerstraße 40227"  → 1  (100065 Düsseldorf)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO partner (partner_number, alpha_code, name1, name2, street, house_number, postal_code, city, type, group_type) VALUES

-- ── GROUP A: Hauptstraße across cities ────────────────────────────────────
(100046, 'MAIER',  'Maier Naturkost GmbH',        NULL,               'Hauptstraße',      '3',  '50825', 'Köln',             'P', 'EXTERN'),
(100047, 'REINDL', 'Reindl Optik GmbH',           NULL,               'Hauptstraße',      '17', '22765', 'Hamburg',          'P', 'INTERN'),
(100048, 'ELTMN',  'Eltmann Elektrohandel GmbH',  NULL,               'Hauptstraße',      '29', '70499', 'Stuttgart',        'P', 'EXTERN'),

-- ── GROUP B: Logistik — city embedded in name1 ────────────────────────────
(100049, 'HAMLOG', 'Hamburg Logistik GmbH',        NULL,               'Speicherstraße',   '8',  '20457', 'Hamburg',          'P', 'EXTERN'),
(100050, 'STGLOG', 'Stuttgart Logistik AG',        'Niederlassung West','Güterstraße',      '22', '70376', 'Stuttgart',        'P', 'INTERN'),
(100051, 'LPZLOG', 'Leipzig Logistik KG',          NULL,               'Hälterstraße',     '5',  '04347', 'Leipzig',          'P', 'EXTERN'),

-- ── GROUP C: Paderborn cluster (PLZ 331xx) ────────────────────────────────
(100052, 'PADMET', 'Paderborner Metallbau GmbH',   NULL,               'Paderwall',        '2',  '33100', 'Paderborn',        'P', 'INTERN'),
(100053, 'PADBCH', 'Paderborner Buchhandlung GmbH',NULL,               'Westernstraße',    '5',  '33098', 'Paderborn',        'P', 'EXTERN'),
(100054, 'PADAUT', 'Paderborner Autohaus AG',       NULL,               'Detmolder Straße', '45', '33102', 'Paderborn',        'P', 'EXTERN'),
(100055, 'PADMED', 'Paderborner Medizintechnik KG', NULL,               'Riemekestraße',    '8',  '33104', 'Paderborn',        'P', 'INTERN'),

-- ── GROUP D: Bau — city embedded in name1 ────────────────────────────────
(100056, 'HAMBAU', 'Hamburg Bau GmbH',             NULL,               'Billstraße',       '80', '20539', 'Hamburg',          'P', 'EXTERN'),
(100057, 'KOLBAU', 'Kölner Bau Service AG',        NULL,               'Clevischer Ring',  '12', '51063', 'Köln',             'P', 'INTERN'),
(100058, 'MUNBAU', 'München Bau KG',               NULL,               'Landsberger Allee','14', '80339', 'München',          'P', 'EXTERN'),

-- ── GROUP E: Frankfurt — city embedded in name1 ───────────────────────────
(100059, 'FFMVLG', 'Frankfurt Verlag GmbH',        'Verlagsgruppe',    'Gutleutstraße',    '14', '60329', 'Frankfurt am Main', 'P', 'INTERN'),
(100060, 'FFMVTB', 'Frankfurt Vertrieb KG',        NULL,               'Berger Straße',    '30', '60316', 'Frankfurt am Main', 'P', 'EXTERN'),

-- ── GROUP F: Müller — city embedded in name1 ─────────────────────────────
(100061, 'MULHVR', 'Müller Hannover GmbH',         NULL,               'Steinstraße',      '4',  '30159', 'Hannover',         'P', 'EXTERN'),
(100062, 'MULHBG', 'Müller Hamburg AG',            NULL,               'Alsterring',       '18', '20099', 'Hamburg',          'P', 'INTERN'),
(100063, 'MULMUN', 'Müller München GmbH',          NULL,               'Dachauer Straße',  '9',  '80335', 'München',          'P', 'EXTERN'),

-- ── GROUP G: Schillerstraße across cities ────────────────────────────────
(100064, 'HOLLNR', 'Hollander Elektrotechnik KG',  NULL,               'Schillerstraße',   '6',  '80336', 'München',          'P', 'INTERN'),
(100065, 'BERNRD', 'Bernard & Weiss GmbH',         NULL,               'Schillerstraße',   '22', '40227', 'Düsseldorf',       'P', 'EXTERN'),

-- ── New Verbunde ──────────────────────────────────────────────────────────
(200007, 'PADRBD', 'Paderborner Unternehmensverbund','Dachgesellschaft','Liboriberg',       '1',  '33098', 'Paderborn',        'V', 'INTERN'),
(200008, 'RHRMTL', 'Rhein-Ruhr Metallgruppe AG',   'Holding',          'Ruhrdeich',        '5',  '44137', 'Dortmund',         'V', 'EXTERN');
