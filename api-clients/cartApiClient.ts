import { BaseApiClient } from './baseApiClient';

export interface CartCreatedResponse {
  id: string;
  [key: string]: unknown;
}

export interface CartResponse {
  id: string | number;
  cart_items: CartItem[];
  total_price: number;
  [key: string]: unknown;
}

export interface CartItem {
  id: string | number;
  quantity: number;
  discount_percentage: number | null;
  cart_id: string | number;
  product_id: string | number;
  product: {
    id: string | number;
    name: string;
    description: string;
    price: number;
    is_location_offer: boolean;
    is_rental: boolean;
    co2_rating: string;
    in_stock: boolean;
    is_eco_friendly: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export class CartApiClient {
  constructor(private readonly api: BaseApiClient) {}

  async createCart(token: string) {
    return this.api.post<CartCreatedResponse>('/carts', {}, token);
  }

  async addItemToCart(
    cartId: string,
    productId: string,
    quantity: number,
    token: string,
  ) {
    return this.api.post<CartResponse>(
      `/carts/${cartId}`,
      { product_id: productId, quantity },
      token,
    );
  }

  async getCart(cartId: string, token: string) {
    return this.api.get<CartResponse>(`/carts/${cartId}`, undefined, token);
  }

  async deleteCart(cartId: string, token: string) {
    return this.api.delete<unknown>(`/carts/${cartId}`, token);
  }

  async updateItemQuantity(
    cartId: string,
    productId: string,
    quantity: number,
    token: string,
  ) {
    return this.api.put<CartResponse>(
      `/carts/${cartId}/product/quantity`,
      { product_id: productId, quantity },
      token,
    );
  }

  async removeItemFromCart(cartId: string, productId: string, token: string) {
    return this.api.delete<CartResponse>(
      `/carts/${cartId}/product/${productId}`,
      token,
    );
  }
}
