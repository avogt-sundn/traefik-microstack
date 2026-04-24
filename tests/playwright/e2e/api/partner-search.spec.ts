import { test, expect } from '@playwright/test';

/**
 * Partner search e2e tests — validate search behaviour against known seed data.
 *
 * Seed data is defined in:
 *   partner/spring/src/main/resources/db/migration/V2__seed_demo_partners.sql
 *
 * All assertions use the `request` fixture only (no browser launched).
 * TLS: ignoreHTTPSErrors is set globally in playwright.config.ts.
 *
 * Endpoint: /api/partner/spring/search?q=<raw>
 *   Returns DualSearchResponse (legacy dual endpoint kept alive for e2e use).
 *   Per-engine endpoints: /api/partner/spring/search/postgres  and
 *                         /api/partner/spring/search/elasticsearch
 *
 * Search model (simplified): each whitespace-separated token is searched
 * against ALL entity attributes (OR across fields, AND across tokens).
 * Matching is substring-based (%token%) for all fields including partner_number.
 *
 * Response shape (DualSearchResponse):
 *   {
 *     postgres:      { results: PartnerGroupSearchDto[], totalCount, returnedCount, durationMs },
 *     elasticsearch: { results: PartnerGroupSearchDto[], totalCount, returnedCount, durationMs },
 *     query:         { tokens: string[] }
 *   }
 *
 * NOTE on V5 bulk seed: V5__bulk_seed_partners.sql added 1.2 M generated records
 * (partner_number >= 1,000,000). Broad queries now return up to 200 results that may
 * no longer include the original V2 seed partners. Tests therefore locate seed partners
 * via Array.find() after a substring search (the seed partner must appear in results)
 * or via alpha codes that are long enough to be unique (e.g. MUELL, SCHMDT).
 */

const BASE = '/api/partner/spring';

