import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class ProductListPage extends BasePage {
  readonly firstProductLink: Locator;
  readonly noProductsMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.firstProductLink = page.locator('a[href*="/product/"]').first();
    this.noProductsMessage = page.getByTestId('category-empty');
  }

  productByName(productName: string): Locator {
    return this.page.getByAltText(productName, { exact: true }).first();
  }

  async expectCategoryLoaded(categoryName: string) {
    await expect(this.page.getByTestId('page-title')).toHaveText(
      'Category: ' + categoryName,
    );
  }

  async expectProductVisible(productName: string) {
    await expect(this.productByName(productName)).toBeVisible({
      timeout: 20_000,
    });
  }

  async expectSearchResult(productName: string) {
    await expect(this.productByName(productName)).toBeVisible({
      timeout: 20_000,
    });
  }

  async openProductByName(productName: string) {
    await this.productByName(productName).click();
  }

  async openFirstProduct() {
    await this.firstProductLink.click();
  }

  async expectNoProductsMessage() {
    await expect(this.noProductsMessage).toBeVisible({ timeout: 10_000 });
  }
}
