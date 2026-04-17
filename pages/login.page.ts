import { expect, Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly passwordToggleButton: Locator;
  readonly loginButton: Locator;
  readonly brandingTitle: Locator;
  readonly brandingDescription: Locator;
  readonly loginSectionTitle: Locator;
  readonly loginSectionSubtitle: Locator;

  constructor(private readonly page: Page) {
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password-input');
    this.passwordToggleButton = page.locator('button[type="button"]').first();
    this.loginButton = page.getByRole('button', { name: /login|log in|sign in/i });
    this.brandingTitle = page.getByText('QRS System', { exact: true }).first();
    this.brandingDescription = page.getByText(/The QR Settlement system facilitates seamless integration/i);
    this.loginSectionTitle = page.getByText(/^Log In$/).first();
    this.loginSectionSubtitle = page.getByText(/to continue using QRS System/i);
  }

  async open() {
    await this.page.goto('/');
    await expect(this.usernameInput).toBeVisible();
  }

  async fillUsername(username: string) {
    await this.usernameInput.fill(username);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async clearUsername() {
    await this.usernameInput.fill('');
  }

  async clearPassword() {
    await this.passwordInput.fill('');
  }

  async blurField() {
    await this.page.locator('body').click({ position: { x: 10, y: 10 } });
  }

  async login(username: string, password: string) {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.loginButton.click();
  }

  async togglePasswordVisibility() {
    await this.passwordToggleButton.click();
  }

  validationMessage(message: string | RegExp) {
    return typeof message === 'string'
      ? this.page.getByText(message, { exact: true })
      : this.page.getByText(message);
  }

  async expectLoginFormVisible() {
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }
}
