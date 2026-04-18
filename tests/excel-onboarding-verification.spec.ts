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
import { readExcelSheet } from '../utils/excel-reader';

const TEST_DATA_FILE = 'test-data/qrs_test_data_single.xlsx';

async function loginAs(page: Page, username: string, password: string) {
    const loginPage = new LoginPage(page);
    await page.goto(env.baseUrl || 'https://192.168.7.35:8072/');
    await loginPage.login(username, password);
}

function formatAmountStr(amt: string) {
    const parts = amt.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join('.');
}

test.describe('Excel-Driven Integrated Onboarding and QRT Verification', () => {
    // Generate the unique identities following the user's rules
    const data = generateUniqueTestData();

    // Read the single row from each sheet for static context
    const corporateRows = readExcelSheet<Record<string, any>>(TEST_DATA_FILE, 'Corporate');
    const posRows       = readExcelSheet<Record<string, any>>(TEST_DATA_FILE, 'POS');
    const merchantRows  = readExcelSheet<Record<string, any>>(TEST_DATA_FILE, 'Merchant');

    const corpRow = corporateRows[0];
    const posRow  = posRows[0];
    const rawMerchant = merchantRows[0];

    test('Perform full lifecycle verification with strict validation rules', async ({ page }) => {
        test.setTimeout(900000); // 15 minutes
        
        const corpPage = new CorporatePage(page);
        const posPage = new PosPage(page);
        const merchantPage = new MerchantPage(page);
        
        console.log(`\n>>> STARTING INTEGRATED TEST | POS: ${data.merchantId} | Outlet: ${data.outletId} <<<`);
        console.log(`    Rules: MID starts with RHBQR (length 11), OID length 9, numeric ICA.`);

        // --- PHASE 1: CORPORATE SETUP (Maker) ---
        await test.step('Maker creates Corporate', async () => {
            console.log(`[Step 0] Maker creating Corporate: ${data.corpId}`);
            await loginAs(page, env.username, env.password);
            await corpPage.openCreateCorporateForm();
            await corpPage.createCorporate({
                corpId: data.corpId,
                subsidiaryId: data.subsidiaryId,
                corporateName: data.corporateName
            });
            await expect(corpPage.successMessage()).toBeVisible({ timeout: 15000 });
            await corpPage.logout();
        });

        // --- PHASE 1.1: CORPORATE APPROVAL (Checker) ---
        await test.step('Checker approves Corporate', async () => {
            console.log(`[Step 1] Checker approving Corporate: ${data.corpId}`);
            await loginAs(page, env.checkerUsername, env.checkerPassword);
            await corpPage.openReviewRow(data.corpId);
            await corpPage.approveButton.click();
            await expect(corpPage.successMessage()).toBeVisible({ timeout: 15000 });
            await corpPage.logout();
        });

        // --- PHASE 2: POS SETUP (Maker) ---
        await test.step('Maker creates POS', async () => {
            console.log(`[Step 2] Maker creating POS: ${data.merchantId}`);
            await loginAs(page, env.username, env.password);
            await posPage.openCreatePosForm();
            
            const posRec: PosRecord = {
                corpId:                String(data.corpId),
                icaAccount:            String(data.icaAccount),
                channelId:             String(posRow.channelId),
                merchantId:            String(data.merchantId),
                reflexMerchantName:    String(data.reflexMerchantName),
                posPartnerBrn:         String(posRow.posPartnerBrn),
                posAccountName:        String(data.posAccountName),
                posName:               String(data.posName),
                posPhone:              String(posRow.posPhone),
                posEmail:              String(posRow.posEmail),
                profitSharingAccount:  String(posRow.profitSharingAccount),
                profitSharingRatio:    String(posRow.profitSharingRatio),
                merchantChargesPackage:String(posRow.merchantChargesPackage),
                inputDirectory:        String(data.inputDirectory),
                outputDirectory:       String(data.outputDirectory),
                statementDirectory:    String(data.statementDirectory),
                status:                posRow.status ? String(posRow.status) : 'Active',
            };
            
            await posPage.createPos(posRec);
            await posPage.logout();
        });

        // --- PHASE 3: POS APPROVAL (Checker) ---
        await test.step('Checker approves POS', async () => {
            console.log(`[Step 3] Checker approving POS: ${data.merchantId}`);
            await loginAs(page, env.checkerUsername, env.checkerPassword);
            await posPage.openReviewRow(data.merchantId);
            await posPage.approveButton.click();
            await expect(posPage.successMessage()).toBeVisible({ timeout: 15000 });
            await posPage.logout();
        });

        // --- PHASE 4: MERCHANT SETUP (Maker) ---
        await test.step('Maker creates Merchant', async () => {
            console.log(`[Step 4] Maker creating Merchant: ${data.outletId}`);
            await loginAs(page, env.username, env.password);
            await merchantPage.openCreateMerchantForm();
            
            const merchantRec: MerchantRecord = {
                merchantIdOption:    String(data.merchantId),
                businessSector:      String(rawMerchant.businessSector),
                otherBusinessSector: rawMerchant.otherBusinessSector ? String(rawMerchant.otherBusinessSector) : undefined,
                qrsMerchantName:     String(data.qrsMerchantName),
                brn:                 String(data.brn),
                outletId:            String(data.outletId),
                outletName:          String(data.outletName),
                cashierName:         String(data.cashierName),
                cashierIds:          String(data.cashierId).split(';').map(s => s.trim()),
                bankName:            String(rawMerchant.bankName),
                accountName:         String(rawMerchant.accountName),
                accountNumber:       String(data.accountNumber),
                paymentType:         '02',
                recipientIdType:     '02',
                recipientIdDetails:  String(data.brn),
                recipientPhone:      String(rawMerchant.recipientPhone),
                recipientEmail:      String(rawMerchant.recipientEmail),
                status:              rawMerchant.status ? String(rawMerchant.status) : 'Active',
            };
            
            await merchantPage.createMerchant(merchantRec);
            await expect(merchantPage.successMessage()).toBeVisible({ timeout: 15000 });
            await merchantPage.logout();
        });

        // --- PHASE 5: MERCHANT APPROVAL (Checker) ---
        await test.step('Checker approves Merchant', async () => {
            console.log(`[Step 5] Checker approving Merchant: ${data.outletId}`);
            await loginAs(page, env.checkerUsername, env.checkerPassword);
            await merchantPage.openReviewRow(data.outletId);
            await merchantPage.approveButton.click();
            await expect(merchantPage.successMessage()).toBeVisible({ timeout: 15000 });
            await merchantPage.logout();
        });

        // --- PHASE 6: TRANSACTION UPLOAD ---
        await test.step('QRT Upload', async () => {
            console.log(`[Step 6] Uploading QRT for ${data.merchantId}...`);
            await uploadDynamicQrt({
                fileName: data.fileName,
                merchantId: data.merchantId,
                outletId: data.outletId,
                qrsMerchantName: data.qrsMerchantName,
                icaAccount: String(data.icaAccount),
                outletName: data.outletName,
                cashierId: data.cashierId,
                transactionReference: data.transactionReference,
                trxReference: data.trxReference,
                transactionAmount: data.transactionAmount,
                sourceOfFund: 'QR Code',
                participant: 'RHB Bank Berhad'
            });
            console.log('    Waiting 30 seconds for processing...');
            await page.waitForTimeout(30000);
        });

        // --- PHASE 7: VERIFICATION ---
        await test.step('Verify Reports', async () => {
            console.log(`[Step 7] Verifying reports for ${data.fileName}`);
            await loginAs(page, env.username, env.password);
            
            const fileProcPage = new FileProcessingPage(page);
            await fileProcPage.navigateTo();
            await fileProcPage.searchByFileName(data.fileName);
            const row = await fileProcPage.findRowByFileName(data.fileName);
            await expect(row).toBeVisible();
            await fileProcPage.verifyRowText(row, 'IMPORTED');
            await fileProcPage.verifyRowText(row, formatAmountStr(data.transactionAmount));

            const qrTransPage = new QRTransactionPage(page);
            await qrTransPage.navigateTo();
            await qrTransPage.searchSummaryByMerchantID(data.merchantId);
            const sRow = await qrTransPage.findRowByText(data.merchantId);
            await expect(sRow).toBeVisible();
            await qrTransPage.verifyRowContains(sRow, formatAmountStr(data.transactionAmount));
            
            console.log('\n>>> EXCEL INTEGRATED VERIFICATION SUCCESSFUL <<<');
        });
    });
});
