import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the traefik-microstack e2e smoke suite.
 *
 * BASE_URL resolution:
 *   - Inside Docker network:  BASE_URL=https://gateway  (default)
 *   - Local against live stack: BASE_URL=https://localhost
 *
 * TLS: all backends use self-signed certs; ignoreHTTPSErrors suppresses
 * certificate validation for every request and browser page.
 *
 * Projects:
 *   api     — HTTP request fixture only; no browser spawned. Fast, low CPU.
 *             Specs live in playwright/e2e/api/.
 *   browser — Chromium. Tests Angular UI interactions that require a real DOM.
 *             Specs live in playwright/e2e/browser/.
 *
 * Default run (`make pw-run`) executes only the api project.
 * Use `make pw-run-browser` or `make pw-run-all` to include browser tests.
 */

const sharedUse = {
  baseURL: process.env['BASE_URL'] ?? 'https://gateway',
  ignoreHTTPSErrors: true,
  screenshot: (process.env['SCREENSHOTS'] === 'true' ? 'on' : 'off') as 'on' | 'off',
};

export default defineConfig({
  workers: 1,
  fullyParallel: false,
  maxFailures: 1,

  reporter: [
    ['dot'],
    ['junit', { outputFile: 'target/results/smoke.xml' }],
    ['html', { outputFolder: 'target/report', open: 'never' }],
  ],

  outputDir: 'target/test-results',

  projects: [
    {
      name: 'api',
      testDir: 'playwright/e2e/api',
      use: { ...sharedUse },
    },
    {
      name: 'browser',
      testDir: 'playwright/e2e/browser',
      use: { ...sharedUse, ...devices['Desktop Chrome'], headless: true },
    },
  ],
});
