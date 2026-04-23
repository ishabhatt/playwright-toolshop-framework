import { test } from '../../../fixtures/baseTest';

const categories = ['Hand Tools', 'Power Tools', 'Other', 'Special Tools'];

test.describe('Category navigation', { tag: ['@ui', '@regression'] }, () => {
  for (const category of categories) {
    test(`loads product listing for ${category}`, async ({
      homePage,
      header,
      productListPage,
    }) => {
      await homePage.goto();
      await header.openCategoryMenu();
      await header.openCategory(category);
      await productListPage.expectCategoryLoaded(category);
    });
  }
});
