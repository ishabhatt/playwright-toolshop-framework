import { test, expect } from '../../fixtures/baseTest';
import {
  expectPaginatedProductsResponse,
  expectStatus,
} from '../../utils/apiAssertions';

test.describe(
  'Product API to UI match',
  { tag: ['@smoke', '@regression'] },
  () => {
    test('product selected from API can be found in UI with matching name', async ({
      homePage,
      header,
      productListPage,
      productDetailsPage,
      productApi,
    }) => {
      const apiResult = await productApi.getProducts({
        page: 1,
        sort: 'name,asc',
      });

      expectStatus(apiResult.status, 200);
      expectPaginatedProductsResponse(apiResult.body);

      const apiProduct = apiResult.body.data.find(
        (product) => String(product.name).trim().length > 0,
      );

      expect(apiProduct).toBeDefined();

      const productName = String(apiProduct!.name);

      await homePage.goto();
      await header.searchFor(productName);

      await productListPage.expectSearchResult(productName);
      await productListPage.openProductByName(productName);

      await productDetailsPage.expectLoaded();
      await productDetailsPage.expectProductName(productName);
    });
  },
);