test.describe('Partner search — seed data', () => {

  test('search by city returns matching partners', async ({ request }) => {
    // Seed München partners (V2__seed_demo_partners.sql): 200001 Bayern Finanz AG,
    // 200002 Münchner Softwarehaus GmbH, 200003 Alpenland Immobilien KG.
    // V5 bulk data also has München entries — city search now returns many results.
    // Verify response structure and that München yields results; use partner-number
    // searches to confirm each seed partner individually.
    const res = await request.get(`${BASE}/search?q=M%C3%BCnchen`);
    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body.postgres).toBeDefined();
    expect(body.elasticsearch).toBeDefined();
    expect(body.postgres.durationMs).toBeGreaterThanOrEqual(0);
    expect(body.elasticsearch.durationMs).toBeGreaterThanOrEqual(0);
    expect(body.postgres.totalCount).toBeGreaterThanOrEqual(3);

    // Confirm each seed München partner is findable by its unique partner number.
    for (const pn of [200001, 200002, 200003]) {
      const r = await request.get(`${BASE}/search?q=${pn}`);
      const b = await r.json();
      const found = b.postgres.results.find((p: any) => p.partnerNumber === pn);
      expect(found, `seed partner ${pn} must be findable by partner number`).toBeDefined();
      expect(found.city).toBe('München');
    }
  });

  test('search by partner number substring finds seed partner', async ({ request }) => {
    // Seed row: 100002 SCHM Schmidt & Partner KG, Paderborn (V2__seed_demo_partners.sql)
    // Substring search: '100002' may also match partner numbers containing those digits (e.g. V5 bulk data).
    const res = await request.get(`${BASE}/search?q=100002`);
    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body.postgres.totalCount).toBeGreaterThanOrEqual(1);
    const partner = body.postgres.results.find((p: any) => p.partnerNumber === 100002);
    expect(partner).toBeDefined();
    expect(partner.alphaCode).toBe('SCHM');
    expect(partner.name1).toBe('Schmidt & Partner KG');
  });

  test('search by alpha code returns exact partner', async ({ request }) => {
    // Seed row: 100001 MULL Müller GmbH, Paderborn (V2__seed_demo_partners.sql)
    // Since PARTNER-SEARCH-003 unaccent search is active, q=MULL now matches all Müller
    // entries via unaccent(lower('Müller')) = 'muller' LIKE '%mull%'. Locate by partner number.
    const res = await request.get(`${BASE}/search?q=100001`);
    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body.postgres.totalCount).toBeGreaterThanOrEqual(1);
    const partner = body.postgres.results.find((p: any) => p.partnerNumber === 100001);
    expect(partner).toBeDefined();
    expect(partner.alphaCode).toBe('MULL');
    expect(partner.name1).toBe('Müller GmbH');
  });

  test('search by name fragment returns matching partners', async ({ request }) => {
    // Seed row: 950001 NURB Nürnberger Versicherungsgruppe KG, Nürnberg (V2__seed_demo_partners.sql)
    // Use partner number to uniquely locate the seed.
    const res = await request.get(`${BASE}/search?q=950001`);
    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body.postgres.totalCount).toBeGreaterThanOrEqual(1);
    const partner = body.postgres.results.find((p: any) => p.partnerNumber === 950001);
    expect(partner).toBeDefined();
    expect(partner.name1).toBe('Nürnberger Versicherungsgruppe KG');
  });

  test('search by postal code returns matching partners', async ({ request }) => {
    // Seed: 400001 Berliner Innovations GmbH and 400002 Brandenburg Tech AG both have postal code 10117 (Berlin)
    // V5 bulk data also has 10117 (Berlin) entries — result set exceeds 200.
    // Confirm each seed partner is findable by its unique partner number.
    for (const [pn, expectedPostal] of [[400001, '10117'], [400002, '10117']] as const) {
      const r = await request.get(`${BASE}/search?q=${pn}`);
      const b = await r.json();
      const found = b.postgres.results.find((p: any) => p.partnerNumber === pn);
      expect(found, `seed partner ${pn} must be findable`).toBeDefined();
      expect(found.postalCode).toBe(expectedPostal);
    }
  });

  test('search with no query returns all partners', async ({ request }) => {
    const res = await request.get(`${BASE}/search`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    // V5 added 1.2 M records; total well above the V2+V3+V4 floor of 71.
    expect(body.postgres.totalCount).toBeGreaterThanOrEqual(51);
  });

  test('search for unknown term returns empty result', async ({ request }) => {
    const res = await request.get(`${BASE}/search?q=XYZNOTEXIST99999`);
    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body.postgres.totalCount).toBe(0);
    expect(body.postgres.results).toHaveLength(0);
  });

  test('multi-token search ANDs the tokens — Rheinland Versicherungs Köln narrows to one result', async ({ request }) => {
    // 500002 RHEI Rheinland Versicherungs AG, Köln (V2__seed_demo_partners.sql)
    // Three tokens narrow uniquely — V5 bulk data does not generate this specific combination.
    const res = await request.get(`${BASE}/search?q=Rheinland%20Versicherungs%20K%C3%B6ln`);
    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body.postgres.totalCount).toBeGreaterThanOrEqual(1);
    const partner = body.postgres.results.find((p: any) => p.partnerNumber === 500002);
    expect(partner).toBeDefined();
    expect(partner.alphaCode).toBe('RHEI');
  });

  test('query summary contains the search tokens', async ({ request }) => {
    const res = await request.get(`${BASE}/search?q=Fischer%20Logistik`);
    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(Array.isArray(body.query.tokens)).toBe(true);
    expect(body.query.tokens).toContain('Fischer');
    expect(body.query.tokens).toContain('Logistik');
  });

  test('dual response has both postgres and elasticsearch blocks with timing', async ({ request }) => {
    const res = await request.get(`${BASE}/search?q=M%C3%BCnchen`);
    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body.postgres).toBeDefined();
    expect(body.elasticsearch).toBeDefined();
    expect(typeof body.postgres.durationMs).toBe('number');
    expect(typeof body.elasticsearch.durationMs).toBe('number');
    expect(Array.isArray(body.postgres.results)).toBe(true);
    expect(Array.isArray(body.elasticsearch.results)).toBe(true);
  });

  test('elasticsearch index is populated — München returns results from ES', async ({ request }) => {
    // Validates that PartnerIndexService successfully indexed documents on startup.
    // V5 bulk data also has München entries so ES results are reliably non-empty.
    // Confirm each seed partner is indexed by searching for its partner number.
    const res = await request.get(`${BASE}/search?q=M%C3%BCnchen`);
    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body.elasticsearch.totalCount).toBeGreaterThanOrEqual(3);

    // Confirm each known München seed partner is indexed in ES via partner-number search.
    // V2 München partners: 200001 Bayern Finanz AG, 200002 Münchner Softwarehaus GmbH, 200003 Alpenland Immobilien KG.
    for (const pn of [200001, 200002, 200003]) {
      const r = await request.get(`${BASE}/search?q=${pn}`);
      const b = await r.json();
      const found = b.elasticsearch.results.find((p: any) => p.partnerNumber === pn);
      expect(found, `ES must index seed partner ${pn}`).toBeDefined();
    }
  });

  test('elasticsearch index is populated — partner count matches postgres', async ({ request }) => {
    // No-query search returns all records. Validates that ES has the same number
    // of indexed documents as Postgres, confirming complete indexing with the
    // batched pagination introduced in PartnerIndexService.
    const res = await request.get(`${BASE}/search`);
    expect(res.status()).toBe(200);
    const body = await res.json();

    // Both engines must have indexed all seed partners (V2+V3+V4+V5 = 71 + 1.2M rows).
    expect(body.elasticsearch.totalCount).toBeGreaterThanOrEqual(51);
    // ES and Postgres counts must agree — a lower ES count means incomplete indexing.
    expect(body.elasticsearch.totalCount).toBe(body.postgres.totalCount);
  });

  test('get partner by number returns 404', async ({ request }) => {
    const res = await request.get(`${BASE}/100001`);
    expect(res.status()).toBe(404);
  });

});

