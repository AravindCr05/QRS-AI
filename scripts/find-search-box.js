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
  await page.waitForTimeout(1000);

  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(input => ({
      placeholder: input.getAttribute('placeholder'),
      classes: input.className,
      id: input.id,
      name: input.getAttribute('name'),
      type: input.getAttribute('type'),
      ariaLabel: input.getAttribute('aria-label')
    }));
  });

  console.log('--- INPUTS ON MERCHANT REVIEW TAB ---');
  console.log(JSON.stringify(inputs, null, 2));

  await browser.close();
})();
