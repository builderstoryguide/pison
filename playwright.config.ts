import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Read from ".env.test" file.
dotenv.config({ path: path.resolve(__dirname, '.env.test') });
// Rely on global setup or dotenv-cli instead to avoid conflicts

const authFile = 'e2e/.auth/user.json';

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  globalSetup: require.resolve('./e2e/config/global-setup'),
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
    // Only set storageState if the auth file exists to avoid ENOENT on first run
    ...(fs.existsSync(authFile) ? { storageState: authFile } : {}),
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  webServer: {
    command: 'npm run dev',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
