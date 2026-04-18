import * as fs from 'fs';
import * as path from 'path';

const UNC_PATH = '\\\\192.168.7.60\\TesterShare\\QRS\\phase3-release3\\temp\\input\\qrt';

export async function uploadDynamicQrt(data: any) {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const dateTag = `${dd}${mm}${yyyy}`;
    const dateFull = `${dd}/${mm}/${yyyy}`;

    const csvContent = [
        'Daily QR Merchant Transaction Report',
        '',
        `Inquiry By,Daily`,
        `Merchant ID,${data.merchantId}`,
        `Merchant Name,${data.qrsMerchantName}`,
        `Status,Active`,
        `Manager ID,${data.posAccountName}`,
        `Outlet Name,All Outlet`,
        `Transaction Date,${dateFull}`,
        '',
        'Transaction Date & Time,Transaction Reference Number,Transaction Reference,Outlet Name,Amount (RM),Collection Account,Cashier ID,Source of Fund,DuitNow Participant',
        [`${dateFull} 10:30:00`, data.transactionReference, data.trxReference, data.outletName, data.transactionAmount, data.icaAccount, data.cashierId, 'QR Code', 'RHB Bank Berhad'].join(','),
        '',
        '',
        `Total No. of Transaction:,1`,
        `Total Transaction Amount (RM):,${data.transactionAmount}`,
        '',
    ].join('\r\n');

    const outputDir = path.resolve(process.cwd(), 'test-data/qrt-output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    
    const localPath = path.join(outputDir, data.fileName);
    fs.writeFileSync(localPath, csvContent, 'utf8');
    console.log(`[GEN] Generated locally: ${localPath}`);

    const remotePath = path.join(UNC_PATH, data.fileName);
    console.log(`[COPY] Copying to UNC: ${remotePath}`);
    fs.copyFileSync(localPath, remotePath);
    console.log(`[COPY] ✅ Uploaded successfully: ${remotePath}`);

    // Save for test consumption
    const infoPath = path.resolve(process.cwd(), 'test-data/last-upload.json');
    fs.writeFileSync(infoPath, JSON.stringify(data, null, 2), 'utf8');
}
