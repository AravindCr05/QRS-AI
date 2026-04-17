require('dotenv').config();
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  await page.goto(process.env.BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.fill('input[placeholder*="username" i]', process.env.LOGIN_USERNAME);
  await page.fill('input[placeholder*="password" i]', process.env.LOGIN_PASSWORD);
  await page.click('button:has-text("Log In")');
  await page.waitForTimeout(2500);

  // Navigate to POS tab
  await page.click('text=Setup');
  await page.click('text=Merchant Management');
  await page.waitForTimeout(1000);
  await page.locator('text=POS').first().click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: /Create POS/i }).click();
  await page.waitForTimeout(1500);

  // Fill fields using exact codegen approach
  await page.locator('ng-select').getByRole('textbox').click();
  await page.waitForTimeout(500);
  const options = await page.getByRole('option').allTextContents();
  console.log('Available Corp ID options:', options.slice(0, 5));

  if (options.length > 0) {
    await page.getByRole('option').first().click();
    await page.waitForTimeout(500);
  }

  await page.getByRole('textbox', { name: 'Enter ICA Account' }).fill('27388' + Date.now().toString().slice(-4));
  await page.getByRole('textbox', { name: 'Enter Channel ID' }).fill('CH1234');
  await page.getByRole('textbox', { name: 'Enter Merchant ID' }).fill('MID' + Date.now().toString().slice(-6));
  await page.getByRole('textbox', { name: 'Enter Reflex Merchant Name' }).fill('ReflexTest');
  await page.getByRole('textbox', { name: 'Enter POS Partner BRN' }).fill('BRN123');
  await page.getByRole('textbox', { name: 'Enter POS Account Name' }).fill('ACC123');
  await page.getByRole('textbox', { name: 'Enter POS Name' }).fill('POSName');
  await page.getByRole('textbox', { name: 'Enter POS Phone' }).fill('0123456789');
  
  // Email — check exact name
  const emailInputs = await page.getByRole('textbox').all();
  for (const inp of emailInputs) {
    const name = await inp.getAttribute('placeholder');
    if (name && /email/i.test(name)) {
      console.log('Email input placeholder:', name);
    }
  }
  await page.getByRole('textbox', { name: /Enter POS Email/i }).fill('test@test.com');

  await page.getByRole('textbox', { name: 'Enter Profit Sharing Account Number' }).fill('2012345678');
  await page.getByRole('textbox', { name: 'Profit Sharing Ratio (%) *' }).fill('3');
  await page.getByRole('textbox', { name: 'Merchant Charges Package (%) *' }).fill('3');
  await page.getByRole('textbox', { name: 'Enter Input Directory' }).fill('/in/test');
  await page.getByRole('textbox', { name: 'Enter Output Directory' }).fill('/out/test');
  await page.getByRole('textbox', { name: 'Enter Statement Directory' }).fill('/stmt/test');

  // Status
  await page.locator('select').selectOption('Active');
  await page.waitForTimeout(1000);

  // Inspect all ng-invalid fields
  const invalidFields = await page.evaluate(() => {
    const invalids = document.querySelectorAll('.ng-invalid');
    return Array.from(invalids).map(el => ({
      tag: el.tagName,
      id: el.id,
      class: el.className,
      placeholder: el.getAttribute('placeholder'),
      label: el.getAttribute('aria-label') || el.getAttribute('name'),
    }));
  });
  console.log('\n--- NG-INVALID fields (blocking Create button) ---');
  console.log(JSON.stringify(invalidFields, null, 2));

  const btnDisabled = await page.locator('button[type="submit"]').isDisabled();
  console.log('\nCreate button disabled:', btnDisabled);

  await page.waitForTimeout(3000);
  await browser.close();
})();
