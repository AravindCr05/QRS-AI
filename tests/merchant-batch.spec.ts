import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
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

// ── Load Merchant data from Excel ───────────────────────────────────────────
const rawMerchantRows = readExcelSheet<Record<string, string>>(TEST_DATA_FILE, 'Merchant');

// Convert to typed records with robust string casting for numeric Excel cells
const merchantRecords: MerchantRecord[] = rawMerchantRows.map(row => ({
  merchantIdOption:    String(row.merchantIdOption),
  businessSector:      String(row.businessSector),
  otherBusinessSector: row.otherBusinessSector ? String(row.otherBusinessSector) : undefined,
  qrsMerchantName:     String(row.qrsMerchantName),
  brn:                 String(row.brn),
  outletId:            String(row.outletId),
  outletName:          String(row.outletName),
  cashierName:         String(row.cashierName),
  cashierIds:          String(row.cashierIds).split(';').map(s => s.trim()),
  bankName:            String(row.bankName),
  accountName:         String(row.accountName),
  accountNumber:       String(row.accountNumber),
  paymentType:         String(row.paymentType).padStart(2, '0'),
  recipientIdType:     String(row.recipientIdType).padStart(2, '0'),
  recipientIdDetails:  String(row.recipientIdDetails),
  recipientPhone:      String(row.recipientPhone),
  recipientEmail:      String(row.recipientEmail),
  status:              row.status ? String(row.status) : undefined,
}));

test.describe('QRS Merchant Batch Processing (100 Rows)', () => {
  // Set a very long timeout for the entire batch
  test.setTimeout(7200000); // 2 hours

  test('Batch Create and Approve 100 Merchants', async ({ page }) => {
    const merchantPage = new MerchantPage(page);

    /*
    // ── PART 1: MAKER LOOP (Create All) ──────────────────────────────────────
    console.log(`\n>>> STARTING BATCH MERCHANT CREATION (Count: ${merchantRecords.length}) <<<`);
    await loginAs(page, env.username, env.password);
    
    let createdCount = 0;
    for (let i = 0; i < merchantRecords.length; i++) {
        const record = merchantRecords[i];
        console.log(`[Maker] [${i + 1}/${merchantRecords.length}] Processing Outlet: ${record.outletId}`);
        
        try {
            await merchantPage.openCreateMerchantForm();
            await merchantPage.createMerchant(record);
            // Verify specific SUCCESS toast (not just any container)
            await expect(merchantPage.successMessage()).toBeVisible({ timeout: 15000 });
            createdCount++;
            await page.waitForTimeout(1000); // Stability pause
        } catch (error) {
            console.error(`[Maker] [${i + 1}/${merchantRecords.length}] FAILED (${record.outletId}):`, error.message);
            await page.screenshot({ path: `test-results/maker-fail-${record.outletId}.png` });
            await merchantPage.openMerchantManagement(); // Reset to list
        }
    }
    
    await merchantPage.logout();
    console.log(`>>> FINISHED BATCH CREATION: ${createdCount}/${merchantRecords.length} Success <<<\n`);
    */
    let createdCount = 99; // Assume they exist as per user instructions

    // ── PART 2: TARGETED CHECKER LOOP (Approve pending only) ─────────────────
    // Read exactly which IDs are still pending from the reconciliation output
    const fs = require('fs');
    const path = require('path');
    const pendingFile = path.join(__dirname, '../test-data/pending-approval.json');
    const pendingIds: string[] = JSON.parse(fs.readFileSync(pendingFile, 'utf-8'));
    
    console.log(`>>> STARTING TARGETED APPROVAL: ${pendingIds.length} merchants pending <<<`);
    await loginAs(page, env.checkerUsername, env.checkerPassword);
    
    await merchantPage.setupReviewTableBatch();

    let approvedCount = 0;
    for (let i = 0; i < pendingIds.length; i++) {
        const outletId = pendingIds[i];
        console.log(`[Checker] [${i + 1}/${pendingIds.length}] Approving: ${outletId}`);
        
        try {
            await merchantPage.clickEyeIcon(outletId);
            await merchantPage.approveButton.click();
            await expect(merchantPage.successMessage()).toBeVisible({ timeout: 15000 });
            approvedCount++;
            console.log(`[Checker] [${i + 1}/${pendingIds.length}] ✓ APPROVED: ${outletId}`);
            
            await merchantPage.reviewTab.click();
            await page.waitForTimeout(1000); 
        } catch (error: any) {
            if (error.message?.includes('not found')) {
                console.log(`[Checker] [${i + 1}/${pendingIds.length}] SKIPPED (${outletId}): Already moved to Live.`);
            } else {
                console.error(`[Checker] [${i + 1}/${pendingIds.length}] FAILED (${outletId}):`, error.message);
                await page.screenshot({ path: `test-results/checker-fail-${outletId}.png` });
                await merchantPage.openMerchantManagement();
                await merchantPage.reviewTab.click();
            }
        }
    }
    
    console.log(`>>> TARGETED APPROVAL COMPLETE | Approved: ${approvedCount}/${pendingIds.length} <<<`);
  });
});
