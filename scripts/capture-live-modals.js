const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
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

    // 1. Merchant Live View
    console.log('Opening Merchant Live View...');
    await page.locator('a.nav-link', { hasText: 'Merchant' }).first().click();
    await page.waitForTimeout(1000);
    await page.locator('a.nav-link', { hasText: 'Live' }).first().click();
    await page.waitForTimeout(2000);
    
    // Search for the merchant
    await page.locator('input[placeholder="Enter Merchant ID"]').fill('RHBQR170406');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForTimeout(2000);

    const merchantEye = page.locator('table tbody tr').first().locator('button.btn-outline-primary').first();
    await merchantEye.click();
    await page.waitForTimeout(3000);
    fs.writeFileSync('merchant-view-modal.html', await page.evaluate(() => document.body.innerHTML));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // 2. POS Live View
    console.log('Opening POS Live View...');
    await page.locator('a.nav-link', { hasText: 'POS' }).first().click();
    await page.waitForTimeout(2000);
    await page.locator('a.nav-link', { hasText: 'Live' }).first().click();
    await page.waitForTimeout(2000);

    await page.locator('input[placeholder="Enter Merchant ID"]').fill('RHBQR170406');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForTimeout(2000);

    const posEye = page.locator('table tbody tr').first().locator('button.btn-outline-primary').first();
    await posEye.click();
    await page.waitForTimeout(3000);
    fs.writeFileSync('pos-view-modal.html', await page.evaluate(() => document.body.innerHTML));

    await browser.close();
})();
