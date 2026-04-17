require('dotenv').config();
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  await page.goto(process.env.BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  async function usernameCase(value) {
    const username = page.locator('#username');
    await username.fill('');
    await username.fill(value);
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(200);
    const body = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    console.log('USERNAME_CASE', JSON.stringify(value), '=>', body.match(/Username is required\.|Must be at least 3 characters long\.|Username cannot be longer than 50 characters\.|Invalid Username format\./g));
  }

  async function passwordCase(value) {
    const password = page.locator('#password-input');
    await password.fill('');
    await password.fill(value);
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(200);
    const body = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    console.log('PASSWORD_CASE', JSON.stringify(value), '=>', body.match(/Password is required\.|Must be at least 3 characters long\./g));
  }

  for (const val of ['', 'ab', 'abc', 'abc123', '12345', '@@', '@@@', ' abc', 'abc ', 'a b', 'a'.repeat(51)]) {
    await usernameCase(val);
  }
  for (const val of ['', 'ab', 'abc', 'ABcd@321']) {
    await passwordCase(val);
  }

  const password = page.locator('#password-input');
  const toggleBtn = page.locator('button').first();
  await password.fill('ABcd@321');
  console.log('PASSWORD_TYPE_BEFORE:', await password.getAttribute('type'));
  await toggleBtn.click();
  await page.waitForTimeout(200);
  console.log('PASSWORD_TYPE_AFTER_FIRST_CLICK:', await password.getAttribute('type'));
  await toggleBtn.click();
  await page.waitForTimeout(200);
  console.log('PASSWORD_TYPE_AFTER_SECOND_CLICK:', await password.getAttribute('type'));

  await browser.close();
})();
