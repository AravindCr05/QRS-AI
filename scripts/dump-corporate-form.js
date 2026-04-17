require('dotenv').config();
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  
  // Login
  await page.goto(process.env.BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.fill('input[placeholder*="username" i]', process.env.LOGIN_USERNAME);
  await page.fill('input[placeholder*="password" i]', process.env.LOGIN_PASSWORD);
  await page.click('button:has-text("Log In")');
  await page.waitForTimeout(2000);

  // Navigate to Merchant Management
  await page.click('text=Setup');
  await page.click('text=Merchant Management');
  await page.waitForTimeout(1000);
  
  // Go to Live tab and click Create Corporate
  await page.locator('div[role="tab"], button, a').getByText('Live', { exact: true }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: /create corporate/i }).click();
  await page.waitForTimeout(2000);

  // Extract form fields
  const getFieldInfo = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
    return inputs.map(input => {
      // find nearest label or placeholder
      let name = input.getAttribute('placeholder') || '';
      const label = input.closest('div')?.querySelector('label') || input.closest('.form-group')?.querySelector('label') || document.querySelector(`label[for="${input.id}"]`);
      if (label) name = label.textContent.trim();
      return {
        type: input.tagName.toLowerCase() === 'input' ? input.getAttribute('type') : input.tagName.toLowerCase(),
        name: name,
        id: input.id,
        className: input.className
      };
    }).filter(f => f.type !== 'hidden');
  });

  console.log(JSON.stringify(getFieldInfo, null, 2));

  await browser.close();
})();
