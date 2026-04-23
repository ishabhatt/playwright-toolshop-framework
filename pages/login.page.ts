import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly registerLink: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('[data-test="email"]');
    this.passwordInput = page.getByTestId('password');
    this.signInButton = page.getByTestId('login-submit');
    this.registerLink = page.getByRole('link', {
      name: /register your account/i,
    });
    this.forgotPasswordLink = page.getByRole('link', {
      name: /forgot your password/i,
    });
  }

  async goto() {
    await super.goto('/auth/login');
  }

  async expectLoaded() {
    await this.expectUrl(/\/auth\/login$/);
    await this.expectVisible('email');
  }

  async expectStructure() {
    await this.expectVisible('email');
    await this.expectVisible('password');
    await this.expectVisible('login-submit');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
    await this.page.waitForURL((url) => !url.pathname.includes('/auth/login'));
  }

  async expectLoginError(): Promise<void> {
    await this.expectErrorMessage(/invalid|incorrect|wrong/i);
  }
}
