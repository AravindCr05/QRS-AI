import { expect, Page, test } from '@playwright/test';
import { CorporatePage, type CorporateRecord } from '../pages/corporate.page';
import { LoginPage } from '../pages/login.page';
import { env } from '../utils/env';
import { reportStep, setExpectedResult } from '../utils/reporting';

function buildCorporateRecord(seed = Date.now().toString().slice(-6), withOptionalFields = true): CorporateRecord {
  const record: CorporateRecord = {
    corpId: seed,
    subsidiaryId: `SID${seed}`,
  };
  if (withOptionalFields) {
    record.corporateName = `CN${seed}`;
  }
  return record;
}

async function loginAs(page: Page, username: string, password: string) {
  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.fillUsername(username);
  await loginPage.fillPassword(password);
  await loginPage.loginButton.click();
  await expect(page).not.toHaveURL(/auth\/login/i);
}

test.describe('QRS BO Portal - Merchant Management Corporate', () => {
  test.describe.configure({ timeout: 180000, mode: 'serial' });

  test('QRS_BO Portal_Setup_Merchant Management_Live Tab_Corporate Tab_Verify Successful Navigation to the Create Corporate Page', async ({ page }) => {
    const corporatePage = new CorporatePage(page);
    await setExpectedResult('Clicking "+ Create Corporate" should open the Create Corporate page.');

    await reportStep(page, 'Precondition:1)Log into the QRS UI Portal with the valid maker credentials.2)Navigate to the Setup module and click the Merchant Management.', '', async () => {
      await loginAs(page, env.username, env.password);
      await corporatePage.openMerchantManagement();
      await corporatePage.openLiveTab();
    });

    await reportStep(page, 'Click on the "+ Create Corporate" button to open the Corporate Creation Form.', 'Create Corporate page should be displayed.', async () => {
      await corporatePage.createCorporateButton.click();
      await expect.soft(corporatePage.corpIdInput).toBeVisible();
      await expect.soft(corporatePage.subsidiaryIdInput).toBeVisible();
      await expect.soft(corporatePage.corporateNameInput).toBeVisible();
      await expect.soft(corporatePage.createButton).toBeVisible();
    });
  });

  test('QRS_BO Portal_Setup_Merchant Management_Live Tab_Corporate Tab_Verify successful pop-up message after Corporate creation', async ({ page }) => {
    const corporatePage = new CorporatePage(page);
    const record = buildCorporateRecord();
    await setExpectedResult('Corporate should be created and a success pop-up message should be displayed.');

    await reportStep(page, 'Precondition:1. Login into QRS BO portal with valid maker credentials2. User should have navigated to the live tab of Corporate tab in the Mechant Management page', '', async () => {
      await loginAs(page, env.username, env.password);
      await corporatePage.openCreateCorporateForm();
    });

    await reportStep(page, 'Fill the required fields and Click the Create button', 'Corporate should be created and a success pop-up message should be displayed.', async () => {
      await corporatePage.createCorporate(record);
      await expect.soft(corporatePage.successMessage()).toBeVisible();
    });
  });

  test('QRS_BO Portal_Setup_Merchant Management_Live tab_Corporate Tab_Create Corporate_Verify Successful Creation of an Corporate in QRS UI Using Mandatory Fields Only', async ({ page }) => {
    const corporatePage = new CorporatePage(page);
    const record = buildCorporateRecord(undefined, false);
    await setExpectedResult('Corporate should be created successfully using only the mandatory fields and should appear in Review tab.');

    await reportStep(page, 'Precondition:1)Log into the QRS UI Portal with the valid credentials.2)Navigate to the Setup module and click the Merchant Management.3)Click + Create Corporate button and navigate to the Create Corporate Page.', '', async () => {
      await loginAs(page, env.username, env.password);
      await corporatePage.openCreateCorporateForm();
    });

    await reportStep(page, 'Enter values in all the mandatory field and Click Create button.', 'Corporate create request should be submitted successfully.', async () => {
      await corporatePage.createCorporate(record);
      await expect.soft(corporatePage.successMessage()).toBeVisible();
      await corporatePage.reviewTab.click();
      await corporatePage.expectRecordVisibleInCurrentTab(record);
    });
  });

  test('QRS_BO Portal_Setup_Merchant Management_Live tab_Corporate Tab_Create Corporate_Verify Successful Approval of an created Corporate in QRS UI Using Mandatory Fields Only', async ({ page }) => {
    test.skip(!env.checkerUsername || !env.checkerPassword, 'Checker credentials are required to run approval coverage.');
    const corporatePage = new CorporatePage(page);
    const record = buildCorporateRecord(undefined, false);
    await setExpectedResult('Corporate should be approved successfully, removed from Review, and shown in Live and History tabs.');

    await reportStep(page, 'Precondition:1)Log into the QRS UI Portal with the valid maker credentials.2)Navigate to the Setup module and create a Corporate in Merchant Management.', '', async () => {
      await loginAs(page, env.username, env.password);
      await corporatePage.openCreateCorporateForm();
      await corporatePage.createCorporate(record);
      await expect.soft(corporatePage.successMessage()).toBeVisible();
      await corporatePage.logout();
    });

    await reportStep(page, 'Log in as Checker and navigate to Review Tab.', 'Created Corporate should be available in Review tab.', async () => {
      await loginAs(page, env.checkerUsername, env.checkerPassword);
      await corporatePage.openReviewRow(record.corpId);
    });

    await reportStep(page, 'Click Eye icon for the respective Corporate record in Review list data table.', 'Corporate details page should be opened.', async () => {
      await corporatePage.expectCorporateFormReadOnly(record);
    });

    await reportStep(page, 'Click the Approve button', 'Corporate should be approved successfully.', async () => {
      await corporatePage.approveButton.click();
      await expect.soft(corporatePage.successMessage()).toBeVisible();
    });

    await reportStep(page, 'Verify that the Approved Corporate record is removed from Review tab and displayed in Live and History tab.', 'Corporate should be removed from Review tab and visible in Live and History.', async () => {
      await corporatePage.openMerchantManagement();
      await corporatePage.reviewTab.click();
      await expect.soft(page.getByText(record.corpId, { exact: true })).toHaveCount(0);
      await corporatePage.openLiveTab();
      await corporatePage.expectRecordVisibleInCurrentTab(record);
      await corporatePage.openHistoryTab();
      await corporatePage.expectRecordVisibleInCurrentTab(record);
    });
  });

  test('QRS_BO Portal_Setup_Merchant Management_Live tab_Corporate Tab_Create Corporate_Verify Successful Creation of an Corporate in QRS UI entering values in all the fields', async ({ page }) => {
    const corporatePage = new CorporatePage(page);
    const record = buildCorporateRecord();
    await setExpectedResult('Corporate should be created successfully using all fields and should appear in Review tab.');

    await reportStep(page, 'Precondition:1)Log into the QRS UI Portal with the valid credentials.2)Navigate to the Setup module and click the Merchant Management.3)Click + Create Corporate button and navigate to the Create Corporate Page.', '', async () => {
      await loginAs(page, env.username, env.password);
      await corporatePage.openCreateCorporateForm();
    });

    await reportStep(page, 'Enter values in all the fields and Click Create button.', 'Corporate create request should be submitted successfully.', async () => {
      await corporatePage.createCorporate(record);
      await expect.soft(corporatePage.successMessage()).toBeVisible();
      await corporatePage.reviewTab.click();
      await corporatePage.expectRecordVisibleInCurrentTab(record);
    });
  });

  test('QRS_BO Portal_Setup_Merchant Management_Live tab_Corporate Tab_Create Corporate_Verify Successful Approval of an Corporate in QRS UI entering Values in all the fields.', async ({ page }) => {
    test.skip(!env.checkerUsername || !env.checkerPassword, 'Checker credentials are required to run approval coverage.');
    const corporatePage = new CorporatePage(page);
    const record = buildCorporateRecord();
    await setExpectedResult('Corporate should be approved successfully with all fields, removed from Review, and shown in Live and History tabs.');

    await reportStep(page, 'Precondition:1)Log into the QRS UI Portal with the valid maker credentials.2)Navigate to the Setup module and create a Corporate in Merchant Management.', '', async () => {
      await loginAs(page, env.username, env.password);
      await corporatePage.openCreateCorporateForm();
      await corporatePage.createCorporate(record);
      await expect.soft(corporatePage.successMessage()).toBeVisible();
      await corporatePage.logout();
    });

    await reportStep(page, 'Log in as Checker and navigate to Review Tab.', 'Created Corporate should be available in Review tab.', async () => {
      await loginAs(page, env.checkerUsername, env.checkerPassword);
      await corporatePage.openReviewRow(record.corpId);
    });

    await reportStep(page, 'Click Eye icon for the respective Corporate record in Review list data table.', 'Corporate details page should be opened.', async () => {
      await corporatePage.expectCorporateFormReadOnly(record);
    });

    await reportStep(page, 'Click the Approve button', 'Corporate should be approved successfully.', async () => {
      await corporatePage.approveButton.click();
      await expect.soft(corporatePage.successMessage()).toBeVisible();
    });

    await reportStep(page, 'Verify that the Approved Corporate record is removed from Review tab and displayed in Live and History tab.', 'Corporate should be removed from Review tab and visible in Live and History.', async () => {
      await corporatePage.openMerchantManagement();
      await corporatePage.reviewTab.click();
      await expect.soft(page.getByText(record.corpId, { exact: true })).toHaveCount(0);
      await corporatePage.openLiveTab();
      await corporatePage.expectRecordVisibleInCurrentTab(record);
      await corporatePage.openHistoryTab();
      await corporatePage.expectRecordVisibleInCurrentTab(record);
    });
  });

  test('QRS_BO Portal _Merchant Management _Live Tab _Corporate Tab_Verify Creation of a New Corporate Using the Same Corporate ID as One Previously Rejected by the Checker', async ({ page }) => {
    test.skip(!env.checkerUsername || !env.checkerPassword, 'Checker credentials are required.');
    const corporatePage = new CorporatePage(page);
    const record = buildCorporateRecord();
    await setExpectedResult('Maker can successfully reuse a rejected Corporate ID to create a new record.');

    await reportStep(page, 'Maker creates a Corporate', '', async () => {
      await loginAs(page, env.username, env.password);
      await corporatePage.openCreateCorporateForm();
      await corporatePage.createCorporate(record);
      await corporatePage.logout();
    });

    await reportStep(page, 'Checker logs in and rejects it', '', async () => {
      await loginAs(page, env.checkerUsername, env.checkerPassword);
      await corporatePage.openReviewRow(record.corpId);
      await corporatePage.rejectButton.click();
      await expect.soft(corporatePage.successMessage()).toBeVisible();
      await corporatePage.logout();
    });

    await reportStep(page, 'Maker creates a NEW corporate with the exact same ID', 'Creation should succeed since previous was rejected.', async () => {
      await loginAs(page, env.username, env.password);
      await corporatePage.openCreateCorporateForm();
      await corporatePage.createCorporate(record);
      await expect.soft(corporatePage.successMessage()).toBeVisible();
    });
  });

  test('QRS_BO Portal - Merchant Management - Live Tab - Corporate Tab_Verify That a New Corporate Using the Same Corporate ID as a Previously Rejected Corporate Can Be Created and Approved by the Checker', async ({ page }) => {
    test.skip(!env.checkerUsername || !env.checkerPassword, 'Checker credentials are required.');
    const corporatePage = new CorporatePage(page);
    const record = buildCorporateRecord();
    await setExpectedResult('Checker can successfully approve a recreated Corporate record that was previously rejected.');

    await reportStep(page, 'Maker creates, Checker rejects, Maker recreates', '', async () => {
      // Maker creates
      await loginAs(page, env.username, env.password);
      await corporatePage.openCreateCorporateForm();
      await corporatePage.createCorporate(record);
      await corporatePage.logout();

      // Checker rejects
      await loginAs(page, env.checkerUsername, env.checkerPassword);
      await corporatePage.openReviewRow(record.corpId);
      await corporatePage.rejectButton.click();
      await corporatePage.logout();

      // Maker recreates
      await loginAs(page, env.username, env.password);
      await corporatePage.openCreateCorporateForm();
      await corporatePage.createCorporate(record);
      await corporatePage.logout();
    });

    await reportStep(page, 'Checker logs in and approves the recreated record', 'Approval should succeed.', async () => {
      await loginAs(page, env.checkerUsername, env.checkerPassword);
      await corporatePage.openReviewRow(record.corpId);
      await corporatePage.approveButton.click();
      await expect.soft(corporatePage.successMessage()).toBeVisible();
    });
  });

  test('QRS_BO Portal_Merchant Management_Corporate Tab_Column and field data validation after merchant creation and approval', async ({ page }) => {
    test.skip(!env.checkerUsername || !env.checkerPassword, 'Checker credentials are required.');
    const corporatePage = new CorporatePage(page);
    const record = buildCorporateRecord();
    await setExpectedResult('Columns across all tabs should correctly match exact headers, and field data should reflect the appropriate record values and user names.');

    await reportStep(page, 'Maker creates a Corporate to kick off workflow and navigates to Review tab', '', async () => {
      await loginAs(page, env.username, env.password);
      await corporatePage.openCreateCorporateForm();
      await corporatePage.createCorporate(record);
      await corporatePage.reviewTab.click();
    });

    await reportStep(page, 'Verify Review tab headers and specific row data', '', async () => {
      const reviewHeaders = ['Outlet ID / Merchant ID / Corp ID', 'Module', 'Activity', 'Last Modified By', 'Last Modified On', 'Action'];
      for (const header of reviewHeaders) {
        await expect.soft(page.locator('table th').getByText(header, { exact: true }).first()).toBeVisible();
      }
      
      const row = page.locator('tr', { hasText: record.corpId }).first();
      await expect.soft(row).toBeVisible();
      await expect.soft(row).toContainText('Corporate');
      await expect.soft(row).toContainText('CREATE');
      await expect.soft(row).toContainText(env.username);
    });

    await reportStep(page, 'Checker approves the Corporate record', '', async () => {
      await corporatePage.logout();
      await loginAs(page, env.checkerUsername, env.checkerPassword);
      await corporatePage.openReviewRow(record.corpId);
      await corporatePage.approveButton.click();
      await expect.soft(corporatePage.successMessage()).toBeVisible();
    });

    await reportStep(page, 'Verify Live tab headers and specific row data', '', async () => {
      await corporatePage.openMerchantManagement();
      await corporatePage.openLiveTab();
      
      const liveHeaders = ['Corp ID', 'Subsidiary ID', 'Corporate Name', 'Onboarded By', 'Onboarded On', 'Last Modified By', 'Last Modified On', 'Action'];
      for (const header of liveHeaders) {
        await expect.soft(page.locator('table th').getByText(header, { exact: true }).first()).toBeVisible();
      }
      
      const row = page.locator('tr', { hasText: record.corpId }).first();
      await expect.soft(row).toBeVisible();
      await expect.soft(row).toContainText(record.subsidiaryId);
      if (record.corporateName) {
        await expect.soft(row).toContainText(record.corporateName);
      }
      await expect.soft(row).toContainText(env.username); 
    });

    await reportStep(page, 'Verify History tab headers and specific row data', '', async () => {
      await corporatePage.openHistoryTab();
      
      const historyHeaders = ['Corp ID', 'Subsidiary ID', 'Corporate Name', 'Activity', 'Review Status', 'Onboarded By', 'Onboarded On', 'Last Modified By', 'Last Modified On'];
      for (const header of historyHeaders) {
        await expect.soft(page.locator('table th').getByText(header, { exact: true }).first()).toBeVisible();
      }
      
      const row = page.locator('tr', { hasText: record.corpId }).first();
      await expect.soft(row).toBeVisible();
      await expect.soft(row).toContainText('APPROVED');
      await expect.soft(row).toContainText(env.checkerUsername || '');
    });
  });

  test('QRS_BO Portal_Setup_Corporate Management_Review Tab_Verify Corporate Creation approval and rejection behavior', async ({ page }) => {
    test.skip(!env.checkerUsername || !env.checkerPassword, 'Checker credentials are required.');
    const corporatePage = new CorporatePage(page);
    const record = buildCorporateRecord();
    await setExpectedResult('Corporate should be rejected successfully by checker, removed from Review tab, and shown in History tab as rejected.');

    await reportStep(page, 'Maker creates a new Corporate', '', async () => {
      await loginAs(page, env.username, env.password);
      await corporatePage.openCreateCorporateForm();
      await corporatePage.createCorporate(record);
      await corporatePage.logout();
    });

    await reportStep(page, 'Checker logs in and clicks Reject on the Corporate', 'Corporate should be rejected.', async () => {
      await loginAs(page, env.checkerUsername, env.checkerPassword);
      await corporatePage.openReviewRow(record.corpId);
      await corporatePage.expectCorporateFormReadOnly(record);
      await corporatePage.rejectButton.click();
      await expect.soft(corporatePage.successMessage()).toBeVisible();
    });

    await reportStep(page, 'Verify Corporate is removed from Review but visible in History', '', async () => {
      await corporatePage.openMerchantManagement();
      await corporatePage.reviewTab.click();
      await expect.soft(page.getByText(record.corpId, { exact: true })).toHaveCount(0);
      await corporatePage.openLiveTab();
      await expect.soft(page.getByText(record.corpId, { exact: true })).toHaveCount(0); // Should not be in live
      await corporatePage.openHistoryTab();
      await corporatePage.expectRecordVisibleInCurrentTab(record);
    });
  });

  test('QRS_Setup_Merchant Management_Corporate_Creation_Verify that the previously existing Corporate\'s details are incorrectly displayed in all fields of the Edit Corporate page under the Review Tab.', async () => {
    test.fixme(true, 'On hold: depends on existing duplicate-corporate behavior and edit-form verification for a pre-created rejected record.');
  });
});
