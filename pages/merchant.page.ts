import { expect, Locator, Page } from '@playwright/test';

export type MerchantRecord = {
  merchantIdOption: string; // The ID to select from ng-select
  businessSector: string;
  otherBusinessSector?: string; // Required when businessSector is 'Others'
  qrsMerchantName: string;
  brn: string;
  outletId: string;
  outletName: string;
  cashierName: string;
  cashierIds: string[];
  bankName: string;
  accountName: string;
  accountNumber: string;
  paymentType: string;
  recipientIdType: string;
  recipientIdDetails: string;
  recipientPhone: string;
  recipientEmail: string;
  status?: string; // 'Active' | 'Inactive' — defaults to 'Active' if not provided
};

export class MerchantPage {
  readonly setupMenu: Locator;
  readonly merchantManagementLink: Locator;
  readonly merchantTab: Locator;
  readonly reviewTab: Locator;
  readonly historyTab: Locator;
  readonly liveTab: Locator;
  readonly createMerchantButton: Locator;
  readonly createButton: Locator;
  readonly approveButton: Locator;
  readonly userMenuButton: Locator;
  readonly logoutLink: Locator;

  constructor(private readonly page: Page) {
    this.setupMenu = page.getByRole('link', { name: /setup/i }).first();
    this.merchantManagementLink = page.getByRole('link', { name: /merchant management/i });
    this.merchantTab = page.locator('li, [role="tab"], .nav-link').getByText('Merchant', { exact: true }).first();
    this.liveTab = page.getByText('Live', { exact: true });
    this.reviewTab = page.getByText('Review', { exact: true });
    this.historyTab = page.getByText('History', { exact: true });
    this.createMerchantButton = page.getByRole('button', { name: /Create Merchant/i });
    this.createButton = page.getByRole('button', { name: /^create$/i });
    this.approveButton = page.getByRole('button', { name: /^approve$/i });
    this.userMenuButton = page.getByRole('button', { name: /header avatar|avatar/i });
    this.logoutLink = page.getByRole('link', { name: /logout/i });
  }

  async openMerchantManagement() {
    await this.setupMenu.click();
    await this.merchantManagementLink.click();
  }

  async logout() {
    await this.userMenuButton.click();
    await this.logoutLink.click();
  }

  async openCreateMerchantForm() {
    await this.openMerchantManagement();
    await this.merchantTab.click();
    await expect(this.createMerchantButton).toBeVisible();
    await this.createMerchantButton.click();
  }

