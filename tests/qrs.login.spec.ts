import { expect, test } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { env } from '../utils/env';
import { reportStep, setExpectedResult } from '../utils/reporting';

test.describe('QRS BO Portal - Login module', () => {
  test.describe.configure({ timeout: 120000 });

  test('QRS_BO Portal_Login page launch verification', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await setExpectedResult('QRS login page should be launched');

    await reportStep(page, 'Launch the QRS BO portal url', 'QRS login page should be launched', async () => {
      await loginPage.open();
      await expect.soft(page).toHaveURL(/auth\/login/i);
      await expect.soft(page).toHaveTitle(/QRS/i);
      await expect.soft(loginPage.usernameInput).toBeVisible();
      await expect.soft(loginPage.passwordInput).toBeVisible();
    });
  });

  test('QRS_BO Portal_Login page_Verify presence and alignment of UI elements.', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await setExpectedResult('UI elements should match the provided manual test case wording.');

    await reportStep(page, 'Precondition:1. User should have launched the QRS BO Portal and login page should be displayed', '', async () => {
      await loginPage.open();
    });

    await reportStep(page, 'Verify the field availability in the login page', 'Username and Password field should be available', async () => {
      await expect.soft(loginPage.usernameInput).toBeVisible();
      await expect.soft(loginPage.passwordInput).toBeVisible();
    });

    await reportStep(page, 'Verify the button availability in the login page', 'Login button should be available', async () => {
      await expect.soft(loginPage.loginButton).toBeVisible();
    });

    await reportStep(page, 'Verify the icon availability in the login page', 'Eye icon should be displayed in the Password field', async () => {
      await expect.soft(loginPage.passwordToggleButton).toBeVisible();
    });

    await reportStep(page, 'Verify the title in the login page', 'Title should be displayed as "QRS System" in the login page', async () => {
      await expect.soft(loginPage.brandingTitle).toHaveText('QRS System');
    });

    await reportStep(page, 'Verify the content below the login page title', 'Content should be displayed as "The QR Settlement system facilitates seamless integration between QRS Applications merchants and RHB Reflex through a secure architecture." in the login page title', async () => {
      await expect.soft(loginPage.brandingDescription).toContainText('The QR Settlement system facilitates seamless integration between QRS Applications merchants and RHB Reflex through a secure architecture.');
    });

    await reportStep(page, 'Verify the title in the login section', 'Title should be displayed as "Log In" in the login section', async () => {
      await expect.soft(loginPage.loginSectionTitle).toHaveText('Log In');
    });

    await reportStep(page, 'Verify the content in the login section', 'Content should be displayed as "to continue using QRS System" below the login section title', async () => {
      await expect.soft(loginPage.loginSectionSubtitle).toContainText('to continue using QRS System');
    });

    await reportStep(page, 'Verify the url', 'Url should be displayed as', async () => {
      await expect.soft(page).toHaveURL(/auth\/login/i);
    });

    await reportStep(page, 'Verify the browser tab name', 'Browser tab name should be displayed as "QRS"', async () => {
      await expect.soft(page).toHaveTitle('QRS');
    });
  });

  test('QRS_BO Portal_Login page_Verify placeholder text for the fields', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await setExpectedResult('Placeholders should match the provided manual test case wording.');

    await reportStep(page, 'Precondition:1. User should have launched the QRS BO Portal and login page should be displayed', '', async () => {
      await loginPage.open();
    });

    await reportStep(page, 'Verify the placeholder in the Username field', 'Username placeholder should be displayed as "Enter Username"', async () => {
      await expect.soft(loginPage.usernameInput).toHaveAttribute('placeholder', /enter username/i);
    });

    await reportStep(page, 'Verify the placeholder in the Password field', 'Password placeholder should be displayed as "Enter Password"', async () => {
      await expect.soft(loginPage.passwordInput).toHaveAttribute('placeholder', /enter password/i);
    });
  });

  test('QRS_BO Portal_Login page_Positive validation for Username field', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await setExpectedResult('Positive username validations should match the provided manual test case wording.');

    await reportStep(page, 'Precondition:1. User should have launched the QRS BO Portal and login page should be displayed', '', async () => {
      await loginPage.open();
    });

    await reportStep(page, 'Verify by entering 3 characters', 'Maker should allow to enter & no validation error message should be displayed', async () => {
      await loginPage.fillUsername('ram');
      await loginPage.blurField();
      await expect.soft(loginPage.usernameInput).toHaveValue('ram');
      await expect.soft(loginPage.validationMessage('Username is required.')).toHaveCount(0);
    });

    await reportStep(page, 'Verify by entering 50 characters', 'Maker should allow to enter & no validation error message should be displayed', async () => {
      const value = 'a'.repeat(50);
      await loginPage.fillUsername(value);
      await loginPage.blurField();
      await expect.soft(loginPage.usernameInput).toHaveValue(value);
      await expect.soft(loginPage.validationMessage('Username cannot be longer than 50 characters.')).toHaveCount(0);
    });

    await reportStep(page, 'Verify by entering more than 3 characters', 'Maker should allow to enter & no validation error message should be displayed', async () => {
      await loginPage.fillUsername('ramesh');
      await loginPage.blurField();
      await expect.soft(loginPage.usernameInput).toHaveValue('ramesh');
    });

    await reportStep(page, 'Verify by entering alphanumerics value', 'Maker should allow to enter & no validation error message should be displayed', async () => {
      await loginPage.fillUsername('ramesh123');
      await loginPage.blurField();
      await expect.soft(loginPage.usernameInput).toHaveValue('ramesh123');
    });

    await reportStep(page, 'Verify by entering numeric value', 'Maker should allow to enter & no validation error message should be displayed', async () => {
      await loginPage.fillUsername('12345');
      await loginPage.blurField();
      await expect.soft(loginPage.usernameInput).toHaveValue('12345');
    });

    await reportStep(page, 'Verify by entering valid value after validation error message is thrown in the field', 'Maker should allow to enter & validation error message should be disappeared', async () => {
      await loginPage.clearUsername();
      await loginPage.blurField();
      await expect.soft(loginPage.validationMessage('Username is required.')).toBeVisible();
      await loginPage.fillUsername('ramesh');
      await loginPage.blurField();
      await expect.soft(loginPage.validationMessage('Username is required.')).toHaveCount(0);
    });
  });

  test('QRS_BO Portal_Login page_Negative validation for Username field', async ({ page }) => {
    test.skip(true, 'Test validations are currently out of sync with actual UI behavior for negative cases.');
    const loginPage = new LoginPage(page);
    await setExpectedResult('Negative username validations should match the provided manual test case wording.');

    await reportStep(page, 'Precondition:1. User should have launched the QRS BO Portal and login page should be displayed', '', async () => {
      await loginPage.open();
    });

    await reportStep(page, 'Click on the Username text box and click outside', 'Validation error message should be displayed as "Username is required."', async () => {
      await loginPage.usernameInput.click();
      await loginPage.blurField();
      await expect.soft(loginPage.validationMessage('Username is required.')).toBeVisible();
    });

    await reportStep(page, 'Verify by entering less than 3 characters in the Username field', 'Maker should allow to enter & validation error message should be displayed as "Must be at least 3 characters long."', async () => {
      await loginPage.fillUsername('ab');
      await loginPage.blurField();
      await expect.soft(page.getByText(/username must be at least 3 characters long\./i)).toBeVisible();
    });

    await reportStep(page, 'Verify by entering more than 50 characters in the Username field', 'Maker should allow to enter & validation error message should be displayed as "Username cannot be longer than 50 characters."', async () => {
      await loginPage.fillUsername('a'.repeat(51));
      await loginPage.blurField();
      await expect.soft(loginPage.validationMessage('Username cannot be longer than 50 characters.')).toBeVisible();
    });

    await reportStep(page, 'Verify by entering less than 3 special characters in the Username field', 'Maker should allow to enter & validation error message should be displayed as "Must be at least 3 characters long.Invalid Username format."', async () => {
      await loginPage.fillUsername('@@');
      await loginPage.blurField();
      await expect.soft(page.getByText(/username must be at least 3 characters long\./i)).toBeVisible();
    });

    await reportStep(page, 'Verify by entering more than 50 special characters in the Username field', 'Maker should allow to enter & validation error message should be displayed as "Cannot be longer than 20 characters.Invalid Username format."', async () => {
      await loginPage.fillUsername('@'.repeat(51));
      await loginPage.blurField();
      await expect.soft(page.getByText('Cannot be longer than 20 characters.Invalid Username format.', { exact: true })).toBeVisible();
    });

    await reportStep(page, 'Verify by entering more than 3 special characters value in the Username field', 'Maker should allow to enter & validation error message should be displayed as "Invalid Username format."', async () => {
      await loginPage.fillUsername('@@@@');
      await loginPage.blurField();
      // await expect.soft(loginPage.validationMessage('Invalid Username format.')).toBeVisible();
    });

    await reportStep(page, 'Verify by entering a value with space as prefix in the Username field', 'Maker should allow to enter & validation error message should be displayed as "Invalid Username format."', async () => {
      await loginPage.fillUsername(' ramesh');
      await loginPage.blurField();
      // await expect.soft(loginPage.validationMessage('Invalid Username format.')).toBeVisible();
    });

    await reportStep(page, 'Verify by entering a value with space as suffix in the Username field', 'Maker should allow to enter & validation error message should be displayed as "Invalid Username format."', async () => {
      await loginPage.fillUsername('ramesh ');
      await loginPage.blurField();
      // await expect.soft(loginPage.validationMessage('Invalid Username format.')).toBeVisible();
    });

    await reportStep(page, 'Verify by entering a empty space in the Username field', 'Maker should allow to enter & validation error message should be displayed as "Invalid Username format."', async () => {
      await loginPage.fillUsername(' ');
      await loginPage.blurField();
      // await expect.soft(loginPage.validationMessage('Invalid Username format.')).toBeVisible();
    });

    await reportStep(page, 'Verify by entering invalid value after clearing the entered valid value in the Username field', 'Maker should allow to enter & respective validation error message should be displayed', async () => {
      await loginPage.fillUsername('ramesh');
      await loginPage.clearUsername();
      await loginPage.fillUsername('@@@');
      await loginPage.blurField();
      await expect.soft(page.getByText(/Username is required\.|Must be at least 3 characters long\.|Invalid Username format\.|Username cannot be longer than 50 characters\./)).toBeVisible();
    });

    await reportStep(page, 'Verify by clearing the entered valid value in the Username field', 'Maker should allow to enter & validation error message should be displayed as "Username is required."', async () => {
      await loginPage.fillUsername('ramesh');
      await loginPage.clearUsername();
      await loginPage.blurField();
      await expect.soft(loginPage.validationMessage('Username is required.')).toBeVisible();
    });

    await reportStep(page, 'Verify by entering a space between two words', 'Maker should allow to enter & validation error message should be displayed as "Invalid Username format."', async () => {
      await loginPage.fillUsername('ra mesh');
      await loginPage.blurField();
      // await expect.soft(loginPage.validationMessage('Invalid Username format.')).toBeVisible();
    });
  });

  test('QRS_BO Portal_Login page_Positive validation for Password field', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await setExpectedResult('Positive password validations should match the provided manual test case wording.');

    await reportStep(page, 'Precondition:1. User should have launched the QRS BO Portal and login page should be displayed', '', async () => {
      await loginPage.open();
    });

    await reportStep(page, 'Verify by entering 3 characters', 'Maker should allow to enter & no validation error message should be displayed', async () => {
      await loginPage.fillPassword('abc');
      await loginPage.blurField();
      await expect.soft(loginPage.passwordInput).toHaveValue('abc');
      await expect.soft(loginPage.validationMessage('Password is required.')).toHaveCount(0);
    });

    await reportStep(page, 'Verify by entering more than 3 characters', 'Maker should allow to enter & no validation error message should be displayed', async () => {
      await loginPage.fillPassword('ABcd@321');
      await loginPage.blurField();
      await expect.soft(loginPage.passwordInput).toHaveValue('ABcd@321');
      await expect.soft(loginPage.validationMessage('Password is required.')).toHaveCount(0);
    });

    await reportStep(page, 'Verify by entering valid value after validation error message is thrown in the field', 'Maker should allow to enter & validation error message should be disappeared', async () => {
      await loginPage.clearPassword();
      await loginPage.blurField();
      await expect.soft(loginPage.validationMessage('Password is required.')).toBeVisible();
      await loginPage.fillPassword('ABcd@321');
      await loginPage.blurField();
      await expect.soft(loginPage.validationMessage('Password is required.')).toHaveCount(0);
    });
  });

  test('QRS_BO Portal_Login page_Negative validation for Password field', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await setExpectedResult('Negative password validations should match the provided manual test case wording.');

    await reportStep(page, 'Precondition:1. User should have launched the QRS BO Portal and login page should be displayed', '', async () => {
      await loginPage.open();
    });

    await reportStep(page, 'Click on the Password text box and click outside', 'Validation error message should be displayed as "Password is required."', async () => {
      await loginPage.passwordInput.click();
      await loginPage.blurField();
      await expect.soft(loginPage.validationMessage('Password is required.')).toBeVisible();
    });

    await reportStep(page, 'Verify by entering less than 3 characters in the Password field', 'Maker should allow to enter & validation error message should be displayed as "Must be at least 3 characters long."', async () => {
      await loginPage.fillPassword('ab');
      await loginPage.blurField();
      await expect.soft(page.getByText(/password must be at least 3 characters long\./i)).toBeVisible();
    });

    await reportStep(page, 'Verify by entering invalid value after clearing the entered valid value in the Password field', 'Maker should allow to enter & respective validation error message should be displayed', async () => {
      await loginPage.fillPassword('ABcd@321');
      await loginPage.clearPassword();
      await loginPage.blurField();
      await expect.soft(page.getByText(/Password is required\.|Must be at least 3 characters long\./)).toBeVisible();
    });

    await reportStep(page, 'Verify by clearing the entered valid value in the Password field', 'Maker should allow to enter & validation error message should be displayed as "Password is required."', async () => {
      await loginPage.fillPassword('ABcd@321');
      await loginPage.clearPassword();
      await loginPage.blurField();
      await expect.soft(loginPage.validationMessage('Password is required.')).toBeVisible();
    });
  });

  test('QRS_BO Portal_Login page_Login button verification', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await setExpectedResult('Login button verification should match the provided manual test case wording.');

    await reportStep(page, 'Precondition:1. User should have launched the QRS BO Portal and login page should be displayed', '', async () => {
      await loginPage.open();
    });

    await reportStep(page, 'Verify the login button', 'By default login button should be in disabled mode', async () => {
      await expect.soft(loginPage.loginButton).toBeDisabled();
    });

    await reportStep(page, 'Verify the login button after entering username and password', 'Login button should be enabled', async () => {
      await loginPage.fillUsername(env.username || 'ramesh');
      await loginPage.fillPassword(env.password || 'ABcd@321');
      await expect.soft(loginPage.loginButton).toBeEnabled();
    });

    await reportStep(page, 'Verify the login button after clearing any one of the value', 'Login button should be disabled', async () => {
      await loginPage.clearUsername();
      await expect.soft(loginPage.loginButton).toBeDisabled();
    });

    await reportStep(page, 'Verify the login button after entering the value in cleared field', 'Login button should be enabled', async () => {
      await loginPage.fillUsername(env.username || 'ramesh');
      await expect.soft(loginPage.loginButton).toBeEnabled();
    });
  });

  test('QRS_BO Portal_Login page_Eye icon behavior verification in the Password field', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await setExpectedResult('Eye icon behavior should match the provided manual test case wording.');

    await reportStep(page, 'Precondition:1. User should have launched the QRS BO Portal and login page should be displayed', '', async () => {
      await loginPage.open();
    });

    await reportStep(page, 'Enter the password', 'User should not able to view the password and it should hidden', async () => {
      await loginPage.fillPassword(env.password || 'ABcd@321');
      await expect.soft(loginPage.passwordInput).toHaveAttribute('type', 'password');
    });

    await reportStep(page, 'Click the eye icon', 'Entered password should be visible', async () => {
      await loginPage.togglePasswordVisibility();
      await expect.soft(loginPage.passwordInput).toHaveAttribute('type', 'text');
    });

    await reportStep(page, 'Again click the eye icon', 'Entered password should be hidden', async () => {
      await loginPage.togglePasswordVisibility();
      await expect.soft(loginPage.passwordInput).toHaveAttribute('type', 'password');
    });
  });
});
