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

  // Navigate to Merchant Management -> Merchant Tab -> Create Merchant
  await page.click('text=Setup');
  await page.click('text=Merchant Management');
  await page.waitForTimeout(1000);
  await page.locator('li, [role="tab"], .nav-link').getByText('Merchant', { exact: true }).first().click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: /Create Merchant/i }).click();
  await page.waitForTimeout(1000);

  console.log('--- SCANNING BANK DROPDOWN ---');
  // Find the bank dropdown
  const bankDropdown = page.locator('.merchant-setup-select.ng-select-searchable').first();
  await bankDropdown.click();
  await page.waitForTimeout(1000);
  
  const options = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.ng-option')).map(opt => opt.innerText.trim());
  });
  console.log('Available Bank Options:');
  console.log(options);

  await browser.close();
})();
