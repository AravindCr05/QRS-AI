import 'dotenv/config';
import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL ?? 'https://192.168.7.35:8072/';
const CHECKER_USER = process.env.CHECKER_USERNAME!;
const CHECKER_PASS = process.env.CHECKER_PASSWORD!;

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1920, height: 2000 } });
    const page = await context.newPage();

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
    
    await page.locator('li, [role="tab"], .nav-link').getByText('Merchant', { exact: true }).first().click();
    await page.waitForTimeout(1000);
    await page.getByText('Review', { exact: true }).click();
    await page.waitForTimeout(2000);

    const pageSizeSelect = page.locator('select').filter({ hasText: /per page/i });
    if (await pageSizeSelect.isVisible()) {
        await pageSizeSelect.selectOption('500');
        await page.waitForTimeout(3000);
    }

    const testId = 'OI1704273'; // First of the 16 pending

    // Find all rows containing this ID
    const matchingRows = await page.evaluate((id) => {
        const rows = Array.from(document.querySelectorAll('table tbody tr'));
        return rows
            .filter(tr => tr.textContent?.includes(id))
            .map(tr => {
                const tds = Array.from(tr.querySelectorAll('td'));
                return {
                    cellCount: tds.length,
                    cells: tds.map((td, i) => ({
                        i,
                        text: (td as HTMLElement).innerText.trim(),
                        html: td.innerHTML.trim().substring(0, 100)
                    })),
                    buttons: Array.from(tr.querySelectorAll('button')).map(b => ({
                        class: b.className,
                        text: (b as HTMLElement).innerText.trim()
                    }))
                };
            });
    }, testId);

    console.log(`Rows containing "${testId}":`, JSON.stringify(matchingRows, null, 2));

    // Test Playwright matchers
    const r1 = page.locator('table tbody tr').filter({ has: page.locator('td:first-child', { hasText: new RegExp(`^${testId}$`) }) }).first();
    console.log(`\ntd:first-child exact (^$): ${await r1.isVisible()}`);
    
    const r2 = page.locator('table tbody tr').filter({ has: page.locator('td', { hasText: testId }) }).first();
    console.log(`any td contains: ${await r2.isVisible()}`);

    const r3 = page.locator('table tbody tr').filter({ has: page.locator('td').first().filter({ hasText: testId }) }).first();
    console.log(`first td contains: ${await r3.isVisible()}`);

    await browser.close();
})();
