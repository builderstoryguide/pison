import * as XLSX from 'xlsx';
import { stringify } from 'csv-stringify/sync';

/**
 * Export data to CSV buffer
 */
export async function exportToCsv(data: any[], columns?: string[]): Promise<Buffer> {
  const output = stringify(data, {
    header: true,
    columns,
  });
  return Buffer.from(output);
}

/**
 * Export data to Excel buffer
 */
export async function exportToExcel(data: any[], sheetName: string = 'Sheet1'): Promise<Buffer> {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Create buffer directly
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return excelBuffer;
}
