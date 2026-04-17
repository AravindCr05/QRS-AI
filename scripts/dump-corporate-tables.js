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

  // Navigate to Merchant Management
  await page.click('text=Setup');
  await page.click('text=Merchant Management');
  await page.waitForTimeout(2000);

  async function dumpTableHeaders(tabName) {
    await page.locator('div[role="tab"], button, a').getByText(tabName, { exact: true }).click();
    await page.waitForTimeout(1000);
    const headers = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('table th')).map(th => th.innerText.trim()).filter(Boolean);
    });
    console.log(`--- ${tabName} TAB HEADERS ---`);
    console.log(headers);
  }

  await dumpTableHeaders('Live');
  await dumpTableHeaders('Review');
  await dumpTableHeaders('History');

  await browser.close();
})();
