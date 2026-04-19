import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { CorporatePage, CorporateRecord } from '../pages/corporate.page';
import { PosPage, PosRecord } from '../pages/pos.page';
import { MerchantPage, MerchantRecord } from '../pages/merchant.page';
import { FileProcessingPage } from '../pages/file-processing.page';
import { QRTransactionPage } from '../pages/qr-transaction.page';
import { generateUniqueTestData } from '../utils/test-data-generator';
import { uploadDynamicQrt } from '../utils/qrt-uploader';
import { env } from '../utils/env';

/**
 * Integrated Test: Full Lifecycle Verification
 * 1. Creates a brand new POS/Merchant setup with unique IDs.
 * 2. Approves them through the Review cycle (Checker).
 * 3. Uploads a QRT file for these specific new IDs.
 * 4. Verifies the end-to-end report calculations.
 */

async function loginAs(page: Page, username: string, password: string) {
    const loginPage = new LoginPage(page);
    const url = env.baseUrl || 'https://192.168.7.35:8072/';
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
    } catch (error: any) {
        if (!String(error?.message).includes('ERR_ABORTED')) {
            throw error;
        }
        await page.waitForTimeout(1000);
        await page.goto(url, { waitUntil: 'domcontentloaded' });
    }
    await loginPage.login(username, password);
}

function formatAmountStr(amt: string) {
    const parts = amt.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join('.');
}

