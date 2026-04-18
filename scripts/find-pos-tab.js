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
    await page.waitForTimeout(5000);

    console.log('Listing all links and buttons on page to find POS...');
    const elements = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a, button, [role="tab"], .nav-link')).map(el => ({
            tag: el.tagName,
            text: el.innerText.trim(),
            role: el.getAttribute('role'),
            className: el.className
        })).filter(e => e.text);
    });
    fs.writeFileSync('nav_elements.json', JSON.stringify(elements, null, 2));

    await browser.close();
})();
