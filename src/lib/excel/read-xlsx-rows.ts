import { readSheet, type SheetData } from "read-excel-file/node";
import type { ExcelRow } from "@/lib/types/excel-row";

type RawXlsxCellValue = SheetData[number][number] | Date | undefined;

function normalizeHeader(value: RawXlsxCellValue): string {
  if (value == null || typeof value === "function") return "";
  return String(value).trim();
}

function normalizeCellValue(value: RawXlsxCellValue): ExcelRow[string] {
  if (value == null || typeof value === "function") return "";
  return value;
}

function isEmptyRow(row: ExcelRow): boolean {
  return Object.values(row).every((value) => {
    if (value == null) return true;
    if (value instanceof Date) return false;
    return String(value).trim() === "";
  });
}

export function sheetDataToExcelRows(sheetData: SheetData): ExcelRow[] {
  const [headerRow, ...dataRows] = sheetData;
  if (!headerRow) return [];

  const headers = headerRow.map(normalizeHeader);
  const result: ExcelRow[] = [];

  for (const dataRow of dataRows) {
    const row: ExcelRow = {};

    headers.forEach((header, index) => {
      if (!header) return;
      row[header] = normalizeCellValue(dataRow[index]);
    });

    if (!isEmptyRow(row)) {
      result.push(row);
    }
  }

  return result;
}

export async function readXlsxRows(buffer: ArrayBuffer): Promise<ExcelRow[]> {
  const sheetData = await readSheet(Buffer.from(buffer));
  return sheetDataToExcelRows(sheetData);
}
