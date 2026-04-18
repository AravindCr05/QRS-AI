import 'dotenv/config';
import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL ?? 'https://192.168.7.35:8072/';
const CHECKER_USER = process.env.CHECKER_USERNAME ?? 'qrs_dm1';
const CHECKER_PASS = process.env.CHECKER_PASSWORD ?? 'ABcd@123';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Login
    await page.locator('input').first().fill(CHECKER_USER);
    await page.locator('input[type="password"]').first().fill(CHECKER_PASS);
    await page.locator('button').filter({ hasText: /log.?in/i }).click();
    await page.waitForTimeout(3000);
    console.log('Logged in. URL:', page.url());

    // Navigate to Merchant Management
    await page.getByRole('link', { name: /setup/i }).first().click();
    await page.waitForTimeout(1000);
    await page.getByRole('link', { name: /merchant management/i }).click();
    await page.waitForTimeout(2000);
    console.log('On page:', page.url());

    // Click Review tab (exact match)
    await page.getByText('Review', { exact: true }).click();
    await page.waitForTimeout(2000);

    // Dump table headers
    const headers = await page.evaluate(() => {
        const ths = Array.from(document.querySelectorAll('table thead th'));
        return ths.map((th, i) => `Col ${i + 1}: "${(th as HTMLElement).innerText.trim()}"`);
    });
    console.log('\n=== TABLE HEADERS ===');
    headers.forEach(h => console.log(h));

    // Dump first 3 rows cell-by-cell
    const rows = await page.evaluate(() => {
        const trs = Array.from(document.querySelectorAll('table tbody tr')).slice(0, 3);
        return trs.map(tr => {
            const tds = Array.from(tr.querySelectorAll('td'));
            return tds.map((td, i) => `  Col ${i + 1}: "${(td as HTMLElement).innerText.trim().substring(0, 50)}"`);
        });
    });
    console.log('\n=== FIRST 3 ROWS (all cells) ===');
    rows.forEach((row, i) => {
        console.log(`Row ${i + 1}:`);
        row.forEach(cell => console.log(cell));
    });

    // Count rows & pagination
    const rowCount = await page.locator('table tbody tr').count();
    const pagText = await page.evaluate(() => {
        const all = Array.from(document.querySelectorAll('*')).filter(el => 
            (el as HTMLElement).innerText && (el as HTMLElement).innerText.match(/showing|of \d|page \d/i) 
            && !(el as HTMLElement).querySelector('*')?.innerText
        );
        return all.slice(0, 3).map(el => (el as HTMLElement).innerText.trim());
    });
    console.log(`\n=== PAGINATION ===`);
    console.log(`Visible rows: ${rowCount}`);
    console.log('Pagination texts:', pagText);

    await browser.close();
})();
