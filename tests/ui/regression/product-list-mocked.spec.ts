import { test } from '../../../fixtures/baseTest';

test.describe('Mocked product listing', { tag: ['@ui', '@regression'] }, () => {
  test('renders mocked product data', async ({
    page,
    homePage,
    header,
    productListPage,
  }) => {
    await page.route(/\/products(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          current_page: 1,
          data: [
            {
              id: '99901',
              name: 'Mocked Titanium Hammer',
              description: 'Deterministic mocked product for UI test',
              price: 19.99,
              is_rental: false,
              slug: 'mocked-titanium-hammer',
              stock: 7,
            },
          ],
          from: 1,
          last_page: 1,
          per_page: 1,
          to: 1,
          total: 1,
        },
      });
    });

    await homePage.goto();
    await header.openCategoryMenu();
    await header.openCategory('Hand Tools');

    await productListPage.expectProductVisible('Mocked Titanium Hammer');
  });
});