  async createMerchant(record: MerchantRecord) {
    // Merchant ID — select from ng-select dropdown
    await this.page.locator('ng-select[placeholder="Select Merchant ID"]').getByRole('textbox').click();
    await this.page.getByRole('option', { name: record.merchantIdOption }).first().click();

    // Business Sector — target by ID to avoid ambiguity
    await this.page.locator('#businessSector').getByRole('textbox').click();
    await this.page.getByRole('option', { name: new RegExp(record.businessSector, 'i') }).first().click();
    // If 'Others' selected, the sub-field 'Other Business Sector / Industry' becomes required
    if (/others/i.test(record.businessSector) && record.otherBusinessSector) {
      await this.page.getByRole('textbox', { name: /other business sector/i }).fill(record.otherBusinessSector);
      await this.page.getByRole('textbox', { name: /other business sector/i }).press('Tab');
    }

    // Details
    await this.page.getByRole('textbox', { name: /qrs merchant name/i }).fill(record.qrsMerchantName);
    await this.page.getByRole('textbox', { name: /qrs merchant name/i }).press('Tab');

    await this.page.getByRole('textbox', { name: /^enter brn$/i }).fill(record.brn);
    await this.page.getByRole('textbox', { name: /^enter brn$/i }).press('Tab');

    await this.page.getByRole('textbox', { name: /outlet id/i }).fill(record.outletId);
    await this.page.getByRole('textbox', { name: /outlet id/i }).press('Tab');

    await this.page.getByRole('textbox', { name: /outlet name/i }).fill(record.outletName);
    await this.page.getByRole('textbox', { name: /outlet name/i }).press('Tab');

    await this.page.getByRole('textbox', { name: /cashier name/i }).fill(record.cashierName);
    await this.page.getByRole('textbox', { name: /cashier name/i }).press('Tab');

    // Cashier IDs
    for (const cid of record.cashierIds) {
      await this.page.getByRole('textbox', { name: /add cashier id/i }).fill(cid);
      await this.page.getByRole('textbox', { name: /add cashier id/i }).press('Enter');
    }

    // Bank — target specifically by the placeholder 'Search by Bank Name or BIC Code'
    const bankSelect = this.page.locator('ng-select[placeholder="Search by Bank Name or BIC Code"]');
    await bankSelect.getByRole('textbox').click();
    await this.page.getByRole('option', { name: new RegExp(record.bankName, 'i') }).first().click();

    await this.page.getByRole('textbox', { name: /account name/i }).fill(record.accountName);
    await this.page.getByRole('textbox', { name: /account name/i }).press('Tab');

    await this.page.getByRole('textbox', { name: /account number/i }).fill(record.accountNumber);
    await this.page.getByRole('textbox', { name: /account number/i }).press('Tab');

    // Recipient Info — combobox[3]=AccountType, combobox[4]=RecipientIDType, combobox[5]=Status
    await this.page.getByRole('combobox').nth(3).selectOption(record.paymentType);
    await this.page.getByRole('combobox').nth(4).selectOption(record.recipientIdType);
    await this.page.getByRole('textbox', { name: /recipient id details/i }).fill(record.recipientIdDetails);
    await this.page.getByRole('textbox', { name: /recipient id details/i }).press('Tab');

    await this.page.getByRole('textbox', { name: /recipient phone/i }).fill(record.recipientPhone);
    await this.page.getByRole('textbox', { name: /recipient phone/i }).press('Tab');

    await this.page.getByRole('textbox', { name: /recipient email/i }).fill(record.recipientEmail);
    await this.page.getByRole('textbox', { name: /recipient email/i }).press('Tab');

    // Status — reads from Excel column 'status', defaults to 'Active'
    await this.page.getByRole('combobox').nth(5).selectOption(record.status || 'Active');

    await this.createButton.click();
  }

  async setupReviewTableBatch() {
    await this.openMerchantManagement();
    await this.merchantTab.click();
    await this.reviewTab.click();

    // 1. Set items per page to 100 to minimize pagination flipping
    const pageSizeSelect = this.page.locator('select').filter({ hasText: /100 per page/i });
    if (await pageSizeSelect.isVisible()) {
      const currentVal = await pageSizeSelect.inputValue();
      if (currentVal !== '100') {
        await pageSizeSelect.selectOption('100');
        await this.page.waitForTimeout(2000); // Increased wait for full batch load
      }
    }

    // 2. Sort by "Last Modified On" descending (newest first)
    const dateHeader = this.page.locator('th').filter({ hasText: /Last Modified On/i });
    await dateHeader.click();
    await this.page.waitForTimeout(1000);
    // Click again to ensure descending order
    await dateHeader.click();
    await this.page.waitForTimeout(2000);
  }

  async clickEyeIcon(outletId: string) {
    // Robust exact match in any cell of the row
    const row = this.page.locator('table tbody tr').filter({
      has: this.page.locator('td', { hasText: new RegExp(`^${outletId}$`, 'i') })
    }).first();

    if (await row.isVisible()) {
      const eyeIcon = row.locator('button.btn-outline-primary').first();
      await eyeIcon.click();
    } else {
      throw new Error(`Outlet ID ${outletId} not found on the current table page.`);
    }
  }

  async openReviewRow(outletId: string) {
    await this.setupReviewTableBatch();
    await this.clickEyeIcon(outletId);
  }

  successMessage() {
    // Toasts disappear quickly — target the container which persists
    return this.page.locator('.toast-container');
  }
}
