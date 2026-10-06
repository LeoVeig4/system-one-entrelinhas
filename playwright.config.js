const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './frontend/tests',
  fullyParallel: true,
  workers: 2,
  timeout: 30000,
  expect: { timeout: 5000 },
  outputDir: 'artifacts/test-results',
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'artifacts/playwright-report' }]],
  use: {
    baseURL: 'http://127.0.0.1:8011',
    channel: process.env.BROWSER_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined),
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node scripts/serve.mjs --port 8011',
    url: 'http://127.0.0.1:8011/api/scenarios',
    reuseExistingServer: false,
    timeout: 15000,
  },
});
