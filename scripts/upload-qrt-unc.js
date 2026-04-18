/**
 * QRT File Generator — Local Network Share (UNC Path) Upload
 *
 * Generates a QRT file for POS RHBQR170406 with UNIQUE transaction references
 * and uploads it to the specified UNC share path with a filename suffix.
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// ── Config ────────────────────────────────────────────────────────────────────
const UNC_PATH = '\\\\192.168.7.60\\TesterShare\\QRS\\phase3-release3\\temp\\input\\qrt';
const FILE_SUFFIX = `_${Date.now()}`; // unique suffix e.g. _1713430860123

// ── Helpers ───────────────────────────────────────────────────────────────────
function today() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return { dd, mm, yyyy, full: `${dd}/${mm}/${yyyy}`, fileTag: `${dd}${mm}${yyyy}` };
}

function generateUniqueRef(index, date) {
    // Total max length = 30: 8 (date) + 8 (bank code) + 14 (sequence) = 30
    const seed = String(Date.now() + index);
    const seq = seed.slice(-14).padStart(14, '0');
    return `${date.yyyy}${date.mm}${date.dd}RHBBMYKL${seq}`;
}

function buildCsv(pos, merchant, date) {
    const collectionAccount = String(pos.icaAccount);
    const cashierId = String(merchant.cashierIds || 'CashierID001').split(';')[0].split(',')[0].trim();

    const txnDateTime = `${date.full} 10:30:00`;
    const txnRef     = generateUniqueRef(0, date);
    const trxRef     = `TRXREF${String(Date.now()).slice(-7)}`; // unique TRXREF
    const amount     = (Math.random() * (9000 - 100) + 100).toFixed(2);

    const lines = [
        'Daily QR Merchant Transaction Report',
        '',
        `Inquiry By,Daily`,
        `Merchant ID,${pos.merchantId}`,
        `Merchant Name,${pos.reflexMerchantName}`,
        `Status,${pos.status}`,
        `Manager ID,${pos.posAccountName}`,
        `Outlet Name,All Outlet`,
        `Transaction Date,${date.full}`,
        '',
        'Transaction Date & Time,Transaction Reference Number,Transaction Reference,Outlet Name,Amount (RM),Collection Account,Cashier ID,Source of Fund,DuitNow Participant',
        [txnDateTime, txnRef, trxRef, merchant.outletName, amount, collectionAccount, cashierId, 'QR Code', 'RHB Bank Berhad'].join(','),
        '',
        '',
        `Total No. of Transaction:,1`,
        `Total Transaction Amount (RM):,${amount}`,
        '',
    ];

    return {
        content: lines.join('\r\n'),
        amount: amount,
        txnRef: txnRef,
        trxRef: trxRef,
        sourceOfFund: 'QR Code',
        participant: 'RHB Bank Berhad'
    };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    const xlsxPath = path.resolve(__dirname, '../test-data/qrs_test_data.xlsx');
    const wb = XLSX.readFile(xlsxPath);

    const posRows      = XLSX.utils.sheet_to_json(wb.Sheets['POS'],      { defval: '' });
    const merchantRows = XLSX.utils.sheet_to_json(wb.Sheets['Merchant'], { defval: '' });

    const date = today();

    // Target POS RHBQR170406
    const pos = posRows.find(p => String(p.merchantId).trim() === 'RHBQR170406');
    if (!pos) { console.error('[ERROR] POS RHBQR170406 not found.'); process.exit(1); }

    // First linked merchant
    const merchant = merchantRows.find(m => String(m.merchantIdOption).trim() === 'RHBQR170406');
    if (!merchant) { console.error('[ERROR] No merchant linked to RHBQR170406.'); process.exit(1); }

    console.log(`[INFO] POS       : ${pos.merchantId}`);
    console.log(`[INFO] Merchant  : ${merchant.outletId} (${merchant.outletName})`);

    const { content: csvContent, amount, txnRef, trxRef, sourceOfFund, participant } = buildCsv(pos, merchant, date);
    const fileName   = `ReflexQR_DailyReport_${pos.merchantId}_${date.fileTag}${FILE_SUFFIX}.csv`;

    // ── Save locally first ─────────────────────────────────────────────────────
    const outputDir  = path.resolve(__dirname, '../test-data/qrt-output');
    fs.mkdirSync(outputDir, { recursive: true });
    const localPath  = path.join(outputDir, fileName);
    fs.writeFileSync(localPath, csvContent, 'utf8');
    console.log(`[GEN] Generated locally: ${localPath}`);

    // ── Copy to UNC Share ──────────────────────────────────────────────────────
    const remotePath = path.join(UNC_PATH, fileName);
    console.log(`[COPY] Copying to UNC: ${remotePath}`);
    fs.copyFileSync(localPath, remotePath);
    console.log(`[COPY] ✅ Uploaded successfully: ${remotePath}`);

    // ── Save exact upload info for automated tests ─────────────────────────────
    const infoPath = path.resolve(__dirname, '../test-data/last-upload.json');
    const uploadContext = {
        fileName: fileName,
        merchantId: pos.merchantId,
        outletId: merchant.outletId,
        qrsMerchantName: merchant.qrsMerchantName,
        icaAccountNumber: String(pos.icaAccount),
        outletName: merchant.outletName,
        cashierId: String(merchant.cashierIds || 'CashierID001').split(';')[0].split(',')[0].trim(),
        transactionCount: 1,
        transactionAmount: amount, 
        transactionReference: txnRef,
        trxReference: trxRef,
        sourceOfFund: sourceOfFund,
        participant: participant
    };
    fs.writeFileSync(infoPath, JSON.stringify(uploadContext, null, 2), 'utf8');
    console.log(`[INFO] Saved test context to ${infoPath}`);
}

main().catch(err => {
    console.error('[ERROR]', err.message);
    process.exit(1);
});
