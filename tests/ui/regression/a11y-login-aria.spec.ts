import { test, expect } from '../../../fixtures/baseTest';

test.describe('Login ARIA snapshot', { tag: ['@ui', '@regression'] }, () => {
  test('login form accessibility tree stays stable', async ({
    loginPage,
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== 'chromium',
      'Keep ARIA snapshots on one browser for stability',
    );

    await loginPage.goto();
    await loginPage.expectLoaded();

    await expect(page.locator('form').first()).toMatchAriaSnapshot(`
			- textbox "Email address *"
			- textbox "Password *"
			- button
			- button "Login"
		`);
  });
});
