import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { FileProcessingPage } from '../pages/file-processing.page';
import { QRTransactionPage } from '../pages/qr-transaction.page';
import { MerchantPage } from '../pages/merchant.page';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const USERNAME = process.env.LOGIN_USERNAME ?? 'ramesh';
const PASSWORD = process.env.LOGIN_PASSWORD ?? 'ABcd@321';

let uploadData: any;

function formatAmountStr(amt: string) {
    const parts = amt.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join('.');
}

test.describe('QRT Upload Validation', () => {

  test.beforeAll(async () => {
    // 1. Run the upload script dynamically
    console.log('Generating and uploading QRT file via UNC...');
    execSync('node scripts/upload-qrt-unc.js', { stdio: 'inherit', cwd: process.cwd() });

    // 2. Read the generated info context
    const infoPath = path.resolve(process.cwd(), 'test-data/last-upload.json');
    const rawData = fs.readFileSync(infoPath, 'utf8');
    uploadData = JSON.parse(rawData);
    console.log(`Loaded test data for file: ${uploadData.fileName}`);
  });

  test('Verify File Processing and QR Transaction reports', async ({ page }) => {
    test.setTimeout(300000); // 5-minute timeout for live data extraction + background processing + UI navigation

    // Step 1: Login
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.login(USERNAME, PASSWORD);
    
    // Step 2: Fetch Live system data as source of truth
    const merchantPage = new MerchantPage(page);
    console.log(`Fetching Live Merchant Name for MerchantID: ${uploadData.merchantId}, OutletID: ${uploadData.outletId}...`);
    const liveMerchantName = await merchantPage.getLiveMerchantName(uploadData.merchantId, uploadData.outletId);
    console.log(`Fetching Live POS ICA Account for MerchantID: ${uploadData.merchantId}...`);
    const liveIcaAccount = await merchantPage.getLivePosIcaAccount(uploadData.merchantId);
    
    console.log(`Live Data: MerchantName=[${liveMerchantName}], ICAAccount=[${liveIcaAccount}]`);
    
    // Update context with live values
    uploadData.qrsMerchantName = liveMerchantName;
    uploadData.icaAccountNumber = liveIcaAccount;

    // Wait extra time for the background processing of the file to complete
    console.log('Waiting 30 seconds for the system to process the file...');
    await page.waitForTimeout(30000); 

    // Step 3: Validate File Processing page
    const fileProcPage = new FileProcessingPage(page);
    await fileProcPage.navigateTo();
    
    // We expect the file to eventually turn "IMPORTED"
    // We can try to loop/poll if it's "PROCESSING"
    await test.step('Check File Processing Page', async () => {
      await fileProcPage.searchByFileName(uploadData.fileName);
      
      const row = await fileProcPage.findRowByFileName(uploadData.fileName);
      await expect(row).toBeVisible({ timeout: 15000 });
      
      // Expected values
      await fileProcPage.verifyRowText(row, uploadData.merchantId);
      await fileProcPage.verifyRowText(row, uploadData.fileName);
      await fileProcPage.verifyRowText(row, 'QR Transaction'); // File Type
      await fileProcPage.verifyRowText(row, '\\\\192.168.7.60\\TesterShare\\QRS\\phase3-release3\\temp\\input\\qrt'); // File Path
      await fileProcPage.verifyRowText(row, 'Inbound'); // Direction
      await fileProcPage.verifyRowText(row, '1'); // Transaction Count
      // Format amount with commas (e.g., 7834.61 -> 7,834.61)
      await fileProcPage.verifyRowText(row, formatAmountStr(uploadData.transactionAmount));
      await fileProcPage.verifyRowText(row, 'IMPORTED'); // Status
      
      // Processed On & Modified On (Validate it contains today's date)
      const todayStr = new Date().toISOString().split('T')[0];
      await fileProcPage.verifyRowText(row, todayStr);
    });

    // Step 3: Validate QR Transaction Summary
    const qrTransPage = new QRTransactionPage(page);
    await qrTransPage.navigateTo();

    await test.step('Check QR Transaction Summary', async () => {
      await qrTransPage.searchSummaryByMerchantID(uploadData.merchantId);
      const row = await qrTransPage.findRowByText(uploadData.merchantId);
      await expect(row).toBeVisible({ timeout: 10000 });
      
      // Values matched from screenshot logic
      await qrTransPage.verifyRowContains(row, uploadData.icaAccountNumber);
      await qrTransPage.verifyRowContains(row, uploadData.merchantId);
      await qrTransPage.verifyRowContains(row, uploadData.qrsMerchantName);
      await qrTransPage.verifyRowContains(row, '1'); // Total Transaction
      await qrTransPage.verifyRowContains(row, formatAmountStr(uploadData.transactionAmount));
      await qrTransPage.verifyRowContains(row, 'IMPORTED'); // Status
    });

    // Step 4: Validate QR Transaction Detail
    await test.step('Check QR Transaction Detail', async () => {
      await qrTransPage.searchDetailByTransactionRef(uploadData.transactionReference);
      const detailRow = await qrTransPage.findRowByText(uploadData.transactionReference);
      await expect(detailRow).toBeVisible({ timeout: 10000 });
      
      // Values from screenshot 2
      const todayStr = new Date().toISOString().split('T')[0];
      await qrTransPage.verifyRowContains(detailRow, todayStr); // Transaction Date (usually contains today's date)
      await qrTransPage.verifyRowContains(detailRow, uploadData.transactionReference);
      await qrTransPage.verifyRowContains(detailRow, uploadData.icaAccountNumber);
      await qrTransPage.verifyRowContains(detailRow, uploadData.merchantId);
      await qrTransPage.verifyRowContains(detailRow, uploadData.qrsMerchantName);
      await qrTransPage.verifyRowContains(detailRow, uploadData.outletName);
      // Cashier ID might be formatted differently or slightly shifted in the UI, but it should be present
      await qrTransPage.verifyRowContains(detailRow, uploadData.cashierId);
      await qrTransPage.verifyRowContains(detailRow, formatAmountStr(uploadData.transactionAmount));
      await qrTransPage.verifyRowContains(detailRow, uploadData.cashierId);
      await qrTransPage.verifyRowContains(detailRow, formatAmountStr(uploadData.transactionAmount));
      await qrTransPage.verifyRowContains(detailRow, 'PENDING'); // "QRT Status" shown as PENDING in the screenshot
    });
  });
});
