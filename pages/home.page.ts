import { Page } from '@playwright/test';
import { BasePage } from './base.page';

export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto('/');
  }

  async expectLoaded() {
    await this.expectUrl(/practicesoftwaretesting\.com\/?$/);
  }
}
