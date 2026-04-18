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
    console.log('    [Nav] Clicking Setup Arrow (󰅀)...');
    // The arrow is part of the Setup link text or a sibling icon
    await this.page.locator('a:has-text("Setup"), a:has-text("󰅀")').first().click();
    await this.page.waitForTimeout(1000);

    console.log('    [Nav] Clicking Merchant Management...');
    await this.page.getByRole('link', { name: /Merchant Management/i }).click();
    await this.page.waitForTimeout(1000);
  }

  async logout() {
    // Wait for success toast to vanish so it doesn't block the profile menu
    const toast = this.successMessage();
    if (await toast.isVisible()) {
        await toast.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    }
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

    // Recipient Info — SAFE DIRECT INJECTION (With Waiting)
    const injectSelect = async (formControlName: string, value: string, label: string) => {
        console.log(`    [Form] Injecting ${label} -> ${value}`);
        const sel = `select[formcontrolname="${formControlName}"]`;
        
        try {
            // Wait for the native selector to be part of the DOM
            await this.page.waitForSelector(sel, { state: 'attached', timeout: 5000 });
            
            await this.page.evaluate(({ s, v }) => {
                const el = document.querySelector(s) as HTMLSelectElement;
                if (el) {
                    el.value = v;
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('blur', { bubbles: true }));
                }
            }, { s: sel, v: value });
        } catch (e) {
            console.log(`    [Error] Could not find ${label} field within 5s.`);
            // Fallback: take a screenshot to see why it's missing
            await this.page.screenshot({ path: `missing_${label}.png` });
        }
        
        await this.page.waitForTimeout(500);
    };

    // Hide the floating header SAFELY (only for problematic forms)
    await this.page.evaluate(() => {
        const header = document.querySelector('app-header, .header-container, nav');
        if (header) (header as HTMLElement).style.visibility = 'hidden'; 
    });

    await injectSelect('inputAccountType', record.paymentType, 'Account Type');
    await injectSelect('recipientIdType', record.recipientIdType, 'Recipient ID Type');
    
    await this.page.getByRole('textbox', { name: /recipient id details/i }).fill(record.recipientIdDetails);
    await this.page.getByRole('textbox', { name: /recipient id details/i }).press('Tab');

    await this.page.getByRole('textbox', { name: /recipient phone/i }).fill(record.recipientPhone);
    await this.page.getByRole('textbox', { name: /recipient phone/i }).press('Tab');

    await this.page.getByRole('textbox', { name: /recipient email/i }).fill(record.recipientEmail);
    await this.page.getByRole('textbox', { name: /recipient email/i }).press('Tab');

    // Status — use same hybrid logic
    console.log(`    [Form] Selecting Status...`);
    await selectDropdown('Status', record.status === 'Inactive' ? 'Inactive' : 'Active', record.status || 'Active');

    await this.createButton.click();
  }

  async setupReviewTableBatch() {
    await this.openMerchantManagement();
    await this.merchantTab.click();
    
    // PERSISTENT TAB SWITCHING
    console.log('    [Approval] Switching to Review tab...');
    for (let i = 0; i < 5; i++) {
        await this.reviewTab.click();
        await this.page.waitForTimeout(2000);
        // On Review tab, the search boxes should be present and the "Create" button hidden
        if (!(await this.createMerchantButton.isVisible())) {
            break;
        }
    }
    
    // 1. Click "Merchant" module filter
    const merchantFilterBtn = this.page.getByRole('button', { name: /^Merchant$/i });
    if (await merchantFilterBtn.isVisible()) {
      await merchantFilterBtn.click();
      await this.page.waitForTimeout(1000);
    }
  }

  async clickEyeIcon(outletId: string) {
    console.log(`    [Search] Filtering Review table for Outlet ID: ${outletId}`);
    
    // Use the Search Filter boxes rather than pagination
    const outletIdFilter = this.page.locator('input[placeholder="Enter Outlet ID"]').first();
    await outletIdFilter.fill(outletId);
    
    const searchBtn = this.page.getByRole('button', { name: /Search/i }).first();
    await searchBtn.click();
    await this.page.waitForTimeout(3000);
    
    const row = this.page.locator('table tbody tr').filter({
        has: this.page.locator('td', { hasText: new RegExp(`^\\s*${outletId}\\s*$`) })
    }).first();

    if (!(await row.isVisible())) {
       // Backup search: sometimes the ID might be in Merchant ID column or combined
       const fallbackRow = this.page.locator('table tbody tr').filter({ hasText: outletId }).first();
       if (await fallbackRow.isVisible()) {
           const eyeIcon = fallbackRow.locator('button.btn-outline-primary').first();
           await eyeIcon.click();
           return;
       }
       throw new Error(`Outlet ID ${outletId} not found in Review table after filtering.`);
    }

    const eyeIcon = row.locator('button.btn-outline-primary').first();
    await eyeIcon.scrollIntoViewIfNeeded();
    await eyeIcon.click({ force: true });
  }

  async openReviewRow(outletId: string) {
    await this.setupReviewTableBatch();
    await this.clickEyeIcon(outletId);
  }

  async getLiveMerchantName(merchantId: string, outletId: string): Promise<string> {
    console.log(`    [Live] Navigating to Merchant tab for ${merchantId} / ${outletId}...`);
    await this.openMerchantManagement();
    await this.merchantTab.click();
    await this.liveTab.click();
    await this.page.waitForTimeout(1000);

    console.log(`    [Live] Searching for Merchant ID: ${merchantId}, Outlet ID: ${outletId}`);
    // Use role-based or label-based locators for higher accuracy
    await this.page.locator('div.col-12', { hasText: 'Merchant ID' }).locator('input').fill(merchantId);
    await this.page.locator('div.col-12', { hasText: 'Outlet ID' }).locator('input').fill(outletId);
    await this.page.getByRole('button', { name: /search/i }).click();
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(2000);

    console.log(`    [Live] Clicking eye icon for Merchant...`);
    // Filter by both to be absolutely sure
    const row = this.page.locator('table tbody tr').filter({ hasText: merchantId }).filter({ hasText: outletId }).first();
    const eyeIcon = row.locator('button.btn-outline-primary').first();
    await eyeIcon.click();
    
    console.log(`    [Live] Waiting for Merchant view modal...`);
    const nameInput = this.page.locator('input[formcontrolname="qrsMerchantName"]');
    await expect(nameInput).toBeVisible({ timeout: 15000 });
    const merchantName = await nameInput.inputValue();
    console.log(`    [Live] Extracted Merchant Name: ${merchantName}`);
    
    // Close modal
    const cancelBtn = this.page.getByRole('button', { name: /cancel|close/i }).last();
    if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
    } else {
        await this.page.keyboard.press('Escape');
    }
    
    await expect(nameInput).toBeHidden({ timeout: 5000 });
    return merchantName;
  }

  async getLivePosIcaAccount(merchantId: string): Promise<string> {
    console.log(`    [Live] Navigating to POS tab for ${merchantId}...`);
    if (!this.page.url().includes('setup/merchant-setup')) {
        await this.openMerchantManagement();
    }

    // Better locator for POS tab
    const posTab = this.page.getByText('POS', { exact: true });
    await posTab.click();
    await this.liveTab.click();
    await this.page.waitForTimeout(1000);

    console.log(`    [Live] Searching for Merchant ID: ${merchantId} in POS tab`);
    const searchInput = this.page.locator('input[placeholder*="Merchant ID"]').first();
    await searchInput.fill(merchantId);
    await this.page.getByRole('button', { name: /search/i }).click();
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(2000);

    console.log(`    [Live] Clicking eye icon for POS...`);
    const row = this.page.locator('table tbody tr').filter({ hasText: merchantId }).first();
    const eyeIcon = row.locator('button.btn-outline-primary').first();
    await eyeIcon.click();
    
    console.log(`    [Live] Waiting for POS view modal...`);
    const icaInput = this.page.locator('input[formcontrolname="icaAccount"]');
    await expect(icaInput).toBeVisible({ timeout: 15000 });
    const icaAccount = await icaInput.inputValue();
    console.log(`    [Live] Extracted ICA Account: ${icaAccount}`);
    
    // Close modal
    const cancelBtn = this.page.getByRole('button', { name: /cancel|close/i }).last();
    if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
    } else {
        await this.page.keyboard.press('Escape');
    }
    
    await expect(icaInput).toBeHidden({ timeout: 5000 });
    return icaAccount;
  }

  successMessage() {
    // Specifically target successful toasts to distinguish from error toasts
    return this.page.locator('.toast-container .toast-success');
  }
}
