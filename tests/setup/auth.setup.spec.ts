import { test as setup, expect } from '@playwright/test';
import { getEnv } from '@config/env';

setup('authenticate Toolshop user', async ({ page }) => {
  const ENV = getEnv();

  if (!ENV.TEST_USER_EMAIL || !ENV.TEST_USER_PASSWORD) {
    throw new Error('Missing TEST_USER_EMAIL / TEST_USER_PASSWORD in .env');
  }

  await page.goto('/auth/login');

  await page.getByTestId('email').fill(ENV.TEST_USER_EMAIL);
  await page.getByTestId('password').fill(ENV.TEST_USER_PASSWORD);
  await page.getByTestId('login-submit').click();

  // Wait until login is complete before saving storage state.
  await expect(page).not.toHaveURL(/\/auth\/login/);

  const userMenuButton = page.getByTestId('nav-menu');

  await expect(userMenuButton).toBeVisible({ timeout: 15_000 });
  await userMenuButton.click();
  await expect(page.getByTestId('nav-my-account')).toBeVisible({
    timeout: 15_000,
  });

  await page.context().storageState({ path: 'auth/user.json' });
});
