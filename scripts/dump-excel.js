const XLSX = require('xlsx');
const path = require('path');

const filePath = path.resolve(__dirname, '../test-data/qrs_test_data.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Sheets:', workbook.SheetNames);

for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (rows.length > 0) {
        console.log(`\n=== Sheet: ${name} (${rows.length} rows) ===`);
        console.log('Columns:', Object.keys(rows[0]).join(', '));
        console.log('First 2 rows:');
        rows.slice(0, 2).forEach((r, i) => console.log(`  Row ${i+1}:`, JSON.stringify(r)));
    }
}
