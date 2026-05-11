import { test, expect } from '@playwright/test';

/**
 * Playwright smoke tests — fast HTTP health checks for the traefik-microstack stack.
 *
 * All assertions use the `request` fixture only (no browser launched).
 * The full request path exercised: test container → Traefik → backend service.
 *
 * Seed data anchor used:
 *   city "München" is present in multiple demo partner rows and is therefore
 *   a reliable non-empty result guarantee for the search endpoint.
 *
 * TLS: ignoreHTTPSErrors is set globally in playwright.config.ts — do not
 * add per-request overrides here.
 */
test.describe('Stack smoke tests', () => {

  test('Spring Boot partner service health', async ({ request }) => {
    const response = await request.get('/actuator/health');
    expect(response.status()).toBe(200);
  });

  test('Quarkus partner service health', async ({ request }) => {
    const response = await request.get('/q/health');
    expect(response.status()).toBe(200);
  });

  test('Shell app loads at /', async ({ request }) => {
    const response = await request.get('/');
    expect(response.status()).toBe(200);
  });

  test('Search API returns 200', async ({ request }) => {
    // Uses seed city "München" — guaranteed non-empty but we only assert status here.
    const response = await request.get('/api/partner/spring/search?q=M%C3%BCnchen');
    expect(response.status()).toBe(200);
  });

  test('Multi-token search returns 200', async ({ request }) => {
    // Two tokens — AND logic across all fields — at least Fischer Logistik GmbH matches.
    const response = await request.get('/api/partner/spring/search?q=Fischer%20Logistik');
    expect(response.status()).toBe(200);
  });

});
