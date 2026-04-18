const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();

    console.log('Navigating to login...');
    await page.goto('https://192.168.7.35:8072/');
    await page.locator('#username').fill('ramesh');
    await page.locator('#password-input').fill('ABcd@321');
    await page.locator('button', { hasText: /log in/i }).click();
    await page.waitForTimeout(3000);

    // Go to File Processing
    console.log('Navigating to File Processing...');
    await page.goto('https://192.168.7.35:8072/reports/file-processing-report');
    await page.waitForTimeout(3000);
    
    // We want to simulate a search for the file
    // Let's first capture the initial DOM
    fs.writeFileSync('file-processing-dom.html', await page.content());
    await page.screenshot({ path: 'file-processing-screenshot.png' });

    // Go to QR Transaction
    console.log('Navigating to QR Transaction...');
    await page.goto('https://192.168.7.35:8072/reports/qr-transaction-report');
    await page.waitForTimeout(3000);
    fs.writeFileSync('qr-transaction-dom.html', await page.content());
    await page.screenshot({ path: 'qr-transaction-screenshot.png' });

    await browser.close();
})();
