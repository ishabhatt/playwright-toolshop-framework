import { expect, Page } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  // ── Navigation ────────────────────────────────────────────────────────

  async waitForStable(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await this.waitForStable();
  }

  // ── URL assertions ────────────────────────────────────────────────────

  async expectUrl(pattern: RegExp | string): Promise<void> {
    await expect(this.page).toHaveURL(pattern);
  }

  async expectUrlContains(segment: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(segment));
  }

  // ── Error state assertions ────────────────────────────────────────────

  async expectNoErrorBanner(): Promise<void> {
    await expect(
      this.page.locator('.alert-danger, [data-test*="error"], .error-message'),
    ).not.toBeVisible();
  }

  async expectErrorMessage(text: string | RegExp): Promise<void> {
    await expect(
      this.page.locator('.alert-danger, [data-test*="error"]').first(),
    ).toContainText(text);
  }

  // ── Page title ────────────────────────────────────────────────────────

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  async expectTitle(expected: string | RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(expected);
  }

  // ── Visibility helpers ────────────────────────────────────────────────

  async expectVisible(testId: string): Promise<void> {
    await expect(this.page.getByTestId(testId)).toBeVisible();
  }

  async expectNotVisible(testId: string): Promise<void> {
    await expect(this.page.getByTestId(testId)).not.toBeVisible();
  }

  // ── Network wait helper ───────────────────────────────────────────────
  // Use sparingly — only when a specific API response must complete
  // before asserting UI state (e.g. after form submit).

  async waitForApiResponse(urlPattern: RegExp): Promise<void> {
    await this.page.waitForResponse(
      (response) => urlPattern.test(response.url()) && response.status() < 400,
      { timeout: 15_000 },
    );
  }
}
