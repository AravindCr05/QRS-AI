import { defineConfig } from '@playwright/test';
import 'dotenv/config';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://192.168.7.35:8072/',
    browserName: 'chromium',
    headless: false,
    ignoreHTTPSErrors: true,
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'on',
    viewport: null,
    launchOptions: {
      args: ['--start-maximized'],
    },
  },
});
