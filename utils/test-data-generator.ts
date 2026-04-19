/**
 * Generates a unique set of identifiers for QRS onboarding and transaction verification.
 * Uses a timestamp suffix to ensure uniqueness across test runs.
 */
export function generateUniqueTestData() {
  const ts = Date.now().toString().slice(-6); // 6-digit suffix
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const fileDateTag = [
    String(now.getDate()).padStart(2, '0'),
    String(now.getMonth() + 1).padStart(2, '0'),
    now.getFullYear(),
  ].join('');
  
  // Rules:
  // Corporate ID: Max 6, numeric string (e.g. 6 digits)
  const corpId = ts;
  
  // Merchant ID: 11 length, starts with RHBQR (5 chars + 6 digits = 11)
  const merchantId = `RHBQR${ts}`;
  
  // Outlet ID: 9 length (e.g., OI + 7 digits = 9)
  const outletId = `OI${ts.padStart(7, '0')}`;
  
  // ICA Account: Numeric only, max 14 (we use timestamp-based 12 digits)
  const icaAccount = `180${Date.now().toString().slice(-7)}`;
  
  return {
    corpId: corpId,
    corporateName: `CORP${ts}`,
    subsidiaryId: `SUB${ts}`,
    merchantId: merchantId,
    outletId: outletId,
    icaAccount: icaAccount,
    qrsMerchantName: `QRSMN${ts}`,
    reflexMerchantName: `REFMN${ts}`, // Different from QRS name
    outletName: `ON${ts}`,
    cashierName: `CN_${ts}`,
    cashierId: `CID${ts}`,
    posName: `POS_${ts}`,
    posAccountName: `PAN_${ts}`, // Unique POS Account Name
    posEmail: `test_${ts}@example.com`,
    brn: `B${ts}`,
    accountNumber: `180${ts}${ts.slice(-4)}`,
    inputDirectory: `/testing/qrstestphase3/RHBQR${ts}/input`, // Unique dir
    outputDirectory: `/testing/qrstestphase3/RHBQR${ts}/output`, // Unique dir
    statementDirectory: `/testing/qrstestphase3/RHBQR${ts}/statement`, // Unique dir
    transactionReference: `TRX${dateStr}${ts}`,
    trxReference: `IREF${ts}`,
    transactionAmount: (Math.random() * 500 + 100).toFixed(2),
    fileName: `ReflexQR_DailyReport_${merchantId}_${fileDateTag}.csv`
  };
}
