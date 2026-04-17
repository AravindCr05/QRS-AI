require('dotenv').config();
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  
  await page.goto(process.env.BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.fill('input[placeholder*="username" i]', process.env.LOGIN_USERNAME);
  await page.fill('input[placeholder*="password" i]', process.env.LOGIN_PASSWORD);
  await page.click('button:has-text("Log In")');
  await page.waitForTimeout(2000);

  await page.click('text=Setup');
  await page.click('text=Merchant Management');
  await page.waitForTimeout(2000);

  await page.locator('div[role="tab"], button, a').getByText('Review', { exact: true }).click();
  await page.waitForTimeout(2000);

  // Capture table headers and pagination buttons
  const data = await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll('table th')).map(th => th.innerText.trim());
    const paginationButtons = Array.from(document.querySelectorAll('.pagination a, .pagination button, .ngx-pagination a')).map(b => b.innerText.trim());
    return { headers, paginationButtons };
  });

  console.log('--- MERCHANT REVIEW TABLE DATA ---');
  console.log(JSON.stringify(data, null, 2));

  await browser.close();
})();
