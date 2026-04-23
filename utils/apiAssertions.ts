import { expect } from '@playwright/test';
import type {
  PaginatedProductsResponse,
  Product,
} from '../api-clients/productApiClient';
import type { Brand } from '../api-clients/brandApiClient';

export function expectStatus(actual: number, expected = 200) {
  expect(actual).toBe(expected);
}

export function expectPaginatedProductsResponse(
  body: PaginatedProductsResponse,
) {
  expect(body).toEqual(
    expect.objectContaining({
      current_page: expect.any(Number),
      data: expect.any(Array),
      last_page: expect.any(Number),
      per_page: expect.any(Number),
      total: expect.any(Number),
    }),
  );

  expect(body.data.length).toBeGreaterThan(0);
}

export function expectProductShape(product: Product) {
  expect(product.id).toBeTruthy();
  expect(String(product.name).trim().length).toBeGreaterThan(0);
}

export function expectBrandsArrayShape(brands: Brand[]) {
  expect(Array.isArray(brands)).toBe(true);
  expect(brands.length).toBeGreaterThan(0);

  const first = brands[0] as Record<string, unknown>;
  const identifier = first.id ?? first.slug;
  const nameLike = first.name ?? first.slug;
  const normalizedName =
    typeof nameLike === 'string' || typeof nameLike === 'number'
      ? String(nameLike)
      : '';

  expect(identifier).toBeDefined();
  expect(normalizedName.trim().length).toBeGreaterThan(0);
}

export function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  return Number(String(value).replace(/[^0-9.-]/g, ''));
}

export function expectStringsSortedAsc(values: string[]) {
  const normalized = values.map((value) => value.trim().toLowerCase());
  const sorted = [...normalized].sort((a, b) => a.localeCompare(b));
  expect(normalized).toEqual(sorted);
}

export function expectNumbersSortedDesc(values: number[]) {
  const sorted = [...values].sort((a, b) => b - a);
  expect(values).toEqual(sorted);
}