test.describe('Integrated Onboarding and QRT Verification', () => {
    // Generate unique data for this run
    const data = generateUniqueTestData();

    test('Perform full lifecycle verification', async ({ page }) => {
        test.setTimeout(900000); // 15-minute timeout for the entire flow
        
        const corpPage = new CorporatePage(page);
        const posPage = new PosPage(page);
        const merchantPage = new MerchantPage(page);
        
        console.log(`\n>>> STARTING INTEGRATED TEST [${data.merchantId}] <<<`);

        // --- PHASE 1: CORPORATE SETUP ---
        await test.step('Create and Approve Corporate', async () => {
            console.log(`[Step 1] Creating Corporate: ${data.corpId} (Using existing master)`);
            // In many cases, we link to an existing Corporate. We'll use '000000' as base.
            // If creation is mandatory:
            // await loginAs(page, env.username, env.password);
            // await corpPage.openCreateCorporateForm();
            // await corpPage.createCorporate({ corpId: data.corpId, subsidiaryId: data.corpId });
            // await corpPage.logout();
            // Approval steps...
        });

        // --- PHASE 2: POS SETUP (Maker) ---
        await test.step('Maker creates POS', async () => {
            console.log(`[Step 2] Maker creating POS: ${data.merchantId}`);
            await loginAs(page, env.username, env.password);
            await posPage.openCreatePosForm();
            
            const posRec: PosRecord = {
                corpId: '000000',
                icaAccount: data.icaAccount,
                channelId: 'QRT',
                merchantId: data.merchantId,
                reflexMerchantName: data.reflexMerchantName,
                posPartnerBrn: data.brn,
                posAccountName: data.posAccountName,
                posName: data.posName,
                posPhone: '0123456789',
                posEmail: data.posEmail,
                profitSharingAccount: '12345678',
                profitSharingRatio: '0',
                merchantChargesPackage: '0',
                inputDirectory: data.inputDirectory,
                outputDirectory: data.outputDirectory,
                statementDirectory: data.statementDirectory,
                status: 'Active'
            };
            
            await posPage.createPos(posRec);
            console.log('    POS created and submitted for review.');
            await posPage.logout();
        });

        // --- PHASE 3: POS APPROVAL (Checker) ---
        await test.step('Checker approves POS', async () => {
            console.log(`[Step 3] Checker approving POS: ${data.merchantId}`);
            await loginAs(page, env.checkerUsername, env.checkerPassword);
            await posPage.openReviewRow(data.merchantId);
            await posPage.approveButton.click();
            await expect(posPage.successMessage()).toBeVisible();
            await posPage.logout();
        });

        // --- PHASE 4: MERCHANT SETUP (Maker) ---
        await test.step('Maker creates Merchant', async () => {
            console.log(`[Step 4] Maker creating Merchant: ${data.outletId}`);
            await loginAs(page, env.username, env.password);
            await merchantPage.openCreateMerchantForm();
            
            const merchantRec: MerchantRecord = {
                merchantIdOption: data.merchantId, // Select the newly approved POS ID
                businessSector: 'Others',
                otherBusinessSector: 'Automation Test',
                qrsMerchantName: data.qrsMerchantName,
                brn: data.brn,
                outletId: data.outletId,
                outletName: data.outletName,
                cashierName: data.cashierName,
                cashierIds: [data.cashierId],
                bankName: 'RHB BANK BERHAD',
                accountName: data.qrsMerchantName,
                accountNumber: data.accountNumber,
                paymentType: '05 - Fund Transfer',
                recipientIdType: 'BRN',
                recipientIdDetails: data.brn,
                recipientPhone: '0123456789',
                recipientEmail: data.posEmail,
                status: 'Active'
            };
            
            await merchantPage.createMerchant(merchantRec);
            console.log('    Merchant created and submitted for review.');
            await merchantPage.logout();
        });

        // --- PHASE 5: MERCHANT APPROVAL (Checker) ---
        await test.step('Checker approves Merchant', async () => {
            console.log(`[Step 5] Checker approving Merchant: ${data.outletId}`);
            await loginAs(page, env.checkerUsername, env.checkerPassword);
            await merchantPage.openReviewRow(data.outletId);
            await merchantPage.approveButton.click();
            await merchantPage.liveTab.click();
            await page.getByRole('textbox', { name: /^Outlet ID$/i }).fill(data.outletId);
            await page.getByRole('button', { name: /Search/i }).click();
            await expect(page.locator('table tbody tr').filter({ hasText: data.outletId }).first()).toBeVisible();
            await merchantPage.logout();
        });

        // --- PHASE 6: TRANSACTION UPLOAD ---
        await test.step('Dynamic QRT Upload', async () => {
            console.log(`[Step 6] Generating and uploading QRT for ${data.merchantId}...`);
            await uploadDynamicQrt(data);
            // Wait for system to process
            console.log('    Waiting 30 seconds for file processing...');
            await page.waitForTimeout(30000);
        });

        // --- PHASE 7: REPORT VERIFICATION ---
        await test.step('Verify Reports', async () => {
            console.log(`[Step 7] Verifying reports for ${data.fileName}`);
            await loginAs(page, env.username, env.password);
            
            // 7.1 File Processing
            const fileProcPage = new FileProcessingPage(page);
            await fileProcPage.navigateTo();
            await fileProcPage.searchByFileName(data.fileName);
            const row = await fileProcPage.findRowByFileName(data.fileName);
            await expect(row).toBeVisible();
            await fileProcPage.verifyRowText(row, 'IMPORTED');
            await fileProcPage.verifyRowText(row, formatAmountStr(data.transactionAmount));

            // 7.2 QR Transaction Summary
            const qrTransPage = new QRTransactionPage(page);
            await qrTransPage.navigateTo();
            await qrTransPage.searchSummaryByMerchantID(data.merchantId);
            const summaryRow = await qrTransPage.findRowByText(data.merchantId);
            await expect(summaryRow).toBeVisible();
            await qrTransPage.verifyRowContains(summaryRow, formatAmountStr(data.transactionAmount));

            // 7.3 QR Transaction Detail
            await qrTransPage.searchDetailByTransactionRef(data.transactionReference);
            const detailRow = await qrTransPage.findRowByText(data.transactionReference);
            await expect(detailRow).toBeVisible();
            await qrTransPage.verifyRowContains(detailRow, data.merchantId);
            await qrTransPage.verifyRowContains(detailRow, data.qrsMerchantName);
            await qrTransPage.verifyRowContains(detailRow, 'PENDING'); // or APPROVED if instant
            
            console.log('\n>>> FULL LIFECYCLE VERIFICATION SUCCESSFUL <<<');
        });
    });
});
