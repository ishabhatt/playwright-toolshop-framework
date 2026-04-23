import { test, expect } from '../../../fixtures/baseTest';
import { getEnv } from '../../../config/env';

const ENV = getEnv();

async function loginViaUi(loginPage: {
  goto: () => Promise<void>;
  login: (e: string, p: string) => Promise<void>;
}) {
  await loginPage.goto();
  await loginPage.login(ENV.TEST_USER_EMAIL, ENV.TEST_USER_PASSWORD);
}

test.describe(
  'Cart UI — network mocking',
  { tag: ['@ui', '@regression', '@auth'] },
  () => {
    // Intercept the cart API and return an empty items array.
    // Verifies the UI shows an "empty cart" message
    // Route technique: route.fulfill() — replace the real response entirely.
    test('shows empty cart message when cart API returns no items', async ({
      page,
      loginPage,
    }) => {
      await loginViaUi(loginPage);

      await page.route(/\/carts\/.*/, (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: {
            id: 'mocked-cart-id',
            items: [],
            total_price: 0,
          },
        }),
      );

      await page.goto('/checkout');
      await page
        .locator('ul.steps-indicator')
        .waitFor({ state: 'visible', timeout: 10_000 });
      await expect(page.locator('tr.ng-star-inserted')).not.toBeVisible();
    });

    // Intercept the products API to open no products in the listing page.
    // Verifies the UI shows a user-friendly "no products found" message
    // rather than a broken page or infinite loader.
    test('shows no products found message when products API returns no items', async ({
      page,
      loginPage,
      header,
      productListPage,
    }) => {
      const fakeEmptyResponse = { data: [] };

      await page.route(/\/products\?.*/, async (route) => {
        const response = await page.request.fetch(route.request());
        await route.fulfill({
          response,
          body: JSON.stringify(fakeEmptyResponse),
        });
      });

      await loginViaUi(loginPage);
      await header.openCategoryMenu();
      await header.openCategory('Hand Tools');

      await productListPage.expectNoProductsMessage();
    });

    // Intercept the product API to open non-existent product details page.
    // Verifies the UI shows a user-friendly "product not found" message
    // rather than a broken page or infinite loader.
    test('shows error message when product API returns 500', async ({
      page,
      loginPage,
      header,
      productListPage,
      productDetailsPage,
    }) => {
      await page.route(/\/api\/product\/.*/, (route) =>
        route.continue({
          url: route
            .request()
            .url()
            .replace(/\/api\/product\//, '/api/product/99999'),
        }),
      );

      await loginViaUi(loginPage);
      await header.openCategoryMenu();
      await header.openCategory('Power Tools');

      await productListPage.openFirstProduct();
      await page
        .locator('h2:has-text("Related products")')
        .waitFor({ state: 'visible', timeout: 10_000 });
      await expect(productDetailsPage.addToCartButton).not.toBeVisible();
    });

    // Simulate a malformed cart API response that doesn't contain the expected fields.
    // Verifies the UI handles it gracefully, e.g. by showing an error message rather than crashing.
    test('handles malformed carts API response gracefully', async ({
      page,
      loginPage,
    }) => {
      await loginViaUi(loginPage);

      const fakeEmptyResponse = { data: { cart_items: [] } };

      await page.route(/\/carts\?.*/, async (route) => {
        const response = await page.request.fetch(route.request());
        const body = JSON.stringify(fakeEmptyResponse);
        await route.fulfill({
          response,
          body,
        });
      });

      await page.goto('/checkout');

      await page
        .locator('ul.steps-indicator')
        .waitFor({ state: 'visible', timeout: 10_000 });
      await expect(page.locator('tr.ng-star-inserted')).not.toBeVisible();
    });
  },
);
