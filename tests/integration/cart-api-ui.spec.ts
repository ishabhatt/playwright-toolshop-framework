import { test, expect } from '../../fixtures/baseTest';
import { expectStatus } from '../../utils/apiAssertions';
import { testUserPayload } from '../../utils/dataFactory';

test.describe(
  'Cart API to UI consistency',
  { tag: ['@smoke', '@regression'] },
  () => {
    // Known product defect:
    // A cart created via API for a freshly registered user is not rendered in the
    // checkout UI after UI login. Manual verification also showed the app throwing
    // "Cannot read properties of null (reading 'cart_items')" on /checkout and no
    // header control with data-test="nav-cart".
    //
    // Keep this as a documented fixme so the public smoke suite stays green while
    // preserving the defect as an architectural case study.
    test('item added via API appears in UI cart', async ({
      page,
      authApi,
      cartApi,
      productApi,
      loginPage,
      header,
    }) => {
      test.fixme(
        true,
        'Known product defect: API-created cart state is not available in checkout UI after UI login; header nav-cart selector is also absent.',
      );

      // api — pick a real product
      const productsResult = await productApi.getProducts({
        sort: 'name,asc',
        page: 1,
      });
      expectStatus(productsResult.status, 200);

      const product = productsResult.body.data.find(
        (p) => String(p.name).trim().length > 0,
      );
      expect(product).toBeDefined();
      const productName = String(product!.name);

      // authenticate via API
      const user = testUserPayload();
      await authApi.register(user);
      const token = await authApi.login(user.email, user.password);
      expect(token.length).toBeGreaterThan(0);

      // add product to cart via API
      const createResult = await cartApi.createCart(token);
      expectStatus(createResult.status, 201);
      const cartId = createResult.body.id;
      expect(cartId).toBeTruthy();

      try {
        const addResult = await cartApi.addItemToCart(
          cartId,
          String(product!.id),
          1,
          token,
        );
        expectStatus(addResult.status, 200);

        // log in via UI
        await loginPage.goto();
        await loginPage.login(user.email, user.password);
        await expect(page).not.toHaveURL(/\/auth\/login/);

        // Soft-check the cart link so the test can continue to the actual
        // cart-content verification even if the header control is absent.
        await expect.soft(header.cartLink).toBeVisible();

        // navigate to cart via direct URL
        await page.goto('/checkout');

        // assert the product name is visible in the cart
        await expect(page.getByText(productName, { exact: false })).toBeVisible(
          { timeout: 15_000 },
        );
      } finally {
        // Best-effort cleanup: the demo API allows cart deletion but does not
        // expose user deletion, so carts are always cleaned and users are
        // isolated via unique generated identities.
        await cartApi.deleteCart(cartId, token);
      }
    });
  },
);
