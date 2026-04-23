import { test, expect } from '../../../fixtures/baseTest';
import {
  expectPaginatedProductsResponse,
  expectProductShape,
  expectStatus,
  expectStringsSortedAsc,
  expectNumbersSortedDesc,
  toNumber,
} from '../../../utils/apiAssertions';

test.describe('Products API smoke', { tag: ['@smoke', '@regression'] }, () => {
  test('GET /products returns paginated products', async ({ productApi }) => {
    const result = await productApi.getProducts({ page: 1 });

    expectStatus(result.status, 200);
    expectPaginatedProductsResponse(result.body);
    expect(Array.isArray(result.body.data)).toBe(true);
    expect(result.body.data.length).toBeGreaterThan(0);
  });

  test('GET /products/{productId} returns matching product', async ({
    productApi,
  }) => {
    const listResult = await productApi.getProducts({ page: 1 });
    expectStatus(listResult.status, 200);
    expectPaginatedProductsResponse(listResult.body);

    const productFromList = listResult.body.data[0];
    expectProductShape(productFromList);

    const detailsResult = await productApi.getProduct(productFromList.id);

    expectStatus(detailsResult.status, 200);
    expect(String(detailsResult.body.id)).toBe(String(productFromList.id));
    expect(String(detailsResult.body.name).trim().length).toBeGreaterThan(0);
  });

  test('GET /products?sort=name,asc returns products sorted by name ascending', async ({
    productApi,
  }) => {
    const result = await productApi.getProducts({
      sort: 'name,asc',
      page: 1,
    });

    expectStatus(result.status, 200);
    expectPaginatedProductsResponse(result.body);

    const names = result.body.data.map((product) => String(product.name));
    expectStringsSortedAsc(names);
  });

  test('GET /products?page=1 returns first page', async ({ productApi }) => {
    const result = await productApi.getProducts({ page: 1 });

    expectStatus(result.status, 200);
    expectPaginatedProductsResponse(result.body);
    expect(result.body.current_page).toBe(1);
  });
});

test.describe('Products API regression', { tag: ['@regression'] }, () => {
  test('GET /products?sort=price,desc returns products sorted by price descending', async ({
    productApi,
  }) => {
    test.setTimeout(60_000);

    const result = await productApi.getProducts({
      sort: 'price,desc',
      page: 1,
    });

    expectStatus(result.status, 200);
    expectPaginatedProductsResponse(result.body);

    const prices = result.body.data.map((product) => toNumber(product.price));
    expect(prices.every((price) => !Number.isNaN(price))).toBe(true);
    expectNumbersSortedDesc(prices);
  });

  test('GET /products?between=price,10,30 returns products within range', async ({
    productApi,
  }) => {
    test.setTimeout(60_000);

    const result = await productApi.getProducts({
      between: 'price,10,30',
      page: 1,
    });

    expectStatus(result.status, 200);
    expectPaginatedProductsResponse(result.body);

    const prices = result.body.data.map((product) => toNumber(product.price));
    expect(prices.length).toBeGreaterThan(0);

    for (const price of prices) {
      expect(price).toBeGreaterThanOrEqual(10);
      expect(price).toBeLessThanOrEqual(30);
    }
  });

  test('GET /products/{id} returns 404 for nonexistent product', async ({
    productApi,
  }) => {
    const result = await productApi.getProduct('nonexistent-id-99999');
    expectStatus(result.status, 404);
  });
});
