import { test, expect } from '../../../fixtures/baseTest';

test.describe(
  'Other outside links navigation',
  { tag: ['@ui', '@regression'] },
  () => {
    test(`documentation link opens in new tab`, async ({
      context,
      homePage,
      header,
    }) => {
      await homePage.goto();

      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        header.clickDocumentationLink(),
      ]); // new page opens on link click

      await newPage.waitForLoadState();

      await expect(newPage).toHaveURL(
        'https://testsmith-io.github.io/practice-software-testing/#/',
      );
      const documentTitle = newPage.locator(
        '[data-id="practice-software-testing"]',
      );
      await expect(documentTitle).toBeVisible();
      await expect(documentTitle).toHaveText('Practice Software Testing');
      await newPage.close();
      await expect(header.documentationLink).toBeVisible();
    });
  },
);
