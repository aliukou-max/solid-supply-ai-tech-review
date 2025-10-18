import { api } from "encore.dev/api";
import db from "../db";
import ExcelJS from "exceljs";

interface ImportErrorsExcelRequest {
  fileData: string;
  filename: string;
}

interface ImportErrorsExcelResponse {
  success: boolean;
  errorsCreated: number;
  skipped: number;
  warnings: string[];
}

export const importErrorsExcel = api(
  {
    expose: true,
    method: "POST",
    path: "/production-errors/import-excel",
    bodyLimit: 50 * 1024 * 1024,
  },
  async (req: ImportErrorsExcelRequest): Promise<ImportErrorsExcelResponse> => {
    const warnings: string[] = [];
    let errorsCreated = 0;
    let skipped = 0;

    try {
      if (!req.fileData) throw new Error("Excel failas tuščias arba nerastas");

      const buffer = Buffer.from(req.fileData, "base64");
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const sheet = workbook.worksheets[0];
      if (!sheet) throw new Error("Excel faile nėra lapų");

      console.log(`📘 Naudojamas lapas: ${sheet.name}`);
      console.log(`📊 Excel DEBUG - pirmos 5 eilutės:`);
      
      for (let testRow = 1; testRow <= 5; testRow++) {
        const a = String(sheet.getCell(`A${testRow}`).value ?? "").trim();
        const b = String(sheet.getCell(`B${testRow}`).value ?? "").trim();
        const c = String(sheet.getCell(`C${testRow}`).value ?? "").trim();
        console.log(`  Eilutė ${testRow}: A="${a || 'EMPTY'}" | B="${b || 'EMPTY'}" | C="${c ? c.substring(0, 50) : 'EMPTY'}..."`);
      }

      let currentProjectCode: string | null = null;

      for (let i = 1; i <= sheet.rowCount; i++) {
        const cellA = String(sheet.getCell(`A${i}`).value ?? "").trim();
        const cellB = String(sheet.getCell(`B${i}`).value ?? "").trim();
        const cellC = String(sheet.getCell(`C${i}`).value ?? "").trim();

        if (i <= 10) {
          console.log(`📝 Row ${i}: A="${cellA || 'EMPTY'}" | B="${cellB || 'EMPTY'}" | C="${cellC ? cellC.substring(0, 40) : 'EMPTY'}"`);
        }

        if (i === 1 && cellA.toLowerCase().includes("projekt")) {
          console.log(`⏭ Praleista antraštė`);
          continue;
        }

        if (!cellA && !cellB && !cellC) {
          continue;
        }

        if (cellA && !cellB && !cellC) {
          currentProjectCode = cellA;
          console.log(`📁 Projekto kodas: ${currentProjectCode}`);
          continue;
        }

        if (!cellB || !cellC) {
          if (i <= 10) console.log(`  ⚠ Praleista: trūksta B arba C`);
          continue;
        }

        if (!currentProjectCode) {
          warnings.push(`Eilutė ${i}: Klaida be projekto kodo, praleista (${cellB})`);
          console.log(`  ⚠ Praleista: nėra projekto kodo`);
          skipped++;
          continue;
        }

        const productId = `${currentProjectCode}-${cellB}`;
        console.log(`  🔍 Tikrinama: ${productId}`);

        let product;
        try {
          product = await db.queryRow<{ id: string }>`
            SELECT id FROM products WHERE id = ${productId}
          `;
        } catch (err) {
          product = null;
        }

        if (!product) {
          warnings.push(`Eilutė ${i}: Produktas ${productId} nerastas, klaida praleista`);
          skipped++;
          continue;
        }

        const existingError = await db.queryRow`
          SELECT id FROM production_errors 
          WHERE product_id = ${productId} 
          AND LOWER(description) = LOWER(${cellC})
          AND deleted_at IS NULL
        `;

        if (existingError) {
          console.log(`⚠ Eilutė ${i}: Klaida "${cellC.substring(0, 50)}" produktui ${productId} jau egzistuoja, praleista`);
          skipped++;
          continue;
        }

        const now = new Date();
        await db.exec`
          INSERT INTO production_errors (
            product_id, description, created_at, updated_at
          ) VALUES (
            ${productId}, ${cellC}, ${now}, ${now}
          )
        `;

        errorsCreated++;
        console.log(`✓ Eilutė ${i}: Sukurta klaida produktui ${productId}`);

        if (i % 100 === 0) {
          console.log(`📊 Apdorota ${i} eilučių...`);
        }
      }

      console.log(`✅ Importuota ${errorsCreated} klaidų, praleista ${skipped}`);
      return { 
        success: true, 
        errorsCreated, 
        skipped,
        warnings 
      };

    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`Nepavyko importuoti klaidų Excel failo: ${msg}`);
    }
  }
);
