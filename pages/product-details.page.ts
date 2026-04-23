import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import { toNumber } from '../utils/apiAssertions';

export class ProductDetailsPage extends BasePage {
  readonly productPrice: Locator;
  readonly addToCartButton: Locator;
  readonly productName: Locator;

  constructor(page: Page) {
    super(page);
    this.productPrice = page.getByTestId('unit-price');
    this.addToCartButton = page.getByRole('button', { name: 'Add to cart' });
    this.productName = page.locator('h1, h2, h3, h4, h5, h6').first();
  }
  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/product\//);
    await expect(this.addToCartButton).toBeVisible();
  }

  async expectProductName(productName: string): Promise<void> {
    await expect(this.productName).toContainText(productName);
  }

  async getDisplayedPrice(): Promise<number> {
    const text = await this.productPrice.textContent();
    return toNumber(text ?? '');
  }

  async addToCart(): Promise<void> {
    await expect(this.addToCartButton).toBeVisible();
    await this.addToCartButton.click();
  }
}
