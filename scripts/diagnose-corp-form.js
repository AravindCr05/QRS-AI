require('dotenv').config();
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
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

  const corpId = 'DIAG' + Date.now().toString().slice(-4);
  console.log('Filling Corp ID:', corpId);
  await page.getByRole('textbox', { name: /corp id/i }).fill(corpId);
  await page.getByRole('textbox', { name: /subsidiary id/i }).fill('SUB' + corpId);
  await page.getByRole('textbox', { name: /corporate name/i }).fill('Diag ' + corpId);
  
  const btn = page.getByRole('button', { name: /^create$/i });
  const isDisabled = await btn.isDisabled();
  console.log('Create button disabled:', isDisabled);

  if (!isDisabled) {
    await btn.click();
    await page.waitForTimeout(2000);
    const toast = await page.locator('.toast-container').innerHTML();
    console.log('Toast content:', toast);
  } else {
    // Check invalid fields
    const invalidFields = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.ng-invalid')).map(el => ({
            tag: el.tagName,
            placeholder: el.getAttribute('placeholder'),
            name: el.getAttribute('name') || el.getAttribute('formcontrolname')
        }));
    });
    console.log('Invalid fields:', invalidFields);
  }

  await browser.close();
})();
