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

  // Navigate to Corporate creation
  await page.click('text=Setup');
  await page.click('text=Merchant Management');
  await page.waitForTimeout(1000);
  await page.getByText('Live', { exact: true }).click();
  await page.getByRole('button', { name: /create corporate/i }).click();
  await page.waitForTimeout(1000);

  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(i => ({
      placeholder: i.getAttribute('placeholder'),
      name: i.getAttribute('name'),
      fcn: i.getAttribute('formcontrolname'),
      id: i.id,
      type: i.type
    }));
  });
  console.log('--- CORPORATE FORM INPUTS ---');
  console.log(JSON.stringify(inputs.filter(i => i.placeholder || i.fcn), null, 2));

  await browser.close();
})();
