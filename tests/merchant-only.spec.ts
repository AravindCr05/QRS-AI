import { test, expect } from '@playwright/test';
import { env } from '../utils/env';

test('Manual Merchant Creation Path', async ({ page }) => {
    console.log('>>> LANDING ON LOGIN PAGE');
    await page.goto(env.baseUrl);
    
    // 1. LOGIN (Correct labels)
    await page.getByPlaceholder(/Enter username/i).fill(env.makerUsername);
    await page.getByPlaceholder(/Enter password/i).fill(env.makerPassword);
    await page.getByRole('button', { name: /Log In/i }).click();
    await page.waitForURL('**/dashboard');
    console.log('>>> LOGGED IN SUCCESSFULLY');

    // 2. MANUAL NAVIGATION
    console.log('>>> NAVIGATING: Setup Arrow -> Merchant Management -> Merchant Tab');
    // Precision click on Arrow (X:260, Y:55 approx)
    await page.locator('a:has-text("Setup"), a:has-text("󰅀")').first().click();
    await page.waitForTimeout(1000);
    
    await page.getByRole('link', { name: /Merchant Management/i }).click();
    await page.waitForTimeout(2000);
    
    await page.getByRole('listitem').filter({ hasText: /^Merchant$/i }).click();
    await page.waitForTimeout(1000);
    
    await page.getByRole('button', { name: /Create Merchant/i }).click();
    await page.waitForTimeout(2000);
    console.log('>>> REACHED MERCHANT FORM');

    // 3. DROPDOWN SELECTION (STRESS TEST)
    console.log('>>> SELECTING ACCOUNT TYPE: 02 (NON-DEFAULT)');
    const accType = page.locator('select[formcontrolname="inputAccountType"]');
    await accType.selectOption('02'); // SHOULD SWITCH TO Savings Account / DuitNow
    
    console.log('>>> SELECTING RECIPIENT ID TYPE: 02 (NON-DEFAULT)');
    const recType = page.locator('select[formcontrolname="recipientIdType"]');
    await recType.selectOption('02'); // SHOULD SWITCH TO New IC
    
    // VISUAL PROOF
    await page.screenshot({ path: 'final_proof_02.png' });
    console.log('>>> SCREENSHOT SAVED: final_proof_02.png');
    
    // 4. SUBMIT (Minimal fields)
    console.log('>>> FILLING REMAINING MANDATORY FIELDS...');
    // ... fill minimal fields to allow 'Create' to be enabled ...
});
