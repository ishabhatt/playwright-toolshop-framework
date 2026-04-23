import { test as base, expect, APIRequestContext } from '@playwright/test';
import { getEnv } from '../config/env';
import { HomePage } from '../pages/home.page';
import { LoginPage } from '../pages/login.page';
import { ProductListPage } from '../pages/product-list.page';
import { ProductDetailsPage } from '../pages/product-details.page';
import { CartPage } from '../pages/cart.page';
import { HeaderComponent } from '../components/header.component';

import { BaseApiClient } from '../api-clients/baseApiClient';
import { ProductApiClient } from '../api-clients/productApiClient';
import { BrandApiClient } from '../api-clients/brandApiClient';
import { CartApiClient } from '../api-clients/cartApiClient';
import { AuthApiClient } from '../api-clients/authApiClient';

const ENV = getEnv();
type Fixtures = {
  homePage: HomePage;
  loginPage: LoginPage;
  header: HeaderComponent;
  productListPage: ProductListPage;
  productDetailsPage: ProductDetailsPage;
  cartPage: CartPage;

  apiContext: APIRequestContext;
  authApi: AuthApiClient;
  productApi: ProductApiClient;
  cartApi: CartApiClient;
  brandApi: BrandApiClient;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  header: async ({ page }, use) => {
    await use(new HeaderComponent(page));
  },
  productListPage: async ({ page }, use) => {
    await use(new ProductListPage(page));
  },
  productDetailsPage: async ({ page }, use) => {
    await use(new ProductDetailsPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  apiContext: async ({ playwright }, use) => {
    const apiContext = await playwright.request.newContext({
      baseURL: ENV.API_BASE_URL,
      extraHTTPHeaders: {
        Accept: 'application/json',
      },
      timeout: 30_000,
    });
    await use(apiContext);
    await apiContext.dispose();
  },
  productApi: async ({ apiContext }, use) => {
    await use(new ProductApiClient(new BaseApiClient(apiContext)));
  },
  brandApi: async ({ apiContext }, use) => {
    await use(new BrandApiClient(new BaseApiClient(apiContext)));
  },
  authApi: async ({ apiContext }, use) => {
    await use(new AuthApiClient(new BaseApiClient(apiContext)));
  },
  cartApi: async ({ apiContext }, use) => {
    await use(new CartApiClient(new BaseApiClient(apiContext)));
  },
});

export { expect };
