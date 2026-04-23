import { test, expect } from '../../../fixtures/baseTest';

test.describe(
  'Header visual regression',
  { tag: ['@ui', '@regression'] },
  () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('header nav matches baseline', async ({
      page,
      homePage,
      browserName,
    }) => {
      test.skip(
        browserName !== 'chromium',
        'Keep visual snapshots on one browser',
      );

      await homePage.goto();
      const headerNav = page.getByRole('navigation').first();

      await expect(headerNav).toBeVisible();
      await expect(headerNav).toHaveScreenshot('header-nav.png');
    });
  },
);
