require('dotenv').config();
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  await page.goto(process.env.BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  console.log('TITLE:', await page.title());
  console.log('URL:', page.url());
  console.log('BODY_TEXT:', (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 1500));
  console.log('INPUTS:', JSON.stringify(await page.locator('input').evaluateAll(els => els.map(el => ({
    type: el.getAttribute('type'),
    name: el.getAttribute('name'),
    id: el.getAttribute('id'),
    placeholder: el.getAttribute('placeholder'),
    ariaLabel: el.getAttribute('aria-label'),
    value: el.value,
  }))), null, 2));
  console.log('BUTTONS:', JSON.stringify(await page.locator('button').evaluateAll(els => els.map(el => ({
    text: (el.textContent || '').trim(),
    ariaLabel: el.getAttribute('aria-label'),
    disabled: el.disabled,
    type: el.getAttribute('type'),
  }))), null, 2));

  const username = page.locator('input').nth(0);
  const password = page.locator('input').nth(1);
  await username.click();
  await page.locator('body').click({ position: { x: 10, y: 10 } });
  await page.waitForTimeout(500);
  console.log('AFTER_USERNAME_BLUR:', (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 1500));

  await password.click();
  await page.locator('body').click({ position: { x: 10, y: 10 } });
  await page.waitForTimeout(500);
  console.log('AFTER_PASSWORD_BLUR:', (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 1500));

  await browser.close();
})();
