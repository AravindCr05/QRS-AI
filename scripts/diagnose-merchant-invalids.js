require('dotenv').config();
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);

  // Login as Maker
  await page.goto(process.env.BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.fill('input[placeholder*="username" i]', process.env.LOGIN_USERNAME);
  await page.fill('input[placeholder*="password" i]', process.env.LOGIN_PASSWORD);
  await page.click('button:has-text("Log In")');
  await page.waitForTimeout(2000);

  // Navigate to Merchant tab -> Create
  await page.click('text=Setup');
  await page.click('text=Merchant Management');
  await page.waitForTimeout(800);
  const merchantTab = page.locator('li, [role="tab"], .nav-link').getByText('Merchant', { exact: true }).first();
  await merchantTab.click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /Create Merchant/i }).click();
  await page.waitForTimeout(1500);

  const seed = Date.now().toString().slice(-5);

  // Fill Merchant ID
  await page.locator('ng-select[placeholder="Select Merchant ID"]').getByRole('textbox').click();
  const options = await page.getByRole('option').allTextContents();
  console.log('Merchant ID options (first 5):', options.slice(0, 5));
  // Pick the first available option
  await page.getByRole('option').first().click();
  await page.waitForTimeout(300);

  // Business Sector
  await page.locator('#businessSector').getByRole('textbox').click();
  await page.getByRole('option', { name: /others/i }).first().click();
  await page.waitForTimeout(300);

  // Text fields
  await page.getByRole('textbox', { name: /qrs merchant name/i }).fill('QRSAuto' + seed);
  await page.getByRole('textbox', { name: /^enter brn$/i }).fill('BRN' + seed);
  await page.getByRole('textbox', { name: /outlet id/i }).fill('OID' + seed);
  await page.getByRole('textbox', { name: /outlet name/i }).fill('ON' + seed);
  await page.getByRole('textbox', { name: /cashier name/i }).fill('CASH' + seed);

  // Cashier IDs
  await page.getByRole('textbox', { name: /add cashier id/i }).fill('C01');
  await page.getByRole('textbox', { name: /add cashier id/i }).press('Enter');

  // Bank
  await page.locator('ng-select[placeholder="Search by Bank Name or BIC Code"]').getByRole('textbox').click();
  await page.waitForTimeout(500);
  const bankOptions = await page.getByRole('option').allTextContents();
  console.log('Bank options (first 5):', bankOptions.slice(0, 5));
  await page.getByRole('option', { name: /public bank/i }).first().click();
  await page.waitForTimeout(300);

  // Account details
  await page.getByRole('textbox', { name: /account name/i }).fill('ACC' + seed);
  await page.getByRole('textbox', { name: /account number/i }).fill('1234' + seed);

  // Comboboxes
  const combos = await page.getByRole('combobox').all();
  console.log('Number of comboboxes:', combos.length);
  for (const [i, cb] of combos.entries()) {
    const opts = await cb.locator('option').allTextContents();
    console.log(`  combobox[${i}]:`, opts);
  }

  await page.getByRole('textbox', { name: /recipient id details/i }).fill('ID' + seed);
  await page.getByRole('textbox', { name: /recipient phone/i }).fill('09876' + seed);
  await page.getByRole('textbox', { name: /recipient email/i }).fill('rec' + seed + '@test.com');

  // Status
  await page.locator('select').last().selectOption('Active');
  await page.waitForTimeout(500);

  // Check invalid fields
  const invalidFields = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.ng-invalid')).map(el => ({
      tag: el.tagName,
      id: el.id,
      placeholder: el.getAttribute('placeholder'),
      formcontrolname: el.getAttribute('formcontrolname'),
      ngmodel: el.getAttribute('ng-reflect-name'),
    }));
  });
  console.log('\n--- NG-INVALID fields ---');
  console.log(JSON.stringify(invalidFields, null, 2));

  const btnDisabled = await page.locator('button[type="submit"]').isDisabled();
  console.log('\nCreate button disabled:', btnDisabled);

  await page.waitForTimeout(3000);
  await browser.close();
})();
