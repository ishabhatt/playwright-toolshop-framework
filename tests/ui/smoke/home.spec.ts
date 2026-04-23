import { test } from '../../../fixtures/baseTest';

test.describe('Home page smoke', { tag: ['@ui', '@smoke'] }, () => {
  test('open home page and shows key categories', async ({ homePage }) => {
    await homePage.goto();
    await homePage.expectLoaded();
  });

  test('can browse to Hand Tools and see a visible product', async ({
    homePage,
    header,
    productListPage,
  }) => {
    await homePage.goto();
    await homePage.expectLoaded();
    await header.openCategoryMenu();
    await header.openCategory('Hand Tools');
    await productListPage.expectCategoryLoaded('Hand Tools');
  });
});
