import { test, expect } from '../../fixtures/baseTest';
import {
  expectPaginatedProductsResponse,
  expectStatus,
  toNumber,
} from '../../utils/apiAssertions';

test.describe(
  'Capstone product consistency',
  { tag: ['@smoke', '@regression'] },
  () => {
    test('API product matches UI product details', async ({
      homePage,
      header,
      productListPage,
      productDetailsPage,
      productApi,
    }) => {
      const apiResult = await productApi.getProducts({
        sort: 'name,asc',
        page: 1,
      });

      expectStatus(apiResult.status, 200);
      expectPaginatedProductsResponse(apiResult.body);

      const apiProduct = apiResult.body.data.find(
        (product) =>
          String(product.name).trim().length > 0 &&
          product.price !== undefined &&
          product.price !== null,
      );

      expect(apiProduct).toBeDefined();

      const productName = String(apiProduct!.name);
      const apiPrice = toNumber(apiProduct!.price);

      await homePage.goto();
      await header.searchFor(productName);

      await productListPage.expectSearchResult(productName);
      await productListPage.openProductByName(productName);

      await productDetailsPage.expectLoaded();
      await productDetailsPage.expectProductName(productName);

      const uiPrice = await productDetailsPage.getDisplayedPrice();
      expect(uiPrice).toBe(apiPrice);
    });
  },
);
