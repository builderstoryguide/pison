import { defineConfig, devices } from '@playwright/test';
<<<<<<< HEAD

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
=======
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

>>>>>>> c10aaa83c3737af90b384d046150aef9f7900c99
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
<<<<<<< HEAD

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Android Chrome Mobile-First Testing */
    {
      name: 'android-chrome',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 393, height: 851 },
        colorScheme: 'light',
        locale: 'en-US',
        permissions: [],
        launchOptions: { slowMo: 0 },
        // Network throttling for 3G Fast
        contextOptions: {
          reducedMotion: 'reduce',
        },
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
=======
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
>>>>>>> c10aaa83c3737af90b384d046150aef9f7900c99
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
