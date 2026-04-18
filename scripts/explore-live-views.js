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

    console.log('Navigating to Setup > Merchant Management');
    await page.getByRole('link', { name: /setup/i }).first().click();
    await page.getByRole('link', { name: /merchant management/i }).click();
    await page.waitForTimeout(2000);

    // Live tab is supposedly active by default, or click it
    await page.getByText('Live', { exact: true }).click();
    await page.waitForTimeout(2000);

    console.log('Clicking on the first Merchant eye icon...');
    // Make sure we are on Merchant Tab
    await page.locator('li, [role="tab"], .nav-link').getByText('Merchant', { exact: true }).first().click();
    await page.waitForTimeout(1000);
    const merchantEyeIcons = page.locator('button.btn-outline-primary');
    if (await merchantEyeIcons.count() > 0) {
        await merchantEyeIcons.first().click();
        await page.waitForTimeout(2000);
        fs.writeFileSync('merchant-live-view.html', await page.content());
        await page.locator('button', { name: /cancel|close|back/i }).last().click().catch(()=>console.log('No cancel btn'));
    }

    // Now go to POS Tab
    console.log('Navigating to POS tab...');
    await page.getByRole('link', { name: /POS/i }).click().catch(()=>console.log('POS tab click failed'));
    await page.waitForTimeout(2000);
    // Click Live tab
    await page.getByText('Live', { exact: true }).click();
    await page.waitForTimeout(1000);
    const posEyeIcons = page.locator('button.btn-outline-primary');
    if (await posEyeIcons.count() > 0) {
        await posEyeIcons.first().click();
        await page.waitForTimeout(2000);
        fs.writeFileSync('pos-live-view.html', await page.content());
    }

    await browser.close();
})();
