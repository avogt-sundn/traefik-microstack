import { test, expect } from '@playwright/test';

/**
 * Engine toggle persistence tests.
 *
 * The partner search page shows a `mat-slide-toggle` between the PG and ES
 * engine badges once a dual search response has been received:
 *
 *   PG Xms  [toggle]  ES Xms
 *
 * The toggle is rendered inside `.search-source-indicator` and is only present
 * in the DOM when `partnerTreetableService.lastDualResponse` has emitted a value
 * (i.e. after at least one search has completed and returned results).
 *
 * Angular binds toggle state as: [checked]="activeEngine() === 'elasticsearch'"
 * The rendered DOM exposes this via the inner <button role="switch" aria-checked>.
 * We assert on aria-checked to avoid depending on Angular internals.
 *
 * Seed data anchors (V2__seed_demo_partners.sql):
 *   München → 200001 Bayern Finanz AG, 200002 Münchner Softwarehaus GmbH, 200003 Alpenland Immobilien KG
 *   Müller  → multiple partners across cities (100001 Müller GmbH is Paderborn, not München)
 */

const SEARCH_INPUT = '[cypressid="cypress-partner-search-input"]';
const RESULT_ROW = 'tr[mat-row]';
// The search-source-indicator has two toggles: framework (Spring/Quarkus) and engine (PG/ES).
// Target the engine toggle via its stable cypressid attribute.
const ENGINE_TOGGLE = '[cypressid="cypress-engine-toggle"]';
const ENGINE_TOGGLE_BUTTON = '[cypressid="cypress-engine-toggle"] button[role="switch"]';

test.describe('Engine toggle', () => {

  test.beforeEach(async ({ page }) => {
    // Shell route: /:client/partner/:mfe-route
    // 'abc' is one of the seeded demo clients; /search is the PartnerSearch MFE route.
    await page.goto('/abc/partner/search');
    await page.waitForSelector(SEARCH_INPUT);
  });

  test('toggle stays in Elasticsearch state while live typing continues', async ({ page }) => {
    // Step 1: Type a query that reliably returns results.
    // "München" is seeded in multiple partner rows (V2__seed_demo_partners.sql).
    await page.locator(SEARCH_INPUT).fill('München');

    // Step 2: Wait for both the toggle and at least one result row to appear.
    await page.waitForSelector(ENGINE_TOGGLE, { timeout: 10000 });
    await page.waitForSelector(RESULT_ROW, { timeout: 8000 });

    // Step 3: Verify the toggle starts in the Elasticsearch (checked) state — ES is the default.
    const toggleButton = page.locator(ENGINE_TOGGLE_BUTTON);
    await expect(toggleButton).toHaveAttribute('aria-checked', 'true');

    // Step 4: Continue typing to trigger a new live search.
    // "Müller" is seeded across multiple partner rows so results are guaranteed.
    await page.locator(SEARCH_INPUT).fill('Müller');

    // Step 5: Wait for the new live search to complete.
    await page.waitForSelector(RESULT_ROW, { timeout: 10000 });

    // Step 6: Assert the toggle is still checked (Elasticsearch still active).
    // The toggle must persist its state across live search cycles — it must
    // not reset when a new dual response arrives.
    await expect(toggleButton).toHaveAttribute('aria-checked', 'true');
  });

  test('toggle starts checked (Elasticsearch is default)', async ({ page }) => {
    // The default engine is Elasticsearch; the toggle should appear checked
    // after the first search response arrives.
    await page.locator(SEARCH_INPUT).fill('Berlin');

    await page.waitForSelector(ENGINE_TOGGLE, { timeout: 10000 });

    const toggleButton = page.locator(ENGINE_TOGGLE_BUTTON);
    await expect(toggleButton).toHaveAttribute('aria-checked', 'true');
  });

  test('clicking toggle switches to Postgres results', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('Hamburg');

    await page.waitForSelector(ENGINE_TOGGLE, { timeout: 10000 });
    await page.waitForSelector(RESULT_ROW, { timeout: 8000 });

    // Default is ES (checked); click to switch to Postgres
    await page.locator(ENGINE_TOGGLE).click();
    const toggleButton = page.locator(ENGINE_TOGGLE_BUTTON);
    await expect(toggleButton).toHaveAttribute('aria-checked', 'false');

    // The PG engine badge should now have the active CSS class
    const pgBadge = page.locator('.search-source-indicator .engine-badge:first-of-type');
    await expect(pgBadge).toHaveClass(/engine-badge--active/);
  });

});
