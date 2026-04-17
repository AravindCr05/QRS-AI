import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { CorporatePage, CorporateRecord } from '../pages/corporate.page';
import { PosPage, PosRecord } from '../pages/pos.page';
import { MerchantPage, MerchantRecord } from '../pages/merchant.page';
import { env } from '../utils/env';
import { reportStep, setExpectedResult } from '../utils/reporting';
import { readExcelSheet } from '../utils/excel-reader';

const TEST_DATA_FILE = 'test-data/qrs_test_data.xlsx';

async function loginAs(page: Page, username: string, password: string) {
  const loginPage = new LoginPage(page);
  await page.goto(env.baseUrl);
  await loginPage.login(username, password);
}

// ── Load all three sheets from Excel ─────────────────────────────────────────
const corporateRows = readExcelSheet<Record<string, string>>(TEST_DATA_FILE, 'Corporate');
const posRows       = readExcelSheet<Record<string, string>>(TEST_DATA_FILE, 'POS');
const merchantRows  = readExcelSheet<Record<string, string>>(TEST_DATA_FILE, 'Merchant');

test.describe('QRS Full Onboarding Flow — Corporate → POS → Merchant', () => {

  for (let i = 0; i < corporateRows.length; i++) {
    const corpRow = corporateRows[i];
    const posRow  = posRows[i];
    const rawMerchant = merchantRows[i];

    // Build typed records
    const corporateRecord: CorporateRecord = {
      corpId:        String(corpRow.corpId),
      subsidiaryId:  String(corpRow.subsidiaryId),
      corporateName: corpRow.corporateName || undefined,
    };

    const posRecord: PosRecord = {
      corpId:                String(posRow.corpId),
      icaAccount:            String(posRow.icaAccount),
      channelId:             String(posRow.channelId),
      merchantId:            String(posRow.merchantId),
      reflexMerchantName:    String(posRow.reflexMerchantName),
      posPartnerBrn:         String(posRow.posPartnerBrn),
      posAccountName:        String(posRow.posAccountName),
      posName:               String(posRow.posName),
      posPhone:              String(posRow.posPhone),
      posEmail:              String(posRow.posEmail),
      profitSharingAccount:  String(posRow.profitSharingAccount),
      profitSharingRatio:    String(posRow.profitSharingRatio),
      merchantChargesPackage:String(posRow.merchantChargesPackage),
      inputDirectory:        String(posRow.inputDirectory),
      outputDirectory:       String(posRow.outputDirectory),
      statementDirectory:    String(posRow.statementDirectory),
      status:                posRow.status ? String(posRow.status) : undefined,
    };

    const merchantRecord: MerchantRecord = {
      merchantIdOption:    String(rawMerchant.merchantIdOption),
      businessSector:      String(rawMerchant.businessSector),
      otherBusinessSector: rawMerchant.otherBusinessSector ? String(rawMerchant.otherBusinessSector) : undefined,
      qrsMerchantName:     String(rawMerchant.qrsMerchantName),
      brn:                 String(rawMerchant.brn),
      outletId:            String(rawMerchant.outletId),
      outletName:          String(rawMerchant.outletName),
      cashierName:         String(rawMerchant.cashierName),
      cashierIds:          String(rawMerchant.cashierIds).split(';').map(s => s.trim()),
      bankName:            String(rawMerchant.bankName),
      accountName:         String(rawMerchant.accountName),
      accountNumber:       String(rawMerchant.accountNumber),
      paymentType:         String(rawMerchant.paymentType),
      recipientIdType:     String(rawMerchant.recipientIdType),
      recipientIdDetails:  String(rawMerchant.recipientIdDetails),
      recipientPhone:      String(rawMerchant.recipientPhone),
      recipientEmail:      String(rawMerchant.recipientEmail),
      status:              rawMerchant.status ? String(rawMerchant.status) : undefined,
    };

    test(
      `Onboarding Flow — Row ${i + 1} | Corp: ${corporateRecord.corpId} | POS: ${posRecord.merchantId} | Merchant: ${merchantRecord.qrsMerchantName}`,
      async ({ page }) => {
        test.setTimeout(900000); // 15 minutes per row
        console.log(`\n>>> STARTING ONBOARDING ROW ${i + 1} <<<`);
        console.log(`    Corp: ${corporateRecord.corpId}, POS: ${posRecord.merchantId}, Merchant: ${merchantRecord.qrsMerchantName}\n`);

        const corpPage     = new CorporatePage(page);
        const posPage      = new PosPage(page);
        const merchantPage = new MerchantPage(page);

        await setExpectedResult(
          `Corporate "${corporateRecord.corpId}" → POS "${posRecord.merchantId}" → ` +
          `Merchant "${merchantRecord.qrsMerchantName}" should all be created and approved.`
        );

        // ── Step 1: Maker creates Corporate ──────────────────────────────────
        await reportStep(page, 'Maker creates Corporate', 'Corporate should be submitted for review.', async () => {
          console.log(`[Step 1] Maker creating Corporate: ${corporateRecord.corpId}`);
          await loginAs(page, env.username, env.password);
          await corpPage.openCreateCorporateForm();
          await corpPage.createCorporate(corporateRecord);
          await corpPage.logout();
        });

        // ── Step 2: Checker approves Corporate ───────────────────────────────
        await reportStep(page, 'Checker approves Corporate', 'Corporate should be approved and visible in Live tab.', async () => {
          console.log(`[Step 2] Checker approving Corporate: ${corporateRecord.corpId}`);
          await loginAs(page, env.checkerUsername, env.checkerPassword);
          await corpPage.openReviewRow(corporateRecord.corpId);
          await corpPage.approveButton.click();
          await expect.soft(corpPage.successMessage()).toBeVisible();
          await corpPage.logout();
        });

        // ── Step 3: Maker creates POS (linking approved Corporate) ────────────
        await reportStep(page, 'Maker creates POS', 'POS should be submitted for review.', async () => {
          console.log(`[Step 3] Maker creating POS: ${posRecord.merchantId} for Corp: ${posRecord.corpId}`);
          await loginAs(page, env.username, env.password);
          await posPage.openCreatePosForm();
          await posPage.createPos(posRecord);
          // Fixed: Check successMessage for POS specifically
          await expect.soft(posPage.successMessage()).toBeVisible();
          await posPage.logout();
        });

        // ── Step 4: Checker approves POS ─────────────────────────────────────
        await reportStep(page, 'Checker approves POS', 'POS should be approved successfully.', async () => {
          console.log(`[Step 4] Checker approving POS: ${posRecord.merchantId}`);
          await loginAs(page, env.checkerUsername, env.checkerPassword);
          await posPage.openReviewRow(posRecord.merchantId);
          await posPage.approveButton.click();
          await expect.soft(posPage.successMessage()).toBeVisible();
          await posPage.logout();
        });

        // ── Step 5: Maker creates Merchant (linking approved POS) ─────────────
        await reportStep(page, 'Maker creates Merchant linking to POS', 'Merchant should be submitted for review.', async () => {
          console.log(`[Step 5] Maker creating Merchant: ${merchantRecord.qrsMerchantName} for POS: ${merchantRecord.merchantIdOption}`);
          await loginAs(page, env.username, env.password);
          await merchantPage.openCreateMerchantForm();
          await merchantPage.createMerchant(merchantRecord);
          await expect.soft(merchantPage.successMessage()).toBeVisible();
          await merchantPage.logout();
        });

        // ── Step 6: Checker approves Merchant ────────────────────────────────
        await reportStep(page, 'Checker approves Merchant', 'Merchant should be approved successfully.', async () => {
          console.log(`[Step 6] Checker approving Merchant: ${merchantRecord.outletId}`);
          await loginAs(page, env.checkerUsername, env.checkerPassword);
          await merchantPage.openReviewRow(merchantRecord.outletId);
          await merchantPage.approveButton.click();
          await expect.soft(merchantPage.successMessage()).toBeVisible();
          console.log(`\n>>> FINISHED ONBOARDING ROW ${i + 1} SUCCESSFULLY <<<\n`);
        });
      }
    );
  }
});
