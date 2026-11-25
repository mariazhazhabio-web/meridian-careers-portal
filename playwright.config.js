import { defineConfig, devices } from '@playwright/test';

// Uses the locally installed Microsoft Edge (channel: 'msedge') so no browser
// download is needed. Switch to `npx playwright install chromium` on CI.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'tests/e2e-report' }]],
  use: { baseURL: 'http://localhost:4173', channel: process.env.PW_CHANNEL || 'msedge', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL || 'msedge' } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: process.env.PW_CHANNEL || 'msedge' } },
  ],
  webServer: {
    command: 'npm run build:demo && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
