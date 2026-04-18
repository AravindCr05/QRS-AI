/**
 * QRT File Generator + SFTP Uploader
 *
 * For each POS in the Excel file:
 *   1. Reads its linked Merchant outlets
 *   2. Generates a QRT Daily Report CSV
 *   3. Uploads it to the SFTP input directory
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const SftpClient = require('ssh2-sftp-client');

// ── SFTP Config ───────────────────────────────────────────────────────────────
const SFTP_CONFIG = {
    host: '192.168.7.15',
    port: 22,
    username: 'sftptest',
    password: '$t3PT3st@123',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function today() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return { dd, mm, yyyy, full: `${dd}/${mm}/${yyyy}`, fileTag: `${dd}${mm}${yyyy}` };
}

function randomAmount(min = 10, max = 9999) {
    return (Math.random() * (max - min) + min).toFixed(2);
}

function randomRef(index, date, merchantId) {
    const seq = String(index + 1).padStart(16, '0');
    return `${date.yyyy}${date.mm}${date.dd}RHBBMYKL${seq}`;
}

function generateTransactionRows(outlets, date, collectionAccount) {
    const rows = [];
    let total = 0;

    outlet_loop: for (let i = 0; i < outlets.length; i++) {
        const outlet = outlets[i];
        const timeH = String(10 + i).padStart(2, '0');
        const txnDateTime = `${date.full} ${timeH}:30:00`;
        const txnRef = randomRef(i, date, collectionAccount);
        const trxRef = `TRXREF${String(i + 1).padStart(7, '0')}`;
        const amount = parseFloat(randomAmount());
        total += amount;

        // Cashier IDs can be comma-separated; use first one
        const cashierId = String(outlet.cashierIds || 'CashierID001').split(';')[0].split(',')[0].trim();

        rows.push([
            txnDateTime,
            txnRef,
            trxRef,
            outlet.outletName || outlet.outletId,
            amount.toFixed(2),
            collectionAccount,
            cashierId,
            'QR Code',
            'RHB Bank Berhad'
        ]);
    }

    return { rows, total: total.toFixed(2) };
}

function buildCsv(pos, merchants, date) {
    const collectionAccount = String(pos.icaAccount);
    const { rows, total } = generateTransactionRows(merchants, date, collectionAccount);

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
        ...rows.map(r => r.join(',')),
        '',
        '',
        `Total No. of Transaction:,${rows.length}`,
        `Total Transaction Amount (RM):,${total}`,
        '',
    ];

    return lines.join('\r\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    const xlsxPath = path.resolve(__dirname, '../test-data/qrs_test_data.xlsx');
    const wb = XLSX.readFile(xlsxPath);

    const posRows = XLSX.utils.sheet_to_json(wb.Sheets['POS'], { defval: '' });
    const merchantRows = XLSX.utils.sheet_to_json(wb.Sheets['Merchant'], { defval: '' });

    const date = today();
    const outputDir = path.resolve(__dirname, '../test-data/qrt-output');
    fs.mkdirSync(outputDir, { recursive: true });

    const filesToUpload = [];

    for (const pos of posRows) {
        // Find merchants linked to this POS via merchantId / merchantIdOption
        const allLinked = merchantRows.filter(m =>
            String(m.merchantIdOption).trim() === String(pos.merchantId).trim()
        );

        if (allLinked.length === 0) {
            console.warn(`[WARN] No merchants linked to POS ${pos.merchantId} — skipping.`);
            continue;
        }

        // Use only the FIRST linked merchant for the QRT file
        const linked = [allLinked[0]];
        console.log(`[INFO] Using merchant: ${linked[0].outletId} (${linked[0].outletName}) for POS ${pos.merchantId}`);

        const csvContent = buildCsv(pos, linked, date);
        const fileName = `ReflexQR_DailyReport_${pos.merchantId}_${date.fileTag}.csv`;
        const localPath = path.join(outputDir, fileName);

        fs.writeFileSync(localPath, csvContent, 'utf8');
        console.log(`[GEN] Generated: ${fileName} (${linked.length} transactions)`);

        filesToUpload.push({
            localPath,
            remotePath: `${pos.inputDirectory}/${fileName}`,
            remoteDir: pos.inputDirectory,
        });
    }

    if (filesToUpload.length === 0) {
        console.error('[ERROR] No files generated. Check Excel merchant linkage.');
        process.exit(1);
    }

    // ── SFTP Upload ────────────────────────────────────────────────────────────
    const sftp = new SftpClient();
    try {
        console.log(`\n[SFTP] Connecting to ${SFTP_CONFIG.host}:${SFTP_CONFIG.port}...`);
        await sftp.connect(SFTP_CONFIG);
        console.log('[SFTP] Connected successfully.\n');

        for (const file of filesToUpload) {
            try {
                // Ensure remote directory exists
                await sftp.mkdir(file.remoteDir, true);
                await sftp.put(file.localPath, file.remotePath);
                console.log(`[SFTP] ✅ Uploaded: ${file.remotePath}`);
            } catch (err) {
                console.error(`[SFTP] ❌ Failed: ${file.remotePath} — ${err.message}`);
            }
        }

        console.log('\n[SFTP] All uploads complete.');
    } catch (err) {
        console.error('[SFTP] Connection failed:', err.message);
    } finally {
        await sftp.end();
    }
}

main().catch(console.error);
