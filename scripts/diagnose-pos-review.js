require('dotenv').config();
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);

  await page.goto(process.env.BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.fill('input[placeholder*="username" i]', process.env.LOGIN_USERNAME);
  await page.fill('input[placeholder*="password" i]', process.env.LOGIN_PASSWORD);
  await page.click('button:has-text("Log In")');
  await page.waitForTimeout(2000);

  // Navigate to POS Review tab
  await page.click('text=Setup');
  await page.click('text=Merchant Management');
  await page.waitForTimeout(800);
  await page.locator('text=POS').first().click();
  await page.waitForTimeout(800);
  await page.getByText('Review', { exact: true }).click();
  await page.waitForTimeout(1000);

  // Inspect first row buttons
  const firstRow = page.locator('table tbody tr').first();
  const buttons = await firstRow.locator('button').all();
  console.log('Buttons in first Review row:', buttons.length);
  for (const [i, btn] of buttons.entries()) {
    const text = await btn.textContent();
    const cls = await btn.getAttribute('class');
    console.log(`  btn[${i}]: text="${text.trim()}" class="${cls}"`);
  }

  // Check what toast classes exist after a quick action
  // Also check any existing toast/alert on page
  const toastEls = await page.evaluate(() => {
    const selectors = [
      '.toast', '.toast-success', '.toast-container',
      '.alert', '.alert-success',
      '.swal2-container', '.swal2-popup',
      '[class*="toast"]', '[class*="snack"]', '[class*="notification"]'
    ];
    const results = [];
    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      if (els.length > 0) {
        results.push({ selector: sel, count: els.length, firstClass: els[0].className });
      }
    }
    return results;
  });
  console.log('\nExisting toast/alert elements:', JSON.stringify(toastEls, null, 2));

  await browser.close();
})();
