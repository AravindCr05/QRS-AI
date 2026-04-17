import { expect, Locator, Page } from '@playwright/test';

export type PosRecord = {
  corpId: string; // The parent corp ID text to select
  icaAccount: string;
  channelId: string;
  merchantId: string;
  reflexMerchantName: string;
  posPartnerBrn: string;
  posAccountName: string;
  posName: string;
  posPhone: string;
  posEmail: string;
  profitSharingAccount: string;
  profitSharingRatio: string;
  merchantChargesPackage: string;
  inputDirectory: string;
  outputDirectory: string;
  statementDirectory: string;
  status?: string; // 'Active' | 'Inactive' — defaults to 'Active' if not provided
};

export class PosPage {
  readonly setupMenu: Locator;
  readonly merchantManagementLink: Locator;
  readonly posTab: Locator;
  readonly reviewTab: Locator;
  readonly historyTab: Locator;
  readonly liveTab: Locator;
  readonly createPosButton: Locator;
  readonly createButton: Locator;
  readonly approveButton: Locator;
  readonly rejectButton: Locator;
  readonly userMenuButton: Locator;
  readonly logoutLink: Locator;

  constructor(private readonly page: Page) {
    this.setupMenu = page.getByRole('link', { name: /setup/i }).first();
    this.merchantManagementLink = page.getByRole('link', { name: /merchant management/i });
    this.posTab = page.locator('li, [role="tab"], .nav-link').getByText('POS', { exact: true }).first();
    this.liveTab = page.getByText('Live', { exact: true });
    this.reviewTab = page.getByText('Review', { exact: true });
    this.historyTab = page.getByText('History', { exact: true });
    this.createPosButton = page.getByRole('button', { name: /Create POS/i });
    this.createButton = page.getByRole('button', { name: /^create$/i });
    this.approveButton = page.getByRole('button', { name: /^approve$/i });
    this.rejectButton = page.getByRole('button', { name: /^reject$/i });
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

  async openCreatePosForm() {
    await this.openMerchantManagement();
    await this.posTab.click();
    await expect(this.createPosButton).toBeVisible();
    await this.createPosButton.click();
  }

  async createPos(record: PosRecord) {
    // Select Corp ID — use regex to handle leading/trailing spaces in dropdown options
    await this.page.locator('ng-select').getByRole('textbox').click();
    await this.page.getByRole('option', { name: new RegExp(`\\b${record.corpId}\\b`) }).first().click();

    // POS mandatory + optional fields
    await this.page.getByRole('textbox', { name: 'Enter ICA Account' }).fill(record.icaAccount);
    await this.page.getByRole('textbox', { name: 'Enter ICA Account' }).press('Tab');

    await this.page.getByRole('textbox', { name: 'Enter Channel ID' }).fill(record.channelId);
    await this.page.getByRole('textbox', { name: 'Enter Channel ID' }).press('Tab');

    await this.page.getByRole('textbox', { name: 'Enter Merchant ID' }).fill(record.merchantId);
    await this.page.getByRole('textbox', { name: 'Enter Merchant ID' }).press('Tab');

    await this.page.getByRole('textbox', { name: 'Enter Reflex Merchant Name' }).fill(record.reflexMerchantName);
    await this.page.getByRole('textbox', { name: 'Enter Reflex Merchant Name' }).press('Tab');

    await this.page.getByRole('textbox', { name: 'Enter POS Partner BRN' }).fill(record.posPartnerBrn);
    await this.page.getByRole('textbox', { name: 'Enter POS Partner BRN' }).press('Tab');

    await this.page.getByRole('textbox', { name: 'Enter POS Account Name' }).fill(record.posAccountName);
    await this.page.getByRole('textbox', { name: 'Enter POS Account Name' }).press('Tab');

    await this.page.getByRole('textbox', { name: 'Enter POS Name' }).fill(record.posName);
    await this.page.getByRole('textbox', { name: 'Enter POS Name' }).press('Tab');

    await this.page.getByRole('textbox', { name: 'Enter POS Phone' }).fill(record.posPhone);
    await this.page.getByRole('textbox', { name: 'Enter POS Phone' }).press('Tab');

    await this.page.getByRole('textbox', { name: /Enter POS Email/i }).fill(record.posEmail);
    await this.page.getByRole('textbox', { name: /Enter POS Email/i }).press('Tab');

    await this.page.getByRole('textbox', { name: 'Enter Profit Sharing Account Number' }).fill(record.profitSharingAccount);
    await this.page.getByRole('textbox', { name: 'Enter Profit Sharing Account Number' }).press('Tab');

    await this.page.getByRole('textbox', { name: 'Profit Sharing Ratio (%) *' }).fill(record.profitSharingRatio);
    await this.page.getByRole('textbox', { name: 'Profit Sharing Ratio (%) *' }).press('Tab');

    await this.page.getByRole('textbox', { name: 'Merchant Charges Package (%) *' }).fill(record.merchantChargesPackage);
    await this.page.getByRole('textbox', { name: 'Merchant Charges Package (%) *' }).press('Tab');

    await this.page.getByRole('textbox', { name: 'Enter Input Directory' }).fill(record.inputDirectory);
    await this.page.getByRole('textbox', { name: 'Enter Input Directory' }).press('Tab');

    await this.page.getByRole('textbox', { name: 'Enter Output Directory' }).fill(record.outputDirectory);
    await this.page.getByRole('textbox', { name: 'Enter Output Directory' }).press('Tab');

    await this.page.getByRole('textbox', { name: 'Enter Statement Directory' }).fill(record.statementDirectory);
    await this.page.getByRole('textbox', { name: 'Enter Statement Directory' }).press('Tab');

    // Status — reads from Excel column 'status', defaults to 'Active'
    await this.page.locator('select').selectOption(record.status || 'Active');

    await this.createButton.click();
  }


  async openReviewRow(merchantId: string) {
    await this.openMerchantManagement();
    await this.posTab.click();
    await this.reviewTab.click();
    const row = this.page.locator('tr', { hasText: merchantId }).first();
    // Eye icon is btn[0] (outline-primary), danger/reject is btn[1]
    const eyeIcon = row.locator('button.btn-outline-primary').first();
    await eyeIcon.click();
  }

  successMessage() {
    // Toasts disappear quickly — target the container which persists
    return this.page.locator('.toast-container');
  }
}
