import { test, expect } from '../../../fixtures/baseTest';

test.describe(
  'Authenticated smoke',
  { tag: ['@ui', '@smoke', '@auth'] },
  () => {
    test('recognizes the stored signed-in session', async ({ page }) => {
      await page.goto('/');

      const userMenuButton = page.getByTestId('nav-menu');

      await expect(userMenuButton).toBeVisible({ timeout: 15_000 });
      await userMenuButton.click();
      await expect(page.getByTestId('nav-my-account')).toBeVisible({
        timeout: 15_000,
      });
    });
  },
);
