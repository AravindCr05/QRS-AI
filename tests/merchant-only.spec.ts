import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { MerchantPage, MerchantRecord } from '../pages/merchant.page';
import { env } from '../utils/env';

test('Manual Merchant Creation Path', async ({ page }) => {
  test.setTimeout(240_000);

  const suffix = Date.now().toString().slice(-6);
  const record: MerchantRecord = {
    merchantIdOption: 'RHBQR170406',
    businessSector: 'Others',
    otherBusinessSector: 'Automation Test',
    qrsMerchantName: `QMN${suffix}`,
    brn: `BRN${suffix}`,
    outletId: `OI${suffix.padStart(7, '0')}`,
    outletName: `ON${suffix}`,
    cashierName: `CN${suffix}`,
    cashierIds: [`CI${suffix}`],
    bankName: 'RHB',
    accountName: `AN${suffix}`,
    accountNumber: `1704202601${suffix}`,
    paymentType: '02',
    recipientIdType: '02',
    recipientIdDetails: `RI${suffix}`,
    recipientPhone: '9876789023',
    recipientEmail: `rec${suffix}@autotest.com`,
    status: 'Active',
  };

  const loginPage = new LoginPage(page);
  const merchantPage = new MerchantPage(page);

  console.log('>>> LANDING ON LOGIN PAGE');
  await page.goto(env.baseUrl);
  await loginPage.login(env.makerUsername, env.makerPassword);
  console.log('>>> LOGGED IN SUCCESSFULLY');

  console.log(`>>> CREATING MERCHANT FOR POS ${record.merchantIdOption}: ${record.outletId}`);
  await merchantPage.openCreateMerchantForm();
  await merchantPage.createMerchant(record);
  console.log('>>> MERCHANT CREATED AND SUBMITTED FOR REVIEW');
  await merchantPage.logout();

  console.log(`>>> CHECKER APPROVING MERCHANT: ${record.outletId}`);
  await page.goto(env.baseUrl);
  await loginPage.login(env.checkerUsername, env.checkerPassword);
  await merchantPage.openReviewRow(record.outletId);
  await merchantPage.approveButton.click();
  await merchantPage.liveTab.click();
  await page.getByRole('textbox', { name: /^Outlet ID$/i }).fill(record.outletId);
  await page.getByRole('button', { name: /Search/i }).click();
  await expect(page.locator('table tbody tr').filter({ hasText: record.outletId }).first()).toBeVisible({
    timeout: 15000,
  });
  await merchantPage.logout();
  console.log('>>> MERCHANT APPROVED SUCCESSFULLY');
});
