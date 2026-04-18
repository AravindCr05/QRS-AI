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

    console.log('Getting all text content on page to find menus...');
    const bodyText = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync('home-body.txt', bodyText);
    
    // Look for top navigation links
    const navLinks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a, button, [role="button"], .nav-link')).map(el =>({
            text: el.innerText.trim(),
            href: el.href || null,
            className: el.className
        })).filter(item => item.text);
    });
    fs.writeFileSync('nav-links.json', JSON.stringify(navLinks, null, 2));

    await browser.close();
})();
