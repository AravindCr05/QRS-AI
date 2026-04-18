import 'dotenv/config';
import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL ?? 'https://192.168.7.35:8072/';
const USERNAME = process.env.LOGIN_USERNAME ?? 'ramesh';
const PASSWORD = process.env.LOGIN_PASSWORD ?? 'ABcd@321';

(async () => {
    const browser = await chromium.launch({
        headless: false,
        args: ['--start-maximized']
    });

    const context = await browser.newContext({
        ignoreHTTPSErrors: true,
        viewport: null // null = use window size (maximized)
    });

    const page = await context.newPage();

    console.log('Navigating to:', BASE_URL);
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    console.log('Logging in as:', USERNAME);
    await page.locator('input').first().fill(USERNAME);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('button').filter({ hasText: /log.?in/i }).click();
    await page.waitForTimeout(3000);

    console.log('Login complete. Browser will stay open - close it manually when done.');
    // Keep browser open indefinitely
    await new Promise(() => {});
})();
