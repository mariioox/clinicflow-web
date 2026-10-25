import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const cachedChromiumPath = path.resolve(
  os.homedir(),
  '.cache/ms-playwright/chromium-1217/chrome-linux64/chrome'
)
const chromiumExecutable =
  process.env.PLAYWRIGHT_CHROMIUM_PATH ||
  (fs.existsSync(cachedChromiumPath) ? cachedChromiumPath : undefined)

export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.e2e\.ts/,
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(chromiumExecutable ? { launchOptions: { executablePath: chromiumExecutable } } : {}),
      },
    },
  ],
  webServer: [
    {
      command: 'pnpm exec prism mock openapi.yaml -p 4010',
      url: 'http://127.0.0.1:4010/api/v1/meta',
      reuseExistingServer: true,
      timeout: 30 * 1000,
    },
    {
      command: 'pnpm dev',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 30 * 1000,
    },
  ],
})
