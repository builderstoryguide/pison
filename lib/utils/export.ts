import * as XLSX from 'xlsx';
import { stringify } from 'csv-stringify/sync';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

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

/**
 * Export data to PDF buffer
 */
export async function exportToPdf(data: any[], title: string = 'Report'): Promise<Buffer> {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(14);
  doc.text(title, 14, 15);

  if (data.length === 0) {
    doc.setFontSize(10);
    doc.text('No data to display', 14, 25);
  } else {
    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((h) => {
        const value = row[h];
        if (value == null || value === undefined) return '';
        if (typeof value === 'object' || Array.isArray(value)) return JSON.stringify(value);
        return String(value);
      })
    );

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 22,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 66, 66] },
    });
  }

  return Buffer.from(doc.output('arraybuffer'));
}
