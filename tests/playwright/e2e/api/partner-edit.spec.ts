import { test, expect } from '@playwright/test';

/**
 * Partner-edit domain e2e tests — API layer (no browser).
 *
 * Covers GET/PUT /api/partner-edit/spring/{partnerNumber} and
 * the ES re-index smoke triggered by a PUT.
 *
 * Seed data anchor (V2__seed_demo_partners.sql):
 *   partnerNumber 100002 | alphaCode SCHM | name1 "Schmidt & Partner KG"
 *   city Paderborn | postalCode 33100 | street Westernstraße | houseNumber 5
 */

const API_BASE = '/api/partner-edit/spring';

const SEED_PARTNER_NUMBER = 100002;
const SEED_ALPHA_CODE = 'SCHM';
const SEED_NAME1 = 'Schmidt & Partner KG';
const SEED_CITY = 'Paderborn';
const SEED_POSTAL_CODE = '33100';
const SEED_STREET = 'Westernstraße';
const SEED_HOUSE_NUMBER = '5';

// ── API tests (no browser) ────────────────────────────────────────────────────

test.describe('Partner-edit API — GET', () => {

  test('GET known partner returns 200 with correct fields', async ({ request }) => {
    const res = await request.get(`${API_BASE}/${SEED_PARTNER_NUMBER}`);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.partnerNumber).toBe(SEED_PARTNER_NUMBER);
    expect(body.alphaCode).toBe(SEED_ALPHA_CODE);
    expect(body.name1).toBe(SEED_NAME1);
    expect(body.city).toBe(SEED_CITY);
    expect(body.postalCode).toBe(SEED_POSTAL_CODE);
    expect(body.street).toBe(SEED_STREET);
    expect(body.houseNumber).toBe(SEED_HOUSE_NUMBER);
  });

  test('GET unknown partner returns 404', async ({ request }) => {
    const res = await request.get(`${API_BASE}/999999999`);
    expect(res.status()).toBe(404);
  });

  test('DetailResponse includes all expected fields', async ({ request }) => {
    const res = await request.get(`${API_BASE}/${SEED_PARTNER_NUMBER}`);
    expect(res.status()).toBe(200);

    const body = await res.json();
    const expectedFields = [
      'partnerNumber', 'alphaCode', 'name1', 'name2', 'name3',
      'firstname', 'street', 'houseNumber', 'postalCode', 'city',
      'type', 'groupType', 'groupNumber',
    ];
    for (const field of expectedFields) {
      expect(body, `field ${field} must be present`).toHaveProperty(field);
    }
  });

});

test.describe('Partner-edit API — PUT', () => {

  test('PUT updates partner and returns updated data, then restores original', async ({ request }) => {
    const getRes = await request.get(`${API_BASE}/${SEED_PARTNER_NUMBER}`);
    expect(getRes.status()).toBe(200);
    const original = await getRes.json();

    const modifiedName = `${SEED_NAME1} (e2e-test)`;

    const putRes = await request.put(`${API_BASE}/${SEED_PARTNER_NUMBER}`, {
      data: {
        alphaCode: original.alphaCode,
        name1: modifiedName,
        name2: original.name2,
        name3: original.name3,
        firstname: original.firstname,
        street: original.street,
        houseNumber: original.houseNumber,
        postalCode: original.postalCode,
        city: original.city,
        type: original.type,
        groupType: original.groupType,
        groupNumber: original.groupNumber,
      },
    });

    expect(putRes.status()).toBe(200);
    const updated = await putRes.json();
    expect(updated.partnerNumber).toBe(SEED_PARTNER_NUMBER);
    expect(updated.name1).toBe(modifiedName);
    expect(updated.city).toBe(original.city);
    expect(updated.alphaCode).toBe(original.alphaCode);

    const restoreRes = await request.put(`${API_BASE}/${SEED_PARTNER_NUMBER}`, {
      data: {
        alphaCode: original.alphaCode,
        name1: original.name1,
        name2: original.name2,
        name3: original.name3,
        firstname: original.firstname,
        street: original.street,
        houseNumber: original.houseNumber,
        postalCode: original.postalCode,
        city: original.city,
        type: original.type,
        groupType: original.groupType,
        groupNumber: original.groupNumber,
      },
    });
    expect(restoreRes.status()).toBe(200);
    const restored = await restoreRes.json();
    expect(restored.name1).toBe(original.name1);
  });

  test('PUT unknown partner returns 404', async ({ request }) => {
    const res = await request.put(`${API_BASE}/999999999`, {
      data: {
        alphaCode: 'TEST',
        name1: 'Does Not Exist',
        name2: null,
        name3: null,
        firstname: null,
        street: 'Teststraße',
        houseNumber: '1',
        postalCode: '00000',
        city: 'TestCity',
        type: 'P',
        groupType: null,
        groupNumber: null,
      },
    });
    expect(res.status()).toBe(404);
  });

});

// ── ES re-index smoke (API-only) ──────────────────────────────────────────────

test.describe('Partner-edit → ES re-index (PARTNER-EDIT-003)', () => {

  test('PUT triggers ES re-index: updated name1 appears in partner-search ES results', async ({ request }) => {
    const targetPn = 100005;
    const searchBase = '/api/partner/spring';

    const getRes = await request.get(`${API_BASE}/${targetPn}`);
    expect(getRes.status()).toBe(200);
    const original = await getRes.json();

    const modifiedName = `${original.name1} (e2e-reindex)`;

    const putRes = await request.put(`${API_BASE}/${targetPn}`, {
      data: {
        alphaCode: original.alphaCode,
        name1: modifiedName,
        name2: original.name2,
        name3: original.name3,
        firstname: original.firstname,
        street: original.street,
        houseNumber: original.houseNumber,
        postalCode: original.postalCode,
        city: original.city,
        type: original.type,
        groupType: original.groupType,
        groupNumber: original.groupNumber,
      },
    });
    expect(putRes.status()).toBe(200);

    await expect.poll(
      async () => {
        const searchRes = await request.get(`${searchBase}/search?q=${targetPn}`);
        const body = await searchRes.json();
        const esPartner = body.elasticsearch.results.find(
          (p: { partnerNumber: number }) => p.partnerNumber === targetPn,
        );
        return esPartner?.name1 ?? null;
      },
      {
        message: `ES index must reflect updated name1 "${modifiedName}" for partner ${targetPn}`,
        timeout: 10_000,
        intervals: [500, 1000, 2000],
      },
    ).toBe(modifiedName);

    const restoreRes = await request.put(`${API_BASE}/${targetPn}`, {
      data: {
        alphaCode: original.alphaCode,
        name1: original.name1,
        name2: original.name2,
        name3: original.name3,
        firstname: original.firstname,
        street: original.street,
        houseNumber: original.houseNumber,
        postalCode: original.postalCode,
        city: original.city,
        type: original.type,
        groupType: original.groupType,
        groupNumber: original.groupNumber,
      },
    });
    expect(restoreRes.status()).toBe(200);
  });

});

// ── Traefik routing smoke ─────────────────────────────────────────────────────

test.describe('Partner-edit Traefik routing', () => {

  test('remoteEntry.json is served as JSON (not HTML fallback)', async ({ request }) => {
    const res = await request.get('/partner-edit/remoteEntry.json');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/json');
    const body = await res.json();
    expect(body.name).toBe('partner-edit');
  });

});
