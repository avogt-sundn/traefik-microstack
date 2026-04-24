import { test, expect } from '@playwright/test';

/**
 * Partner search UI tests — simulate real user interactions in a browser.
 *
 * These tests launch a headless Chromium instance and interact with the
 * Angular partner search page at /partner.
 *
 * Seed data anchors (V2__seed_demo_partners.sql):
 *   München  → 200001 Bayern Finanz AG, 200002 Münchner Softwarehaus GmbH, etc.
 *   100002   → Schmidt & Söhne AG, Berlin
 *   10117    → postal code shared by 100002 and 100019
 *
 * Selectors use cypressid attributes set in the template, which are stable
 * across refactors (unlike CSS classes or text content).
 */

const SEARCH_INPUT = '[cypressid="cypress-partner-search-input"]';
const RESET_BUTTON = '[cypressid="cypress-partner-search-reset"]';
const RESULT_ROW = 'tr[mat-row]';

test.describe('Partner search UI', () => {

  test.beforeEach(async ({ page }) => {
    // Shell route: /:client/partner/:mfe-route
    // 'abc' is one of the seeded demo clients; /search is the PartnerSearch MFE route.
    await page.goto('/abc/partner/search');
    await page.waitForSelector(SEARCH_INPUT);
  });

  test('page loads with empty search input', async ({ page }) => {
    const input = page.locator(SEARCH_INPUT);
    await expect(input).toBeVisible();
    await expect(input).toHaveValue('');
  });

  test('typing München and pressing Enter shows results', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('München');
    await page.keyboard.press('Enter');

    // Wait for at least one result row to appear
    await page.waitForSelector(RESULT_ROW);
    const rows = page.locator(RESULT_ROW);
    expect(await rows.count()).toBeGreaterThanOrEqual(3);

    // City search for München returns multiple partners — verify one is visible
    const tableText = await page.locator('tbody').innerText();
    expect(tableText).toContain('München');
  });

  test('results appear automatically while typing without pressing Enter', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('Berlin');

    // Live search fires ~500 ms after typing stops — wait up to 8 s for rows
    await page.waitForSelector(RESULT_ROW, { timeout: 8000 });
    const rows = page.locator(RESULT_ROW);
    expect(await rows.count()).toBeGreaterThanOrEqual(4);
  });

  test('search by partner number finds seed partner Schmidt', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('100002');
    await page.keyboard.press('Enter');

    await page.waitForSelector(RESULT_ROW);
    // Substring match: '100002' may return more than one row (V5 bulk data contains numbers
    // that contain these digits). Verify the seed partner is present.
    const text = await page.locator('tbody').innerText();
    expect(text).toContain('Schmidt');
  });

  test('search by postal code 10117 returns matching partners', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('10117');
    await page.keyboard.press('Enter');

    await page.waitForSelector(RESULT_ROW);
    // Seed: postal code 10117 → 400001 Berliner Innovations GmbH, 400002 Brandenburg Tech AG (V2)
    const bodyText = await page.locator('tbody').innerText();
    expect(bodyText).toContain('Berlin');
  });

  test('reset button clears input and results', async ({ page }) => {
    // First run a search to get results on screen
    await page.locator(SEARCH_INPUT).fill('München');
    await page.keyboard.press('Enter');
    await page.waitForSelector(RESULT_ROW);

    // Now click reset
    await page.locator(RESET_BUTTON).click();

    // Input should be empty
    await expect(page.locator(SEARCH_INPUT)).toHaveValue('');

    // Result table should be gone
    await expect(page.locator(RESULT_ROW)).toHaveCount(0);
  });

  test('empty search shows no-results panel', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('XYZNOTEXIST99999');
    await page.keyboard.press('Enter');

    // shared-info-panel renders once searchPerformed() && !hasResults() — wait for it.
    // The API call must complete before Angular flips those signals, so allow up to 8 s.
    await expect(page.locator('shared-info-panel')).toBeVisible({ timeout: 8000 });

    // No result rows
    await expect(page.locator(RESULT_ROW)).toHaveCount(0);
  });

  test('typing München shows results without pressing Enter', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('München');
    // Live search fires ~500 ms after typing stops
    await page.waitForSelector(RESULT_ROW, { timeout: 8000 });
    expect(await page.locator(RESULT_ROW).count()).toBeGreaterThanOrEqual(3);
  });

  test('typing wall finds Paderborner Metallbau GmbH (street Paderwall, id 100052)', async ({ page }) => {
    // Seed (V3): 100052 PADMET, street "Paderwall", Paderborn
    await page.locator(SEARCH_INPUT).fill('wall');

    await page.waitForSelector(RESULT_ROW, { timeout: 8000 });

    const tableText = await page.locator('tbody').innerText();
    expect(tableText).toContain('Paderborner Metallbau');
    expect(await page.locator(RESULT_ROW).count()).toEqual(1);

  });

  test('search refinement: wall → paderwall → paderborner narrows results (regression: treetable must reload on each in-session search)', async ({ page }) => {
    // Regression: PartnerTreetableService is a singleton — its reference never changes between
    // searches, so Angular's ngOnChanges on the Treetable only fires once (on first render).
    // Before the fix, updateSearchState() never called reload(), so every search after the first
    // would leave stale results on screen.
    //
    // Steps 2 and 3 use pressSequentially (real keyboard events) to trigger in-session value changes
    // so that each query change goes through wireAutoSearch → performSearch → updateSearchState,
    // which is the exact code path that was broken before the reload() fix.

    // Step 1: Start with "wall" → 1 result: 100052 (Paderborner Metallbau, street Paderwall).
    // The page is already loaded from test.beforeEach(), so just fill the input and wait for results.
    // Live search fires ~400ms after typing stops — wait up to 8s for results.
    await page.locator(SEARCH_INPUT).fill('wall');
    await page.waitForSelector(RESULT_ROW, { timeout: 8000 });
    await expect(page.locator(RESULT_ROW)).toHaveCount(1, { timeout: 8000 });

    // Step 2: Append "erborun" → "wallerborun" doesn't match anything (narrow to 0 results).
    // Before the fix: updateSearchState would not call reload() → still 1 row (stale).
    // After the fix: reload() is called → 0 results.
    await page.locator(SEARCH_INPUT).pressSequentially('erborner');
    await expect(page.locator(RESULT_ROW)).toHaveCount(0, { timeout: 8000 });

    // Step 3: Delete "erborner" (8 chars) → back to "wall" → 1 result again.
    // This verifies that the reload fires on every change, not just narrowing edits.
    for (let i = 0; i < 8; i++) {
      await page.locator(SEARCH_INPUT).press('Backspace');
    }
    await expect(page.locator(RESULT_ROW)).toHaveCount(1, { timeout: 8000 });
  });

});
