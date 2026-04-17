import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { reportStep, setExpectedResult } from '../utils/reporting';

test.describe('QRS login smoke checks', () => {
  test('login page is accessible', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await setExpectedResult('The QRS login page should open successfully and show the login form.');

    await reportStep(page, 'Open the login page', 'The QRS login page should load successfully.', async () => {
      await loginPage.open();
    });

    await reportStep(
      page,
      'Verify the login form is visible',
      'Username, password, and login button should be visible on the login page.',
      async () => {
        await loginPage.expectLoginFormVisible();
      },
    );
  });

  test('user can attempt login with env credentials', async ({ page }) => {
    test.skip(!process.env.LOGIN_USERNAME || !process.env.LOGIN_PASSWORD, 'Set LOGIN_USERNAME and LOGIN_PASSWORD to run this test.');

    const loginPage = new LoginPage(page);
    await setExpectedResult('The user should be able to submit valid credentials and leave the login page.');

    await reportStep(page, 'Open the login page', 'The login page should load successfully before login.', async () => {
      await loginPage.open();
    });

    await reportStep(
      page,
      'Submit the configured credentials',
      'The configured username and password should be submitted successfully.',
      async () => {
        await loginPage.login(process.env.LOGIN_USERNAME!, process.env.LOGIN_PASSWORD!);
      },
    );

    await reportStep(
      page,
      'Verify the user leaves the login page',
      'The user should navigate away from the login page after a successful login attempt.',
      async () => {
        await expect(page).not.toHaveURL(/login/i);
      },
    );
  });
});
