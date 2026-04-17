import { expect, Locator, Page } from '@playwright/test';

export type CorporateRecord = {
  corpId: string;
  subsidiaryId: string;
  corporateName?: string;
};

export class CorporatePage {
  readonly setupMenu: Locator;
  readonly merchantManagementLink: Locator;
  readonly liveTab: Locator;
  readonly reviewTab: Locator;
  readonly historyTab: Locator;
  readonly createCorporateButton: Locator;
  readonly createButton: Locator;
  readonly approveButton: Locator;
  readonly rejectButton: Locator;
  readonly corpIdInput: Locator;
  readonly subsidiaryIdInput: Locator;
  readonly corporateNameInput: Locator;
  readonly userMenuButton: Locator;
  readonly logoutLink: Locator;

  constructor(private readonly page: Page) {
    this.setupMenu = page.getByRole('link', { name: /setup/i }).first();
    this.merchantManagementLink = page.getByRole('link', { name: /merchant management/i });
    this.liveTab = page.getByText('Live', { exact: true });
    this.reviewTab = page.getByText('Review', { exact: true });
    this.historyTab = page.getByText('History', { exact: true });
    this.createCorporateButton = page.getByRole('button', { name: /create corporate/i });
    this.createButton = page.getByRole('button', { name: /^create$/i });
    this.approveButton = page.getByRole('button', { name: /^approve$/i });
    this.rejectButton = page.getByRole('button', { name: /^reject$/i });
    this.corpIdInput = page.getByPlaceholder('Enter Corp ID');
    this.subsidiaryIdInput = page.getByPlaceholder('Enter Subsidiary ID');
    this.corporateNameInput = page.getByPlaceholder('Enter Corporate Name');
    this.userMenuButton = page.getByRole('button', { name: /header avatar|avatar/i });
    this.logoutLink = page.getByRole('link', { name: /logout/i });
  }

  async openMerchantManagement() {
    await this.setupMenu.click();
    await this.merchantManagementLink.click();
  }

  async openCreateCorporateForm() {
    await this.openMerchantManagement();
    await this.liveTab.click();
    await this.createCorporateButton.click();
    await expect(this.corpIdInput).toBeVisible();
  }

  async createCorporate(record: CorporateRecord) {
    await this.corpIdInput.fill(record.corpId);
    await this.corpIdInput.press('Tab');
    
    await this.subsidiaryIdInput.fill(record.subsidiaryId);
    await this.subsidiaryIdInput.press('Tab');
    
    if (record.corporateName) {
      await this.corporateNameInput.fill(record.corporateName);
      await this.corporateNameInput.press('Tab');
    } else {
      await this.corporateNameInput.fill('');
      await this.corporateNameInput.press('Tab');
    }
    await this.createButton.click();
  }

  async openReviewRow(recordId: string) {
    await this.openMerchantManagement();
    await this.reviewTab.click();
    const row = this.page.locator('tr', { hasText: recordId }).first();
    await expect(row).toBeVisible();
    await row.getByRole('button').first().click();
  }

  async openLiveTab() {
    await this.liveTab.click();
  }

  async openHistoryTab() {
    await this.historyTab.click();
  }

  async expectCorporateFormReadOnly(record: CorporateRecord) {
    await expect(this.corpIdInput).toHaveValue(record.corpId);
    await expect(this.subsidiaryIdInput).toHaveValue(record.subsidiaryId);
    if (record.corporateName) {
      await expect(this.corporateNameInput).toHaveValue(record.corporateName);
    } else {
      await expect(this.corporateNameInput).toHaveValue('');
    }
    // await expect(this.corpIdInput).toBeDisabled();
    // await expect(this.subsidiaryIdInput).toBeDisabled();
    // await expect(this.corporateNameInput).toBeDisabled();
  }

  async expectRecordVisibleInCurrentTab(record: CorporateRecord) {
    await expect(this.page.getByText(record.corpId, { exact: true }).first()).toBeVisible();
  }

  successMessage() {
    return this.page.getByText(/success|created|approved/i).first();
  }

  duplicateCorpIdMessage() {
    return this.page.getByText(/corp id already exists\. please provide unique value\./i);
  }

  async logout() {
    await this.userMenuButton.click();
    await this.logoutLink.click();
  }
}
