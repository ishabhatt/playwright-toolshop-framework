import { test, expect } from '../../../fixtures/baseTest';
import { expectStatus } from '../../../utils/apiAssertions';
import { getEnv } from '../../../config/env';

const ENV = getEnv();

test.describe('Cart API', { tag: ['@smoke', '@regression', '@auth'] }, () => {
  async function setupCartWithItem(
    authApi: { login: (e: string, p: string) => Promise<string> },
    cartApi: InstanceType<
      typeof import('../../../api-clients/cartApiClient').CartApiClient
    >,
    productApi: InstanceType<
      typeof import('../../../api-clients/productApiClient').ProductApiClient
    >,
  ) {
    const token = await authApi.login(
      ENV.TEST_USER_EMAIL,
      ENV.TEST_USER_PASSWORD,
    );

    const productsResult = await productApi.getProducts({ page: 1 });
    const product = productsResult.body.data[0];
    expect(product).toBeDefined();

    const createResult = await cartApi.createCart(token);
    expectStatus(createResult.status, 201);
    const cartId = createResult.body.id;
    expect(cartId).toBeTruthy();

    const addResult = await cartApi.addItemToCart(
      cartId,
      String(product.id),
      1,
      token,
    );
    expectStatus(addResult.status, 200);

    return { token, cartId, product };
  }

  test('POST /carts creates a new empty cart', async ({ authApi, cartApi }) => {
    const token = await authApi.login(
      ENV.TEST_USER_EMAIL,
      ENV.TEST_USER_PASSWORD,
    );

    const result = await cartApi.createCart(token);

    expectStatus(result.status, 201);
    expect(result.body.id).toBeTruthy();

    await cartApi.deleteCart(result.body.id, token);
  });

  test('POST /carts/{id} adds a product to the cart', async ({
    authApi,
    cartApi,
    productApi,
  }) => {
    const { token, cartId } = await setupCartWithItem(
      authApi,
      cartApi,
      productApi,
    );

    await cartApi.deleteCart(cartId, token);
  });

  test('GET /carts/{cartId} returns cart with the added item', async ({
    authApi,
    cartApi,
    productApi,
  }) => {
    const { token, cartId, product } = await setupCartWithItem(
      authApi,
      cartApi,
      productApi,
    );

    const cartResult = await cartApi.getCart(cartId, token);
    expectStatus(cartResult.status, 200);

    expect(cartResult.body.cart_items).toBeDefined();
    expect(Array.isArray(cartResult.body.cart_items)).toBe(true);
    expect(cartResult.body.cart_items.length).toBeGreaterThan(0);

    const cartItem = cartResult.body.cart_items.find(
      (item) => String(item.product_id) === String(product.id),
    );
    expect(cartItem).toBeDefined();
    expect(cartItem!.quantity).toBe(1);

    await cartApi.deleteCart(cartId, token);
  });

  test('PUT /carts/{cartId}/product/quantity updates item quantity', async ({
    authApi,
    cartApi,
    productApi,
  }) => {
    const { token, cartId, product } = await setupCartWithItem(
      authApi,
      cartApi,
      productApi,
    );

    const updateResult = await cartApi.updateItemQuantity(
      cartId,
      String(product.id),
      3,
      token,
    );
    expectStatus(updateResult.status, 200);

    const cartResult = await cartApi.getCart(cartId, token);
    const updatedItem = cartResult.body.cart_items.find(
      (item) => String(item.product_id) === String(product.id),
    );
    expect(updatedItem).toBeDefined();
    expect(updatedItem!.quantity).toBe(3);

    await cartApi.deleteCart(cartId, token);
  });

  test('DELETE /carts/{cartId}/product/{productId} removes item from cart', async ({
    authApi,
    cartApi,
    productApi,
  }) => {
    const { token, cartId, product } = await setupCartWithItem(
      authApi,
      cartApi,
      productApi,
    );

    const removeResult = await cartApi.removeItemFromCart(
      cartId,
      String(product.id),
      token,
    );
    expectStatus(removeResult.status, 204);

    const cartResult = await cartApi.getCart(cartId, token);
    const remainingItem = cartResult.body.cart_items.find(
      (item) => String(item.product_id) === String(product.id),
    );
    expect(remainingItem).toBeUndefined();

    await cartApi.deleteCart(cartId, token);
  });

  test('DELETE /carts/{cartId} deletes the cart', async ({
    authApi,
    cartApi,
  }) => {
    const token = await authApi.login(
      ENV.TEST_USER_EMAIL,
      ENV.TEST_USER_PASSWORD,
    );

    const createResult = await cartApi.createCart(token);
    expectStatus(createResult.status, 201);
    const cartId = createResult.body.id;

    const deleteResult = await cartApi.deleteCart(cartId, token);
    expectStatus(deleteResult.status, 204);

    const getResult = await cartApi.getCart(cartId, token);
    expectStatus(getResult.status, 404);
  });

  test('GET /carts/{cartId} returns 404 for unknown cart', async ({
    cartApi,
  }) => {
    const result = await cartApi.getCart('some-cart-id', '');
    expectStatus(result.status, 404);
  });
});
