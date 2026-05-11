import { test, expect } from '@playwright/test';

/**
 * Dev-badge visibility test for the partner micro-frontend.
 *
 * The `.dev-badge` element is rendered in app.html via:
 *
 *   @if (devMode) { <div class="dev-badge">ng serve</div> }
 *
 * `devMode` is driven by `IS_DEV_BUILD` from `environments/build-mode.ts`,
 * which is replaced at build time via Angular `fileReplacements`:
 *   - production build  → `IS_DEV_BUILD = false` → badge hidden
 *   - `ng serve` (dev)  → `IS_DEV_BUILD = true`  → badge visible
 *
 * The test auto-skips when the nginx production container is serving
 * `/partner` (identified by a hashed `polyfills-*.js` filename in the HTML),
 * so it is safe to include in the default `make pw-local` run.
 */

test.describe('Partner dev badge (ng serve)', () => {

  test('dev badge is visible when served by ng serve', async ({ page, request }) => {
    // Detect whether the ng dev server (forward-ng-partner) is active.
    // ng serve produces unhashed filenames (polyfills.js); the production
    // nginx container uses content-hashed names (polyfills-HASH.js).
    const html = await request.get('/partner/');
    const body = await html.text();
    const isDevServer = /polyfills\.js['"<]/.test(body);
    test.skip(!isDevServer, 'ng serve is not active — skipping dev-badge check');

    await page.goto('/abc/partner/search');
    await page.waitForSelector('[cypressid="cypress-partner-search-input"]');

    const badge = page.locator('.dev-badge');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText('ng serve');
  });

});
