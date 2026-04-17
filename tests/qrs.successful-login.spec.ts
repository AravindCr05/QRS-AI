import { expect, test } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { env } from '../utils/env';
import { reportStep, setExpectedResult } from '../utils/reporting';

test.describe('QRS BO Portal - Successful Login page tests', () => {
  test.describe.configure({ timeout: 120000 });

  test('QRS_BO_Login page_Successful login with valid user credential', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await setExpectedResult('User should be logged in and navigated to the Dashboard page');

    await reportStep(page, 'Precondition:1. User entry should be available in the live tab of User Management page with status Active2. User should have launched the QRS BO Portal and login page should be displayed', '', async () => {
      await loginPage.open();
    });

    await reportStep(page, 'Enter the valid username and password', 'User should able to enter', async () => {
      await loginPage.fillUsername(env.username);
      await loginPage.fillPassword(env.password);
      await expect.soft(loginPage.usernameInput).toHaveValue(env.username);
    });

    await reportStep(page, 'Click the Login button', 'User should be logged in and navigated to the Dashboard page', async () => {
      await loginPage.loginButton.click();
      await expect.soft(page).not.toHaveURL(/login/i);
    });
  });

  test('QRS_BO_Login page_Successful login for the user status updated from Inactive to Active and Checker approved', async ({ page }) => {
    test.fixme(true, 'On hold: requires User Management automation/data setup to create and verify this precondition.');
    const loginPage = new LoginPage(page);
    await setExpectedResult('User should be logged in and navigated to the Dashboard page');

    await reportStep(page, 'Precondition:1. User entry should be available in the live tab of User Management page with status Inactive2. Maker should have updated the status from Inactive to Active and Checker should have approved it3. User should have launched the QRS BO Portal and login page should be displayed', '', async () => {
      await loginPage.open();
    });

    await reportStep(page, 'Enter the username and password for the updated user', 'User should able to enter', async () => {
      await loginPage.fillUsername(env.username);
      await loginPage.fillPassword(env.password);
      await expect.soft(loginPage.usernameInput).toHaveValue(env.username);
    });

    await reportStep(page, 'Click the Login button', 'User should be logged in and navigated to the Dashboard page', async () => {
      await loginPage.loginButton.click();
      await expect.soft(page).not.toHaveURL(/login/i);
    });
  });

  test('QRS_BO_Login page_Successful login for the user status updated from Active to Inactive and pending checker approval', async ({ page }) => {
    test.fixme(true, 'On hold: requires User Management automation/data setup to create and verify this precondition.');
    const loginPage = new LoginPage(page);
    await setExpectedResult('User should be logged in and navigated to the Dashboard page');

    await reportStep(page, 'Precondition:1. User entry should be available in the live tab of User Management page with status Active2. Maker should have updated the status from Active to Inactive and Checker should not have taken any action3. User should have launched the QRS BO Portal and login page should be displayed', '', async () => {
      await loginPage.open();
    });

    await reportStep(page, 'Enter the username and password for the updated user', 'User should able to enter', async () => {
      await loginPage.fillUsername(env.username);
      await loginPage.fillPassword(env.password);
      await expect.soft(loginPage.usernameInput).toHaveValue(env.username);
    });

    await reportStep(page, 'Click the Login button', 'User should be logged in and navigated to the Dashboard page', async () => {
      await loginPage.loginButton.click();
      await expect.soft(page).not.toHaveURL(/login/i);
    });
  });

  test('QRS_BO_Login page_Successful login for the user status updated from Active to Inactive and checker rejected', async ({ page }) => {
    test.fixme(true, 'On hold: requires User Management automation/data setup to create and verify this precondition.');
    const loginPage = new LoginPage(page);
    await setExpectedResult('User should be logged in and navigated to the Dashboard page');

    await reportStep(page, 'Precondition:1. User entry should be available in the live tab of User Management page with status Active2. Maker should have updated the status from Active to Inactive and Checker should have rejected3. User should have launched the QRS BO Portal and login page should be displayed', '', async () => {
      await loginPage.open();
    });

    await reportStep(page, 'Enter the username and password for the updated user', 'User should able to enter', async () => {
      await loginPage.fillUsername(env.username);
      await loginPage.fillPassword(env.password);
      await expect.soft(loginPage.usernameInput).toHaveValue(env.username);
    });

    await reportStep(page, 'Click the Login button', 'User should be logged in and navigated to the Dashboard page', async () => {
      await loginPage.loginButton.click();
      await expect.soft(page).not.toHaveURL(/login/i);
    });
  });

  test('QRS_BO_Login page_Successful login for the deleted user and pending checker approval', async ({ page }) => {
    test.fixme(true, 'On hold: requires User Management automation/data setup to create and verify this precondition.');
    const loginPage = new LoginPage(page);
    await setExpectedResult('User should be logged in and navigated to the Dashboard page');

    await reportStep(page, 'Precondition:1. User entry should be available in the live tab of User Management page with status Active2. Maker should have deleted the user and Checker should not have taken any action3. User should have launched the QRS BO Portal and login page should be displayed', '', async () => {
      await loginPage.open();
    });

    await reportStep(page, 'Enter the username and password for the deleted user', 'User should able to enter', async () => {
      await loginPage.fillUsername(env.username);
      await loginPage.fillPassword(env.password);
      await expect.soft(loginPage.usernameInput).toHaveValue(env.username);
    });

    await reportStep(page, 'Click the Login button', 'User should be logged in and navigated to the Dashboard page', async () => {
      await loginPage.loginButton.click();
      await expect.soft(page).not.toHaveURL(/login/i);
    });
  });

  test('QRS_BO_Login page_Successful login for the deleted active user and checker rejected', async ({ page }) => {
    test.fixme(true, 'On hold: requires User Management automation/data setup to create and verify this precondition.');
    const loginPage = new LoginPage(page);
    await setExpectedResult('User should be logged in and navigated to the Dashboard page');

    await reportStep(page, 'Precondition:1. User entry should be available in the live tab of User Management page with status Active2. Maker should have deleted the user and Checker should have rejected3. User should have launched the QRS BO Portal and login page should be displayed', '', async () => {
      await loginPage.open();
    });

    await reportStep(page, 'Enter the username and password for the deleted user', 'User should able to enter', async () => {
      await loginPage.fillUsername(env.username);
      await loginPage.fillPassword(env.password);
      await expect.soft(loginPage.usernameInput).toHaveValue(env.username);
    });

    await reportStep(page, 'Click the Login button', 'User should be logged in and navigated to the Dashboard page', async () => {
      await loginPage.loginButton.click();
      await expect.soft(page).not.toHaveURL(/login/i);
    });
  });
});
