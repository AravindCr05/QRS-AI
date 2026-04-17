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

  // Capture select elements (for items per page) and table cell details
  const data = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select')).map(s => ({
      classes: s.className,
      id: s.id,
      options: Array.from(s.options).map(o => o.text.trim()),
      currentValue: s.value
    }));
    
    // Check first 5 rows of columns
    const rows = Array.from(document.querySelectorAll('table tr')).slice(1, 6).map(tr => {
       const cells = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
       return cells;
    });

    return { selects, rows };
  });

  console.log('--- MERCHANT REVIEW TAB NAVIGATION DATA ---');
  console.log(JSON.stringify(data, null, 2));

  await browser.close();
})();
