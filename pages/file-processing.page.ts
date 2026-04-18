import { expect, Locator, Page } from '@playwright/test';

export class FileProcessingPage {
  readonly reportsMenu: Locator;
  readonly fileProcessingMenu: Locator;
  readonly fileNameInput: Locator;
  readonly searchButton: Locator;
  readonly clearButton: Locator;
  readonly tableRows: Locator;

  constructor(private readonly page: Page) {
    this.reportsMenu = page.locator('a.nav-link.dropdown-toggle', { hasText: 'Reports' }).first();
    this.fileProcessingMenu = page.getByRole('link', { name: 'File Processing' });
    this.fileNameInput = page.getByPlaceholder('Enter File Name'); // Assuming placeholder
    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.clearButton = page.getByRole('button', { name: 'Clear' });
    this.tableRows = page.locator('tbody tr');
  }

  async navigateTo() {
    await this.reportsMenu.click();
    await this.fileProcessingMenu.click();
    await expect(this.page).toHaveURL(/.*file-processing-report/);
  }

  async searchByFileName(fileName: string) {
    // If specific input might not be placeholder-based, we can try robust finding.
    // Wait for network/page idle if needed
    for (const input of await this.page.locator('input').all()) {
      const placeholder = await input.getAttribute('placeholder');
      const formControlName = await input.getAttribute('formcontrolname');
      if ((placeholder && placeholder.includes('File Name')) || (formControlName && formControlName.includes('fileName'))) {
        await input.fill(fileName);
        break;
      }
    }
    
    // In case the above loop fails, just fill the first text input that might be file name
    // fallbacks can be handled in code if needed.
    
    await this.searchButton.click();
    await this.page.waitForLoadState('networkidle');
    // Allow UI to settle
    await this.page.waitForTimeout(1000);
  }

  async findRowByFileName(fileName: string) {
    return this.page.locator('tbody tr', { hasText: fileName }).first();
  }

  async getRowDetails(row: Locator) {
    // We expect headers similar to the criteria:
    // File ID, Merchant ID, File Name, File Type, File Path, Direction, Transaction Count, Transaction Amount, Status, Processed On, Modified On, Remarks
    // To be completely robust against column re-ordering, we could map headers to column index.
    // However, since we might just want to assert all text is present in the row, we can just do that or extract all table cell texts.
    
    const cells = await row.locator('td').allTextContents();
    return cells.map(c => c.trim());
  }

  async verifyRowText(row: Locator, expectedText: string) {
    await expect(row).toContainText(expectedText);
  }
}
