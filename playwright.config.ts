import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './generated',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['allure-playwright', { outputFolder: 'allure-results' }],
  ],
  use: {
    baseURL: process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/',
    testIdAttribute: 'data-test',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
