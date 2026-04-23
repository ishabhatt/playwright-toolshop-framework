/* eslint-disable @typescript-eslint/no-require-imports */
import { chromium } from '@playwright/test';
import { getEnv } from './config/env';

export default async function globalSetup(): Promise<void> {
  const ENV = getEnv();
  const argv = process.argv.join(' ');
  const isPublicSmokeRun =
    argv.includes('--grep-invert') &&
    argv.includes('@auth') &&
    argv.includes('--grep') &&
    argv.includes('@smoke');
  const requireAuthCredentials = !isPublicSmokeRun;

  console.log(
    '\n── Global setup: validating environment ──────────────────────',
  );

  // ── 1. Required environment variable check ───────────────────────────
  const required: Record<string, string> = {
    TEST_USER_EMAIL: ENV.TEST_USER_EMAIL,
    TEST_USER_PASSWORD: ENV.TEST_USER_PASSWORD,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0 && requireAuthCredentials) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        `Copy .env.example to .env and fill in the values.`,
    );
  }

  if (missing.length > 0) {
    console.log(
      '! Auth environment variables not present; continuing because this run excludes @auth coverage',
    );
  } else {
    console.log('✓ Environment variables present');
  }

  // ── 2. API health check ──────────────────────────────────────────────
  // Fail fast before running 20+ tests if the API is unreachable.
  await new Promise<void>((resolve, reject) => {
    const https = require('https') as typeof import('https');
    const url = new URL(`${ENV.API_BASE_URL}/products?page=1`);

    const req = https.get(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        headers: { Accept: 'application/json' },
        timeout: 10_000,
      },
      (res) => {
        if (!res.statusCode || res.statusCode >= 400) {
          reject(
            new Error(
              `API health check failed: status ${res.statusCode ?? 'unknown'}\n` +
                `Check that API_BASE_URL is correct and the service is running.`,
            ),
          );
        } else {
          console.log(`✓ API reachable at ${ENV.API_BASE_URL}`);
          res.resume(); // drain the response body
          resolve();
        }
      },
    );

    req.on('timeout', () => {
      req.destroy();
      reject(
        new Error(
          `API health check timed out after 10s\n` +
            `Check that API_BASE_URL is correct and the service is running.`,
        ),
      );
    });

    req.on('error', (err) => {
      reject(
        new Error(
          `API health check failed: ${err.message}\n` +
            `Check that API_BASE_URL is correct and the service is running.`,
        ),
      );
    });
  });

  // ── 3. UI reachability check ─────────────────────────────────────────
  // Quick browser check — confirms the base URL loads without error.
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const response = await page.goto(ENV.WEB_BASE_URL, { timeout: 15_000 });

    if (!response || !response.ok()) {
      throw new Error(
        `UI returned status ${response?.status() ?? 'no response'} for ${ENV.WEB_BASE_URL}`,
      );
    }

    console.log(`✓ UI reachable at ${ENV.WEB_BASE_URL}`);
  } finally {
    await browser.close();
  }

  console.log(
    '── Global setup complete. Running tests. ─────────────────────\n',
  );
}
