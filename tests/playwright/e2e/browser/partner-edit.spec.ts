import { test, expect } from '@playwright/test';
import { Selectors } from '../../helpers/selectors';

/**
 * Partner-edit domain e2e tests — browser (Angular UI).
 *
 * Covers the full user journey: search → click partner row → view detail →
 * edit a field → save → return to search → confirm updated data appears.
 *
 * Seed data anchor (V2__seed_demo_partners.sql):
 *   partnerNumber 100002 | alphaCode SCHM | name1 "Schmidt & Partner KG"
 *
 * Search by alpha code SCHM (not partner number) to avoid V5 bulk-data
 * substring collisions.
 */

const API_BASE = '/api/partner-edit/spring';

const SEED_PARTNER_NUMBER = 100002;
const SEED_NAME1 = 'Schmidt & Partner KG';
const SEED_SEARCH_TERM = 'SCHM';

const CLIENT = 'abc';

// ── UI save via form ──────────────────────────────────────────────────────────

test.describe('Partner-edit UI — edit and save via form', () => {

  const UI_SAVE_NAME = 'Schmidt & Partner KG [ui-save]';

  test.afterEach(async ({ request }) => {
    const getRes = await request.get(`${API_BASE}/${SEED_PARTNER_NUMBER}`);
    if (getRes.status() !== 200) return;
    const current = await getRes.json();
    if (current.name1 !== SEED_NAME1) {
      await request.put(`${API_BASE}/${SEED_PARTNER_NUMBER}`, {
        data: {
          alphaCode: current.alphaCode,
          name1: SEED_NAME1,
          name2: current.name2,
          name3: current.name3,
          firstname: current.firstname,
          street: current.street,
          houseNumber: current.houseNumber,
          postalCode: current.postalCode,
          city: current.city,
          type: current.type,
          groupType: current.groupType,
          groupNumber: current.groupNumber,
        },
      });
    }
  });

  test('navigate, click Edit, change name1, click Save, GET returns updated name1', async ({ page, request }) => {
    await page.goto(`/${CLIENT}/partner-edit/view/${SEED_PARTNER_NUMBER}`);

    await expect(page.locator(Selectors.editPartnerTabGroup)).toBeVisible({ timeout: 10_000 });

    await page.locator(Selectors.partnerEditButton).click();

    const company1Input = page.locator('partner-address-tab input[matinput]').first();
    await expect(company1Input).toBeVisible({ timeout: 5000 });

    await company1Input.fill(UI_SAVE_NAME);
    await page.waitForTimeout(500);

    await page.locator(Selectors.partnerSaveButton).click();

    await expect(page.locator(Selectors.partnerSaveButton)).not.toBeVisible({ timeout: 8000 });

    const getRes = await request.get(`${API_BASE}/${SEED_PARTNER_NUMBER}`);
    expect(getRes.status()).toBe(200);
    const body = await getRes.json();
    expect(body.name1).toBe(UI_SAVE_NAME);
  });

});

// ── UI navigation tests ───────────────────────────────────────────────────────

test.describe('Partner-edit UI — search → row click → navigation', () => {

  test('clicking a partner row navigates to the partner-edit view URL', async ({ page }) => {
    await page.goto(`/${CLIENT}/partner/search`);
    await page.waitForSelector(Selectors.partnerSearchInput);

    await page.locator(Selectors.partnerSearchInput).fill(SEED_SEARCH_TERM);
    await page.keyboard.press('Enter');

    await page.waitForSelector(Selectors.matRow, { timeout: 8000 });
    const seedRow = page.locator(Selectors.matRow).filter({ hasText: SEED_NAME1 });
    await expect(seedRow).toBeVisible({ timeout: 8000 });

    await seedRow.click();

    await page.waitForURL(`**/${CLIENT}/partner-edit/view/${SEED_PARTNER_NUMBER}`, {
      timeout: 8000,
    });
    expect(page.url()).toContain(`/partner-edit/view/${SEED_PARTNER_NUMBER}`);
  });

  test('direct URL navigation loads partner data without redirect', async ({ page }) => {
    await page.goto(`/${CLIENT}/partner-edit/view/${SEED_PARTNER_NUMBER}`);

    await expect(page).toHaveURL(
      new RegExp(`/${CLIENT}/partner-edit/view/${SEED_PARTNER_NUMBER}`),
      { timeout: 8000 },
    );

    await expect(page.locator(Selectors.editPartnerTabGroup)).toBeVisible({ timeout: 8000 });
  });

});

// ── UI save journey and ES re-index ──────────────────────────────────────────

test.describe('Partner-edit UI — save journey and ES re-index', () => {

  const EDIT_PARTNER_NUMBER = 100003;
  const EDIT_PARTNER_NAME = 'Paderborner Druckerei AG';
  const EDIT_SEARCH_TERM = 'PADB';

  test.afterEach(async ({ request }) => {
    const getRes = await request.get(`${API_BASE}/${EDIT_PARTNER_NUMBER}`);
    if (getRes.status() !== 200) return;
    const current = await getRes.json();

    if (!current.name1.startsWith(EDIT_PARTNER_NAME)) {
      await request.put(`${API_BASE}/${EDIT_PARTNER_NUMBER}`, {
        data: {
          alphaCode: 'PADB',
          name1: EDIT_PARTNER_NAME,
          name2: current.name2,
          name3: current.name3,
          firstname: current.firstname,
          street: current.street,
          houseNumber: current.houseNumber,
          postalCode: current.postalCode,
          city: current.city,
          type: current.type,
          groupType: current.groupType,
          groupNumber: current.groupNumber,
        },
      });
    }
  });

  test('updated name appears in partner-search results after PUT (ES re-index)', async ({ page, request }) => {
    const getRes = await request.get(`${API_BASE}/${EDIT_PARTNER_NUMBER}`);
    expect(getRes.status()).toBe(200);
    const original = await getRes.json();

    const modifiedName = `${EDIT_PARTNER_NAME} [e2e]`;
    const putRes = await request.put(`${API_BASE}/${EDIT_PARTNER_NUMBER}`, {
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
        const res = await request.get(`/api/partner/spring/search?q=${EDIT_PARTNER_NUMBER}`);
        const body = await res.json();
        const hit = body.elasticsearch.results.find(
          (p: { partnerNumber: number }) => p.partnerNumber === EDIT_PARTNER_NUMBER,
        );
        return hit?.name1 ?? null;
      },
      {
        message: `ES must reflect updated name "${modifiedName}" for partner ${EDIT_PARTNER_NUMBER}`,
        timeout: 10_000,
        intervals: [500, 1000, 2000],
      },
    ).toBe(modifiedName);

    await page.goto(`/${CLIENT}/partner/search`);
    await page.waitForSelector(Selectors.partnerSearchInput);
    await page.locator(Selectors.partnerSearchInput).fill(EDIT_SEARCH_TERM);
    await page.keyboard.press('Enter');
    await page.waitForSelector(Selectors.matRow, { timeout: 8000 });

    const tableText = await page.locator('tbody').innerText();
    expect(tableText).toContain(EDIT_PARTNER_NAME);
  });

});
