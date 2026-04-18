import { test } from '@playwright/test';
import { env } from '../utils/env';

test('Diagnostic: List Merchant Dropdown Options', async ({ page }) => {
    // 1. Login
    await page.goto('https://192.168.7.35:8072/auth/login');
    await page.fill('input[placeholder="Enter Username"]', 'nurhafifi');
    await page.fill('input[placeholder="Enter Password"]', '@rtLINE23Aa');
    await page.click('button:has-text("Log In")');
    await page.waitForURL('**/dashboard');

    // 2. Direct Navigation to Merchant Creation (skipping the menu hover issues)
    await page.goto('https://192.168.7.35:8072/setup/merchant-setup');
    await page.click('li:has-text("Merchant")');
    await page.click('button:has-text("Create Merchant")');
    await page.waitForSelector('select[formcontrolname="inputAccountType"]');

    // 3. Extract Options
    const getOptions = async (selector: string) => {
        return await page.evaluate((sel) => {
            const select = document.querySelector(sel) as HTMLSelectElement;
            if (!select) return [];
            return Array.from(select.options).map(opt => ({
                text: opt.text.trim(),
                value: opt.value.trim()
            }));
        }, selector);
    };

    console.log('\n--- ACCOUNT TYPE OPTIONS ---');
    console.log(JSON.stringify(await getOptions('select[formcontrolname="inputAccountType"]'), null, 2));

    console.log('\n--- RECIPIENT ID TYPE OPTIONS ---');
    console.log(JSON.stringify(await getOptions('select[formcontrolname="recipientIdType"]'), null, 2));

    console.log('\n--- STATUS OPTIONS ---');
    console.log(JSON.stringify(await getOptions('select[formcontrolname="status"]'), null, 2));
    
    console.log('\n--- DONE ---');
});
