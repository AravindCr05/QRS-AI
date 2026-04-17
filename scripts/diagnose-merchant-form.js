require('dotenv').config();
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  
  // Login as Maker
  await page.goto(process.env.BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.fill('input[placeholder*="username" i]', process.env.LOGIN_USERNAME);
  await page.fill('input[placeholder*="password" i]', process.env.LOGIN_PASSWORD);
  await page.click('button:has-text("Log In")');
  await page.waitForTimeout(2000);

  // Navigate to Merchant creation
  await page.click('text=Setup');
  await page.click('text=Merchant Management');
  await page.waitForTimeout(1000);
  await page.locator('li, [role="tab"], .nav-link').getByText('Merchant', { exact: true }).first().click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: /Create Merchant/i }).click();
  await page.waitForTimeout(2000);

  // Dump all ng-selects and their labels/placeholders
  const ngSelects = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('ng-select')).map(sel => {
      const parent = sel.parentElement;
      return {
        text: sel.innerText.trim(),
        html: sel.outerHTML.substring(0, 200),
        parentText: parent ? parent.innerText.trim() : ''
      };
    });
  });
  console.log('--- ALL NG-SELECTS ---');
  console.log(JSON.stringify(ngSelects, null, 2));

  await browser.close();
})();
