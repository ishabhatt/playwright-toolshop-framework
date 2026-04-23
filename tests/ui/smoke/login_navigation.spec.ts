import { test } from '../../../fixtures/baseTest';

test.describe(
  'Login navigation smoke',
  { tag: ['@ui', '@smoke', '@regression'] },
  () => {
    test('navigates to sign in page and shows key links', async ({
      homePage,
      header,
      loginPage,
    }) => {
      await homePage.goto();
      await header.clickSignIn();
      await loginPage.expectLoaded();
    });

    test('shows essential login page elements', async ({
      homePage,
      header,
      loginPage,
    }) => {
      await homePage.goto();
      await header.clickSignIn();
      await loginPage.expectLoaded();
      await loginPage.expectStructure();
    });
  },
);
