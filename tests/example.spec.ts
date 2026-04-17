import { test, expect } from '@playwright/test';
import { reportStep, setExpectedResult } from '../utils/reporting';

test('QRS login page loads as the application entry point', async ({ page }) => {
  await setExpectedResult('The QRS application entry point should redirect to the login page and display the QRS login content.');

  await reportStep(
    page,
    'Open the QRS application entry page',
    'Application entry URL should open successfully and redirect to the QRS login page.',
    async () => {
      await page.goto('/');
      await expect(page).toHaveURL(/auth\/login/i);
    },
  );

  await reportStep(
    page,
    'Verify the QRS login landing page content',
    'The QRS title and Log In button should be visible on the landing page.',
    async () => {
      await expect(page).toHaveTitle(/QRS/i);
      await expect(page.getByText('QRS System', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
    },
  );
});
