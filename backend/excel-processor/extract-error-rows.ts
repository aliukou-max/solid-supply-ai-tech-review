import type ExcelJS from "exceljs";
import type { ErrorRow } from "./types";

export function extractErrorRows(sheet: ExcelJS.Worksheet): ErrorRow[] {
  const errors: ErrorRow[] = [];
  let currentProjectCode: string | null = null;

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const cellA = String(row.getCell(1).value ?? "").trim();
    const cellB = String(row.getCell(2).value ?? "").trim();
    const cellC = String(row.getCell(3).value ?? "").trim();

    if (rowNumber === 1 && cellA.toLowerCase().includes("projekt")) {
      return;
    }

    if (!cellA && !cellB && !cellC) {
      return;
    }

    if (cellA && !cellB && !cellC) {
      currentProjectCode = cellA;
      return;
    }

    if (!cellB || !cellC) {
      return;
    }

    if (!currentProjectCode) {
      return;
    }

    errors.push({
      productCode: `${currentProjectCode}-${cellB}`,
      description: cellC,
      rowNumber,
    });
  });

  return errors;
}
