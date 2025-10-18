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
      await workbook.xlsx.load(buffer.buffer);

      const sheet = workbook.worksheets[0];
      if (!sheet) throw new Error("Excel faile nėra lapų");

      console.log(`📘 Naudojamas lapas: ${sheet.name}`);

      let currentProjectCode: string | null = null;

      for (let i = 1; i <= 10000; i++) {
        const cellA = sheet.getCell(`A${i}`).text?.trim();
        const cellB = sheet.getCell(`B${i}`).text?.trim();
        const cellC = sheet.getCell(`C${i}`).text?.trim();

        if (!cellA && !cellB && !cellC) {
          continue;
        }

        if (cellA && !cellB && !cellC) {
          currentProjectCode = cellA;
          console.log(`📁 Projekto kodas: ${currentProjectCode}`);
          continue;
        }

        if (!cellB || !cellC) {
          continue;
        }

        if (!currentProjectCode) {
          warnings.push(`Eilutė ${i}: Klaida be projekto kodo, praleista (${cellB})`);
          skipped++;
          continue;
        }

        const productId = `${currentProjectCode}-${cellB}`;

        const product = await db.queryRow<{ id: string }>`
          SELECT id FROM products WHERE id = ${productId}
        `;

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
