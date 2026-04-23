import { defineConfig, devices } from '@playwright/test';
import { getEnv } from './config/env';

const ENV = getEnv();
/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  globalSetup: './global-setup.ts',
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [
        ['github'],
        ['html', { open: 'never' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
      ]
    : [
        ['list'],
        ['html', { open: 'never' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
      ],
  use: {
    baseURL: ENV.WEB_BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
    viewport: { width: 1440, height: 900 },
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    testIdAttribute: 'data-test',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup-auth',
      testMatch: /tests\/setup\/auth\.setup\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'api',
      testMatch: /tests\/api\/.*\.spec\.ts/,
      use: {
        baseURL: ENV.API_BASE_URL,
        extraHTTPHeaders: {
          Accept: 'application/json',
        },
      },
    },
    {
      name: 'chromium',
      // Public unauthenticated browser project.
      // Authenticated smoke is intentionally separated into `chromium-auth`
      // even if those specs also carry the broader `@smoke` coverage label.
      testIgnore: [
        /tests\/setup\/.*\.ts/,
        /tests\/api\/.*\.ts/,
        /tests\/ui\/smoke\/authenticated\.spec\.ts/,
      ],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: ENV.WEB_BASE_URL,
      },
    },
    {
      name: 'firefox',
      testIgnore: [
        /tests\/setup\/.*\.ts/,
        /tests\/api\/.*\.ts/,
        /tests\/ui\/smoke\/authenticated\.spec\.ts/,
        /tests\/ui\/regression\/visual-header\.spec\.ts/,
        /tests\/ui\/regression\/a11y-login-aria\.spec\.ts/,
      ],
      use: {
        ...devices['Desktop Firefox'],
        baseURL: ENV.WEB_BASE_URL,
      },
    },
    {
      name: 'chromium-auth',
      testMatch: /tests\/ui\/smoke\/authenticated\.spec\.ts/,
      dependencies: ['setup-auth'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: ENV.WEB_BASE_URL,
        storageState: 'auth/user.json',
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
