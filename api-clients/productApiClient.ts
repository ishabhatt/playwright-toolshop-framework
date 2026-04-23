import { BaseApiClient, QueryValue } from './baseApiClient';

export interface Product {
  id: string | number;
  name: string;
  price?: string | number;
  [key: string]: unknown;
}

export interface PaginatedProductsResponse {
  current_page: number;
  data: Product[];
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

export interface ProductQueryParams extends Record<string, QueryValue> {
  by_brand?: string | number;
  by_category?: string | number;
  is_rental?: boolean | string;
  between?: string;
  sort?: string;
  page?: number;
}

export class ProductApiClient {
  constructor(private readonly api: BaseApiClient) {}

  async getProducts(params: ProductQueryParams = {}) {
    return this.api.get<PaginatedProductsResponse>('/products', params);
  }

  async getProduct(productId: string | number) {
    return this.api.get<Product>(`/products/${productId}`);
  }
}
