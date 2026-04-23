import { test } from '../../../fixtures/baseTest';
import {
  expectBrandsArrayShape,
  expectStatus,
} from '../../../utils/apiAssertions';

test.describe('Brands API smoke', { tag: ['@smoke', '@regression'] }, () => {
  test('GET /brands returns brands array', async ({ brandApi }) => {
    const result = await brandApi.getBrands();

    expectStatus(result.status, 200);
    expectBrandsArrayShape(result.body);
  });
});
