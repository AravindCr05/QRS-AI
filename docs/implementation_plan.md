# Validate QRT Upload UI Scenarios

This plan details the steps to implement an automated End-to-End (E2E) test using Playwright to verify that the uploaded QRT files correctly reflect in the system's reporting UI.

## Goal
Verify the successful ingestion and rendering of the QRT CSV files by validating entries on the **File Processing** page and the **QR Transaction** reports page (Summary & Detail tabs) as per the exact criteria specified.

## Proposed Changes

### 1. Extractor Script (`scripts/upload-qrt-unc.js`)
#### [MODIFY] `scripts/upload-qrt-unc.js`
- Standardize the upload script to write the details of the latest uploaded file (e.g., File Name, Merchant ID, Total Amount, Transaction Count, Transaction Reference) into a local `test-data/last-upload.json` file.
- This decoupling allows the Playwright test to pick up the exact dynamically generated `_171xxx` suffix and unique transaction references predictably.

---
### 2. Page Objects
#### [NEW] `pages/file-processing.page.ts`
- Implement locators and routines for:
  - Navigating to Top Menu > Reports > File Processing (`/reports/file-processing-report`)
  - Searching by `File Name`
  - Asserting the table row displays accurate `File ID`, `Merchant ID`, `File Name`, `File Type`, `File Path`, `Direction`, `Transaction Count`, `Transaction Amount`, `Status` (IMPORTED), `Processed On`, and `Modified On`.

#### [NEW] `pages/qr-transaction.page.ts`
- Implement locators and routines for:
  - Navigating to Top Menu > Reports > Transaction > QR Transaction (`/reports/qr-transaction-report`)
  - **Summary Tab:** Searching by `Merchant ID`, and extracting/asserting values in the summary row (`ICA Account Number`, `Merchant ID`, `QRS Merchant Name`, `Total Transaction`, `Total Amount`, `Status`).
  - **Detail Tab:** Searching by `Transaction Reference Number`, and extracting/asserting details in the granular row (`Transaction Date`, `Transaction Reference Number`, `ICA Account Number`, `Merchant ID`, `QRS Merchant Name`, `Outlet Name`, `Cashier ID`, `Amount`, `QRT Status`).

---
### 3. Test Spec
#### [NEW] `tests/qrt-upload-validation.spec.ts`
- **BeforeAll:** Execute the unified upload script to dynamically push the QRT file to the UNC share and save metadata to `last-upload.json`.
- **Test 1: File Processing Validation**
  - Read input data. Log in as a valid reporting user.
  - Navigate to File Processing, search by filename.
  - Assert all specified details mirror the uploaded context.
- **Test 2: QR Transaction Summary & Detail Validation**
  - Navigate to the QR Transaction report.
  - Perform the Summary search & validation utilizing `Merchant ID`.
  - Navigate to Detail Tab. Perform search & validation utilizing `Transaction Reference Number`.

## User Review Required
> [!IMPORTANT]  
> 1. **URL structure:** Ensure my top-menu parsing is correct: `File Processing` falls under `Reports` natively, and `QR Transaction` sits beneath `Transaction` within `Reports`.
> 2. **Polling for UI rendering:** The script pushes to the UNC share. It may take a minute for the background job to parse `IMPORTED`. The E2E test will implement a soft retry polling loop or adequate `waitForTimeout` so it doesn't fail prematurely.

## Verification Plan

### Automated Tests
Execute `npx playwright test tests/qrt-upload-validation.spec.ts --headed` and assert all row headers match exact values from the system-generated input file.
