import type ExcelJS from "exceljs";
import type { ColumnMapping, ExtractedRow } from "./types";

export function extractAllRows(
  sheet: ExcelJS.Worksheet,
  mapping: ColumnMapping
): ExtractedRow[] {
  const startRow = 26;
  const rows: ExtractedRow[] = [];

  for (let i = startRow; i < 1000; i++) {
    const ss = sheet.getCell(`${mapping.ssCodeColumn}${i}`).text?.trim();
    if (!ss) break;

    let name = sheet.getCell(`${mapping.productNameColumn}${i}`).text?.trim() || "";
    
    if (!name) {
      name = sheet.getCell(`D${i}`).text?.trim() || "";
    }
    if (!name) {
      name = sheet.getCell(`E${i}`).text?.trim() || "";
    }
    if (!name) {
      name = ss;
    }

    let desc = sheet.getCell(`${mapping.descriptionColumn}${i}`).text?.trim() || "";

    if (!desc) {
      for (const altCol of mapping.alternativeDescriptionColumns) {
        desc = sheet.getCell(`${altCol}${i}`).text?.trim() || "";
        if (desc) break;
      }
    }

    rows.push({
      ssCode: ss,
      productName: name,
      description: desc,
      rowNumber: i,
    });
  }

  return rows;
}

export function extractPreviewRows(
  sheet: ExcelJS.Worksheet,
  mapping: ColumnMapping,
  maxPreview: number = 5
): { rows: ExtractedRow[]; totalCount: number } {
  const allRows = extractAllRows(sheet, mapping);
  const previewRows = allRows.slice(0, maxPreview);
  
  return {
    rows: previewRows,
    totalCount: allRows.length,
  };
}
