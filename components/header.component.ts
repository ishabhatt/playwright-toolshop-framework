import { expect, Locator, Page } from '@playwright/test';

export class HeaderComponent {
  readonly page: Page;
  readonly signInLink: Locator;
  readonly categoryMenu: Locator;
  readonly searchInput: Locator;
  readonly documentationLink: Locator;
  readonly cartLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.signInLink = page.getByTestId('nav-sign-in');
    this.categoryMenu = page.getByTestId('nav-categories');
    this.searchInput = page.getByTestId('search-query');
    this.documentationLink = page.getByRole('link', { name: /Documentation/i });
    this.cartLink = page.getByTestId('nav-cart');
  }

  categoryLink(categoryName: string): Locator {
    return this.page.getByRole('link', { name: categoryName, exact: true });
  }

  async clickSignIn() {
    await this.signInLink.click();
  }

  async clickDocumentationLink() {
    await this.documentationLink.click();
  }

  async openCategoryMenu() {
    await this.categoryMenu.click();
  }

  async openCategory(categoryName: string) {
    await this.categoryLink(categoryName).click();
  }

  async searchFor(searchText: string) {
    await expect(this.searchInput).toBeVisible();
    await this.searchInput.fill(searchText);
    await this.searchInput.press('Enter');
  }

  async expectCartLinkVisible() {
    await expect(this.cartLink).toBeVisible();
  }
}
