import * as XLSX from 'xlsx';
import * as path from 'path';

/**
 * Reads a sheet from an Excel file and returns rows as an array of objects.
 * The first row is treated as the header (column names).
 *
 * @param filePath  Relative path from project root, e.g. 'test-data/pos_data.xlsx'
 * @param sheetName Name of the sheet to read (default: first sheet)
 */
export function readExcelSheet<T = Record<string, string>>(
  filePath: string,
  sheetName?: string
): T[] {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const workbook = XLSX.readFile(absolutePath);

  const sheet = sheetName
    ? workbook.Sheets[sheetName]
    : workbook.Sheets[workbook.SheetNames[0]];

  if (!sheet) {
    throw new Error(
      `Sheet "${sheetName}" not found. Available: ${workbook.SheetNames.join(', ')}`
    );
  }

  // header: 1 means first row becomes keys
  return XLSX.utils.sheet_to_json<T>(sheet, { defval: '' });
}