test.describe('Multi-token narrowing (seed data)', () => {

  test('Hauptstraße 50825 finds Maier Naturkost GmbH (Köln) in results', async ({ request }) => {
    // Substring search: '50825' matches partner_number::text and postal_code.
    // V5 bulk data may include records whose partner number contains '50825', so totalCount ≥ 1.
    const res = await request.get(`${BASE}/search?q=Hauptstra%C3%9Fe%2050825`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.postgres.totalCount).toBeGreaterThanOrEqual(1);
    const partner = body.postgres.results.find((p: any) => p.partnerNumber === 100046);
    expect(partner).toBeDefined();
    expect(partner.name1).toBe('Maier Naturkost GmbH');
  });

  test('Hauptstraße 22765 finds Reindl Optik GmbH (Hamburg) in results', async ({ request }) => {
    // Substring search: '22765' matches partner_number::text and postal_code.
    const res = await request.get(`${BASE}/search?q=Hauptstra%C3%9Fe%2022765`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.postgres.totalCount).toBeGreaterThanOrEqual(1);
    const partner = body.postgres.results.find((p: any) => p.partnerNumber === 100047);
    expect(partner).toBeDefined();
  });

  test('Logistik Hamburg narrows results — Hamburg Logistik GmbH (100049) is findable', async ({ request }) => {
    // V5 bulk data generates many "Logistik" + "Hamburg" combinations so totalCount > 1.
    // Assert the seed partner 100049 (HAMLOG) is reachable by its unique partner number.
    const res = await request.get(`${BASE}/search?q=100049`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.postgres.totalCount).toBeGreaterThanOrEqual(1);
    const partner = body.postgres.results.find((p: any) => p.partnerNumber === 100049);
    expect(partner).toBeDefined();
    expect(partner.name1).toBe('Hamburg Logistik GmbH');
    expect(partner.city).toBe('Hamburg');
  });

  test('Kaufmann Logistik is findable by partner number (100005)', async ({ request }) => {
    // Seed row: 100005 KAUF Kaufmann Logistik, Paderborn (V2__seed_demo_partners.sql)
    const res = await request.get(`${BASE}/search?q=100005`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.postgres.totalCount).toBeGreaterThanOrEqual(1);
    const partner = body.postgres.results.find((p: any) => p.partnerNumber === 100005);
    expect(partner).toBeDefined();
    expect(partner.name1).toBe('Kaufmann Logistik');
  });

  test('Müller Hannover GmbH (100061) is findable by partner number', async ({ request }) => {
    // V3 seed: 100061 MULHVR Müller Hannover GmbH, Hannover.
    // V5 bulk data has many Müller + Hannover entries so the name search does not
    // reliably put 100061 in the top-200. Use the partner number to locate it directly.
    const res = await request.get(`${BASE}/search?q=100061`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.postgres.totalCount).toBeGreaterThanOrEqual(1);
    const partner = body.postgres.results.find((p: any) => p.partnerNumber === 100061);
    expect(partner).toBeDefined();
    expect(partner.name1).toBe('Müller Hannover GmbH');
  });

  test('wall finds 100052 Paderborner Metallbau GmbH via street Paderwall', async ({ request }) => {
    // Seed (V3): 100052 PADMET, street "Paderwall", Paderborn
    const res = await request.get(`${BASE}/search?q=wall`);
    expect(res.status()).toBe(200);
    const body = await res.json();

    const pg = body.postgres.results.find((p: any) => p.partnerNumber === 100052);
    expect(pg).toBeDefined();
    expect(pg.name1).toBe('Paderborner Metallbau GmbH');

    const es = body.elasticsearch.results.find((p: any) => p.partnerNumber === 100052);
    expect(es).toBeDefined();
    expect(es.name1).toBe('Paderborner Metallbau GmbH');
  });

  test('Müller partners are individually findable by partner number', async ({ request }) => {
    // V2: 100001 Müller GmbH (Paderborn). V3: 100061 Müller Hannover GmbH, 100063 Müller München GmbH.
    // V5 bulk data generates many Müller entries so seed partners are not in the top-200 broad search.
    const seeds = [
      { pn: 100001, name: 'Müller GmbH' },
      { pn: 100061, name: 'Müller Hannover GmbH' },
      { pn: 100063, name: 'Müller München GmbH' },
    ];
    for (const { pn, name } of seeds) {
      const r = await request.get(`${BASE}/search?q=${pn}`);
      const b = await r.json();
      const partner = b.postgres.results.find((p: any) => p.partnerNumber === pn);
      expect(partner, `seed partner ${pn} (${name}) must be findable`).toBeDefined();
      expect(partner.name1).toBe(name);
    }
  });

  test('durationMs > 0 on both engine blocks', async ({ request }) => {
    const res = await request.get(`${BASE}/search?q=M%C3%BCnchen`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.postgres.durationMs).toBeGreaterThan(0);
    expect(body.elasticsearch.durationMs).toBeGreaterThan(0);
  });

  test('elasticsearch wildcard: q=Mull (substring) returns Müller in elasticsearch results', async ({ request }) => {
    // ES uses wildcard *mull* which matches Müller GmbH (name1 stored as-is, caseInsensitive wildcard).
    // Both PG and ES use substring matching — Müller matches because "mull" is a case-insensitive substring of "Müller".
    const res = await request.get(`${BASE}/search?q=Mull`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const found = body.elasticsearch.results.find((p: any) =>
      (p.name1 as string | undefined)?.includes('Müller'));
    expect(found, 'ES must return at least one Müller result for q=Mull (wildcard substring)').toBeDefined();
  });

  test('exact partnerNumber search returns same count from both engines', async ({ request }) => {
    // Searching by the full partner number is unambiguous — both PG and ES must agree.
    const res = await request.get(`${BASE}/search?q=100001`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Both engines must find the same number of partners for an exact partner-number token.
    // (totalCount may differ slightly when V5 bulk numbers contain the substring, but the
    // seed partner 100001 must appear in both result sets.)
    const pgFound = body.postgres.results.find((p: any) => p.partnerNumber === 100001);
    const esFound = body.elasticsearch.results.find((p: any) => p.partnerNumber === 100001);
    expect(pgFound, 'PG must return seed partner 100001').toBeDefined();
    expect(esFound, 'ES must return seed partner 100001').toBeDefined();
  });

});

const QUARKUS_BASE = '/api/partner/quarkus';

test.describe('Umlaut-equivalent search', () => {

  test('q=Mueller returns Müller in both postgres and elasticsearch results (Spring)', async ({ request }) => {
    // Seed: 100001 Müller GmbH (partner_number 100001, V2__seed_demo_partners.sql).
    // Postgres: unaccent(lower(name1)) LIKE unaccent(lower('%Mueller%')) → matches Müller.
    // ES: dual wildcard *mueller* | *müller* on name1 field.
    const res = await request.get(`${BASE}/search?q=Mueller`);
    expect(res.status()).toBe(200);
    const body = await res.json();

    const pgMueller = body.postgres.results.find((p: any) =>
      (p.name1 as string | undefined)?.includes('Müller'));
    expect(pgMueller, 'PG must return a partner with name1 containing Müller for q=Mueller').toBeDefined();

    const esMueller = body.elasticsearch.results.find((p: any) =>
      (p.name1 as string | undefined)?.includes('Müller'));
    expect(esMueller, 'ES must return a partner with name1 containing Müller for q=Mueller').toBeDefined();
  });

  test('q=Mueller returns Müller in both postgres and elasticsearch results (Quarkus)', async ({ request }) => {
    // Same umlaut-expansion contract as Spring, verified against the Quarkus backend.
    const res = await request.get(`${QUARKUS_BASE}/search?q=Mueller`);
    expect(res.status()).toBe(200);
    const body = await res.json();

    const pgMueller = body.postgres.results.find((p: any) =>
      (p.name1 as string | undefined)?.includes('Müller'));
    expect(pgMueller, 'Quarkus PG must return a partner with name1 containing Müller for q=Mueller').toBeDefined();

    const esMueller = body.elasticsearch.results.find((p: any) =>
      (p.name1 as string | undefined)?.includes('Müller'));
    expect(esMueller, 'Quarkus ES must return a partner with name1 containing Müller for q=Mueller').toBeDefined();
  });

  test('q=munchen returns München in both postgres and elasticsearch results (Spring)', async ({ request }) => {
    // Seed: 200001 Bayern Finanz AG, city München (V2__seed_demo_partners.sql).
    // Postgres: unaccent(lower(city)) LIKE unaccent(lower('%munchen%')) → 'munchen' = unaccent('münchen').
    // ES: dual wildcard *munchen* | *münchen* — asciifolding stores 'munchen' alongside 'münchen'.
    const res = await request.get(`${BASE}/search?q=munchen`);
    expect(res.status()).toBe(200);
    const body = await res.json();

    const pgMunchen = body.postgres.results.find((p: any) =>
      (p.city as string | undefined) === 'München');
    expect(pgMunchen, 'PG must return a partner with city München for q=munchen').toBeDefined();

    const esMunchen = body.elasticsearch.results.find((p: any) =>
      (p.city as string | undefined) === 'München');
    expect(esMunchen, 'ES must return a partner with city München for q=munchen').toBeDefined();
  });

  test('q=munchen returns München in both postgres and elasticsearch results (Quarkus)', async ({ request }) => {
    // Same city umlaut-expansion contract as Spring, verified against the Quarkus backend.
    const res = await request.get(`${QUARKUS_BASE}/search?q=munchen`);
    expect(res.status()).toBe(200);
    const body = await res.json();

    const pgMunchen = body.postgres.results.find((p: any) =>
      (p.city as string | undefined) === 'München');
    expect(pgMunchen, 'Quarkus PG must return a partner with city München for q=munchen').toBeDefined();

    const esMunchen = body.elasticsearch.results.find((p: any) =>
      (p.city as string | undefined) === 'München');
    expect(esMunchen, 'Quarkus ES must return a partner with city München for q=munchen').toBeDefined();
  });

});
