import { expect, Locator, Page } from '@playwright/test';

export class QRTransactionPage {
  readonly reportsMenu: Locator;
  readonly transactionMenu: Locator;
  readonly qrTransactionMenu: Locator;
  
  readonly summaryTab: Locator;
  readonly detailTab: Locator;

  readonly searchButton: Locator;
  readonly clearButton: Locator;

  constructor(private readonly page: Page) {
    this.reportsMenu = page.locator('a.nav-link.dropdown-toggle', { hasText: 'Reports' }).first();
    this.transactionMenu = page.getByText('Transaction', { exact: true }).first();
    this.qrTransactionMenu = page.getByRole('link', { name: 'QR Transaction' });
    
    // We can rely on tabs text
    this.summaryTab = page.getByText('Summary', { exact: true });
    this.detailTab = page.getByText('Detail', { exact: true });

    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.clearButton = page.getByRole('button', { name: 'Clear' });
  }

  async navigateTo() {
    await this.reportsMenu.click();
    await this.transactionMenu.click();
    await this.qrTransactionMenu.click();
    await expect(this.page).toHaveURL(/.*qr-transaction-report/);
  }

  async searchSummaryByMerchantID(merchantId: string) {
    await this.summaryTab.click();
    // Assuming placeholder 'Enter Merchant ID'
    for (const input of await this.page.locator('input').all()) {
        const placeholder = await input.getAttribute('placeholder');
        if (placeholder && placeholder.includes('Merchant ID')) {
            await input.fill(merchantId);
            break;
        }
    }
    await this.searchButton.click();
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000); // Allow UI to settle
  }

  async searchDetailByTransactionRef(txnRefNum: string) {
    await this.detailTab.click();
    for (const input of await this.page.locator('input').all()) {
        const placeholder = await input.getAttribute('placeholder');
        if (placeholder && placeholder.includes('Transaction Reference Number')) {
            await input.fill(txnRefNum);
            break;
        }
    }
    await this.searchButton.click();
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000); // Allow UI to settle
  }

  async findRowByText(text: string) {
    return this.page.locator('tbody tr', { hasText: text }).first();
  }

  async verifyRowContains(row: Locator, expectedText: string) {
    await expect(row).toContainText(expectedText);
  }
}
