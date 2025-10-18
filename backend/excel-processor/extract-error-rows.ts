import type ExcelJS from "exceljs";
import type { ErrorRow } from "./types";

export function extractErrorRows(sheet: ExcelJS.Worksheet): ErrorRow[] {
  const errors: ErrorRow[] = [];
  let currentProjectCode: string | null = null;

  console.log(`📊 Skaitomas lapas: ${sheet.name}, eilučių: ${sheet.rowCount}`);

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const cellA = String(row.getCell(1).value ?? "").trim();
    const cellB = String(row.getCell(2).value ?? "").trim();
    const cellC = String(row.getCell(3).value ?? "").trim();

    console.log(`Eilutė ${rowNumber}: A="${cellA}" B="${cellB}" C="${cellC}"`);

    if (rowNumber === 1 && cellA.toLowerCase().includes("projekt")) {
      console.log(`  ⏭️  Praleidžiama header eilutė`);
      return;
    }

    if (!cellA && !cellB && !cellC) {
      console.log(`  ⏭️  Praleidžiama tuščia eilutė`);
      return;
    }

    // Jei A, B, C visi užpildyti - tai klaida su projekto kodu toje pačioje eilutėje
    if (cellA && cellB && cellC) {
      console.log(`  ✅ Klaida (viena eilutė): ${cellA}-${cellB} -> ${cellC}`);
      errors.push({
        productCode: `${cellA}-${cellB}`,
        description: cellC,
        rowNumber,
      });
      return;
    }

    if (cellA && !cellB && !cellC) {
      currentProjectCode = cellA;
      console.log(`  📁 Projekto kodas: ${cellA}`);
      return;
    }

    if (!cellB || !cellC) {
      console.log(`  ⏭️  Praleidžiama (trūksta B arba C)`);
      return;
    }

    if (!currentProjectCode) {
      console.log(`  ⚠️  Praleidžiama (nėra projekto kodo)`);
      return;
    }

    console.log(`  ✅ Klaida: ${currentProjectCode}-${cellB} -> ${cellC}`);
    errors.push({
      productCode: `${currentProjectCode}-${cellB}`,
      description: cellC,
      rowNumber,
    });
  });

  console.log(`📊 Ištraukta klaidų: ${errors.length}`);
  return errors;
}
