const XLSX = require('xlsx');
const path = require('path');

const filePath = path.resolve(process.cwd(), 'test-data/qrs_test_data.xlsx');
try {
  const workbook = XLSX.readFile(filePath);
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log(`\n--- Sheet: ${sheetName} (${data.length} rows) ---`);
    if (data.length > 0) {
        console.log('Row 1:', JSON.stringify(data[0], null, 2));
    }
  });
} catch (e) {
  console.error('Error reading Excel:', e.message);
}
