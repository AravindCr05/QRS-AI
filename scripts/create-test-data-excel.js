/**
 * Run this script once to generate the sample Excel test data files.
 * Usage: node scripts/create-test-data-excel.js
 */
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const outDir = path.resolve('test-data');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// ── POS Test Data Sheet ──────────────────────────────────────────────────────
const posData = [
  {
    corpId:                '000002',
    icaAccount:            '1012345',
    channelId:             'CH12345',
    merchantId:            'RHBQR12345',
    reflexMerchantName:    'ReflexTest01',
    posPartnerBrn:         'BRN12345',
    posAccountName:        'AccName01',
    posName:               'POSName01',
    posPhone:              '01112345',
    posEmail:              'pos01@autotest.com',
    profitSharingAccount:  '2012345',
    profitSharingRatio:    '5',
    merchantChargesPackage:'2',
    inputDirectory:        '/input/01',
    outputDirectory:       '/output/01',
    statementDirectory:    '/statement/01',
  },
  {
    corpId:                '000002',
    icaAccount:            '1067890',
    channelId:             'CH67890',
    merchantId:            'RHBQR67890',
    reflexMerchantName:    'ReflexTest02',
    posPartnerBrn:         'BRN67890',
    posAccountName:        'AccName02',
    posName:               'POSName02',
    posPhone:              '01167890',
    posEmail:              'pos02@autotest.com',
    profitSharingAccount:  '2067890',
    profitSharingRatio:    '3',
    merchantChargesPackage:'1',
    inputDirectory:        '/input/02',
    outputDirectory:       '/output/02',
    statementDirectory:    '/statement/02',
  }
];

// ── Merchant Test Data Sheet ──────────────────────────────────────────────────
const merchantData = [
  {
    merchantIdOption:    'RHBQR12345',
    businessSector:      'Schools',
    otherBusinessSector: '',            // Fill only when businessSector = 'Others'
    qrsMerchantName:     'QRSAuto01',
    brn:                 'BRN12345',
    outletId:            'OID12345',
    outletName:          'Outlet01',
    cashierName:         'Cashier01',
    cashierIds:          'CA01;CA02',
    bankName:            'Public Bank',
    accountName:         'AccName01',
    accountNumber:       '123412345',
    paymentType:         '03',
    recipientIdType:     '04',
    recipientIdDetails:  'ID12345',
    recipientPhone:      '098712345',
    recipientEmail:      'rec01@autotest.com',
  },
  {
    merchantIdOption:    'RHBQR67890',
    businessSector:      'Others',
    otherBusinessSector: 'Custom Retail', // Required when businessSector = 'Others'
    qrsMerchantName:     'QRSAuto02',
    brn:                 'BRN67890',
    outletId:            'OID67890',
    outletName:          'Outlet02',
    cashierName:         'Cashier02',
    cashierIds:          'CB01;CB02',
    bankName:            'Public Bank',
    accountName:         'AccName02',
    accountNumber:       '123467890',
    paymentType:         '03',
    recipientIdType:     '04',
    recipientIdDetails:  'ID67890',
    recipientPhone:      '098767890',
    recipientEmail:      'rec02@autotest.com',
  }
];

// ── Corporate Test Data Sheet ─────────────────────────────────────────────────
const corporateData = [
  { corpId: '111001', subsidiaryId: 'SID111001', corporateName: 'Corp Alpha' },
  { corpId: '111002', subsidiaryId: 'SID111002', corporateName: 'Corp Beta'  },
];

// Build workbook with multiple sheets
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(posData),       'POS');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(merchantData),  'Merchant');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(corporateData), 'Corporate');

const outFile = path.join(outDir, 'qrs_test_data.xlsx');
XLSX.writeFile(wb, outFile);
console.log('✅ Created:', outFile);
console.log('   Sheets: POS, Merchant, Corporate');
