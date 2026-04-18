require('dotenv').config();
const { chromium } = require('playwright');
const { readExcelSheet } = require('./utils/excel-reader');

const TEST_DATA_FILE = 'test-data/qrs_test_data.xlsx';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();

    console.log('--- STARTING RECONCILIATION ---');

    // 1. Read Expected from Excel
    const excelRows = readExcelSheet(TEST_DATA_FILE, 'Merchant');
    const expectedIds = new Set(excelRows.map(r => String(r.outletId).trim()));
    console.log(`Excel Context: ${expectedIds.size} IDs found.`);

    // 2. Login
    await page.goto(process.env.BASE_URL);
    await page.fill('input[placeholder*="username" i]', process.env.LOGIN_USERNAME);
    await page.fill('input[placeholder*="password" i]', process.env.LOGIN_PASSWORD);
    await page.click('button:has-text("Log In")');
    await page.waitForTimeout(2000);

    // 3. Navigate to Merchant Management
    await page.click('text=Setup');
    await page.click('text=Merchant Management');
    await page.waitForTimeout(2000);

    // Helper: Scrape all IDs from a tab (handling pagination)
    async function scrapeAllIdsFromTab(tabName) {
        await page.locator('div[role="tab"], button, a').getByText(tabName, { exact: true }).click();
        await page.waitForTimeout(2000);

        // Set 100 per page to make it easier
        const select = page.locator('select').filter({ hasText: /100 per page/i });
        if (await select.isVisible()) {
            await select.selectOption('100');
            await page.waitForTimeout(2000);
        }

        const foundIds = new Set();
        let maxPages = 15;
        for (let p = 0; p < maxPages; p++) {
            const pageIds = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('table tbody tr')).map(tr => {
                    const firstCell = tr.querySelector('td');
                    return firstCell ? firstCell.innerText.trim() : null;
                }).filter(Boolean);
            });
            pageIds.forEach(id => foundIds.add(id));

            const nextBtn = page.getByRole('link', { name: '›' });
            if (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
                await nextBtn.click();
                await page.waitForTimeout(2000);
            } else {
                break;
            }
        }
        return foundIds;
    }

    console.log('Scraping [Live] tab...');
    const liveIds = await scrapeAllIdsFromTab('Live');
    console.log(`Found ${liveIds.size} Live merchants.`);

    console.log('Scraping [Review] tab...');
    const reviewIds = await scrapeAllIdsFromTab('Review');
    console.log(`Found ${reviewIds.size} Review merchants.`);

    // 4. Comparison
    const missingTotal = [];
    const inReview = [];
    
    for (let id of expectedIds) {
        if (liveIds.has(id)) {
            // All good
        } else if (reviewIds.has(id)) {
            inReview.push(id);
        } else {
            missingTotal.push(id);
        }
    }

    console.log('\n--- RECONCILIATION RESULTS ---');
    console.log(`PENDING APPROVAL (In Review): ${inReview.length}`);
    if (inReview.length > 0) console.log(inReview.join(', '));
    
    console.log(`NOT CREATED AT ALL: ${missingTotal.length}`);
    if (missingTotal.length > 0) console.log(missingTotal.join(', '));

    await browser.close();
})();
