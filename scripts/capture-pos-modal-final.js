const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    try {
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({ ignoreHTTPSErrors: true });
        const page = await context.newPage();

        console.log('Logging in...');
        await page.goto('https://192.168.7.35:8072/');
        await page.locator('#username').fill('ramesh');
        await page.locator('#password-input').fill('ABcd@321');
        await page.locator('button', { hasText: /log in/i }).click();
        await page.waitForTimeout(3000);

        await page.goto('https://192.168.7.35:8072/setup/merchant-setup');
        await page.waitForTimeout(5000);

        console.log('Clicking POS tab...');
        await page.locator('a.nav-link', { hasText: /^\s*POS\s*$/ }).click();
        await page.waitForTimeout(2000);
        
        console.log('Clicking Live tab...');
        await page.locator('a.nav-link', { hasText: 'Live' }).first().click();
        await page.waitForTimeout(2000);

        console.log('Searching for RHBQR170406...');
        // Try both Enter Merchant ID and Merchant ID placeholder
        const searchInput = page.locator('input[placeholder*="Merchant ID"]').first();
        await searchInput.fill('RHBQR170406');
        await page.getByRole('button', { name: 'Search' }).click();
        await page.waitForTimeout(2000);

        console.log('Clicking eye icon...');
        const eyeIcon = page.locator('table tbody tr').first().locator('button.btn-outline-primary').first();
        await eyeIcon.click();
        await page.waitForTimeout(3000);
        
        fs.writeFileSync('pos-view-modal.html', await page.evaluate(() => document.body.innerHTML));
        console.log('Finished capturing POS modal.');

        await browser.close();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();
