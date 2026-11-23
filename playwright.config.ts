import { defineConfig, devices } from '@playwright/test';

// Магазин по умолчанию развёрнут на Render (Free-план), адрес переопределяется BASE_URL.
// Локальный запуск: BASE_URL=http://localhost:3000 npm test
const baseURL = process.env.BASE_URL || 'https://qa-shop-6xeq.onrender.com';

export default defineConfig({
  testDir: './tests',
  timeout: 120_000, // на Free-тарифе Render сервис засыпает, первый запрос «прогревает» до ~60 сек
  expect: { timeout: 20_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
