import { test, expect } from '@playwright/test';

/**
 * Result count bar tests for the partner search page.
 *
 * The count bar (cypressid="cypress-result-count") is rendered inside an
 * @if block that is gated on `partnerTreetableService.lastQuadResponse`
 * having emitted at least once — i.e. it appears only after the first search
 * completes and the Angular template has been updated.
 *
 * DOM structure (after a search with results):
 *
 *   <div cypressid="cypress-result-count">
 *     <span class="result-count-matched">X gefunden</span>
 *     <span class="result-count-of">· von Y</span>          ← only when storeTotalCount > 0
 *     <span class="result-count-showing">· zeige Z</span>  ← only when returnedCount < totalCount
 *   </div>
 *
 * Invariant: X (matched) ≤ Y (store total).
 *
 * Seed anchor: "wall" matches exactly 1 partner (100052 Paderborner Metallbau,
 * street "Paderwall") — this gives a small, deterministic result set that
 * exercises the "found" count without triggering the "showing" cap.
 *
 * Seed anchor: "München" returns many results across both V2 and V5 bulk data —
 * reliable for asserting a positive store total.
 */

const SEARCH_INPUT = '[cypressid="cypress-partner-search-input"]';
const RESULT_ROW   = 'tr[mat-row]';
const RESULT_COUNT = '[cypressid="cypress-result-count"]';

test.describe('Result count bar', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/abc/partner/search');
    await page.waitForSelector(SEARCH_INPUT);
  });

  test('"of Y" segment appears and Y is a positive integer after a search with results', async ({ page }) => {
    // Use "München" — guaranteed to return results from both V2 seed and V5 bulk data.
    await page.locator(SEARCH_INPUT).fill('München');
    await page.keyboard.press('Enter');

    // Wait for at least one result row to confirm the search completed.
    await page.waitForSelector(RESULT_ROW, { timeout: 10000 });

    // The count bar appears inside the same @if block as the engine badges —
    // wait for it explicitly before asserting on its children.
    const countBar = page.locator(RESULT_COUNT);
    await expect(countBar).toBeVisible({ timeout: 10000 });

    // The "of Y" segment must be present (storeTotalCount > 0 with any seeded data).
    const ofSpan = countBar.locator('.result-count-of');
    await expect(ofSpan).toBeVisible({ timeout: 5000 });

    // Extract the raw text and parse out the integer Y.
    // Expected format (German i18n): "· von 1234567" or similar.
    // We extract all digit sequences and take the first one found.
    const ofText = await ofSpan.innerText();
    const match = ofText.match(/\d+/);
    expect(match, `"of" segment must contain a number, got: "${ofText}"`).not.toBeNull();
    const storeTotal = parseInt(match![0], 10);
    expect(storeTotal).toBeGreaterThan(0);
  });

  test('matched count (X) is ≤ store total count (Y)', async ({ page }) => {
    // "wall" matches exactly 1 partner (100052 Paderborner Metallbau, street "Paderwall").
    // This gives a stable matched count of 1 against the full store total.
    await page.locator(SEARCH_INPUT).fill('wall');

    // Live search fires ~500 ms after typing; wait for results and count bar.
    await page.waitForSelector(RESULT_ROW, { timeout: 10000 });

    const countBar = page.locator(RESULT_COUNT);
    await expect(countBar).toBeVisible({ timeout: 10000 });

    // Both spans must be visible.
    const matchedSpan = countBar.locator('.result-count-matched');
    const ofSpan      = countBar.locator('.result-count-of');
    await expect(matchedSpan).toBeVisible({ timeout: 5000 });
    await expect(ofSpan).toBeVisible({ timeout: 5000 });

    // Parse X and Y from their inner text (digit sequences).
    const matchedText = await matchedSpan.innerText();
    const ofText      = await ofSpan.innerText();

    const matchedNum  = parseInt(matchedText.match(/\d+/)![0], 10);
    const storeTotalNum = parseInt(ofText.match(/\d+/)![0], 10);

    expect(matchedNum, 'matched count must be at least 1 (wall matches 100052)').toBeGreaterThanOrEqual(1);
    expect(storeTotalNum, 'store total must be positive').toBeGreaterThan(0);
    expect(matchedNum, `matched (${matchedNum}) must not exceed store total (${storeTotalNum})`).toBeLessThanOrEqual(storeTotalNum);
  });

});
