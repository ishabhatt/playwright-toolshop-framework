import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class CartPage extends BasePage {
  readonly cartItems: Locator;
  readonly proceedToCheckoutBtn: Locator;
  readonly continueShoppingBtn: Locator;
  readonly emptyCartMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.cartItems = this.page.locator('tr.ng-star-inserted');
    this.continueShoppingBtn = page.getByTestId('continue-shopping');
    this.proceedToCheckoutBtn = page.getByTestId('proceed-1');
    this.emptyCartMessage = this.page.locator(
      '.cart-empty, [data-test="cart-empty"]',
    );
  }

  async expectLoaded(): Promise<void> {
    await this.expectUrlContains('checkout');
  }

  async expectItemVisible(productName: string): Promise<void> {
    await expect(
      this.page.getByText(productName, { exact: false }),
    ).toBeVisible({ timeout: 15_000 });
  }

  async expectItemCount(count: number): Promise<void> {
    await expect(this.cartItems).toHaveCount(count);
  }

  async expectCartEmpty(): Promise<void> {
    await expect(this.cartItems).toHaveCount(0);
  }

  async proceedToCheckout(): Promise<void> {
    await this.proceedToCheckoutBtn.click();
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingBtn.click();
  }
}
