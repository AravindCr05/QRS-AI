import 'dotenv/config';
import { chromium } from 'playwright';
import { readExcelSheet } from '../utils/excel-reader';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL ?? 'https://192.168.7.35:8072/';
const CHECKER_USER = process.env.CHECKER_USERNAME!;
const CHECKER_PASS = process.env.CHECKER_PASSWORD!;
const MAKER_USER = process.env.LOGIN_USERNAME!;
const MAKER_PASS = process.env.LOGIN_PASSWORD!;
const TEST_DATA_FILE = path.join(__dirname, '../test-data/qrs_test_data.xlsx');

async function scrapeFirstCells(page: any, tabName: string): Promise<Set<string>> {
    await page.getByText(tabName, { exact: true }).click();
    await page.waitForTimeout(2000);
    const select = page.locator('select').filter({ hasText: /per page/i });
    if (await select.isVisible()) {
        await select.selectOption('500');
        await page.waitForTimeout(3000);
    }
    const cells = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('table tbody tr')).map(tr => {
            const td = tr.querySelector('td:first-child');
            return td ? (td as HTMLElement).innerText.trim() : '';
        }).filter(Boolean);
    });
    return new Set<string>(cells);
}

(async () => {
    const excelRows = readExcelSheet<any>(TEST_DATA_FILE, 'Merchant');
    const expectedIds = excelRows.map(r => String(r.outletId).trim());
    console.log(`Excel: ${expectedIds.length} IDs`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1920, height: 2000 } });
    const page = await context.newPage();

    // Login as CHECKER (can see Review tab)
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.locator('input').first().fill(CHECKER_USER);
    await page.locator('input[type="password"]').first().fill(CHECKER_PASS);
    await page.locator('button').filter({ hasText: /log.?in/i }).click();
    await page.waitForTimeout(3000);
    await page.getByRole('link', { name: /setup/i }).first().click();
    await page.waitForTimeout(1000);
    await page.getByRole('link', { name: /merchant management/i }).click();
    await page.waitForTimeout(2000);

    // Check Merchant tab > Review
    await page.locator('li, [role="tab"], .nav-link').getByText('Merchant', { exact: true }).first().click();
    await page.waitForTimeout(1000);
    const reviewSet = await scrapeFirstCells(page, 'Review');
    const liveSet = await scrapeFirstCells(page, 'Live');

    console.log(`Review tab: ${reviewSet.size} entries`);
    console.log(`Live tab: ${liveSet.size} entries`);

    const pendingApproval = expectedIds.filter(id => reviewSet.has(id));
    const approved = expectedIds.filter(id => liveSet.has(id));
    const missing = expectedIds.filter(id => !reviewSet.has(id) && !liveSet.has(id));

    console.log(`\n=== SUMMARY ===`);
    console.log(`✓ Live (Approved OK): ${approved.length}`);
    console.log(`⏳ Still in Review (pending): ${pendingApproval.length}`);
    if (pendingApproval.length > 0) console.log('   Pending:', pendingApproval.join(', '));
    console.log(`✗ Not found anywhere: ${missing.length}`);
    if (missing.length > 0) console.log('   Missing:', missing.join(', '));

    await browser.close();
})();
