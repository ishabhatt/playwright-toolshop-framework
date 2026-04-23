import { BaseApiClient } from './baseApiClient';

export interface Brand {
  id?: string | number;
  name?: string;
  slug?: string;
  [key: string]: unknown;
}

export class BrandApiClient {
  constructor(private readonly api: BaseApiClient) {}

  async getBrands() {
    return this.api.get<Brand[]>('/brands');
  }
}
