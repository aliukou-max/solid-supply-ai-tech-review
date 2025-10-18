import { api } from "encore.dev/api";
import db from "../db";
import ExcelJS from "exceljs";
import { extractErrorRows } from "../excel-processor/extract-error-rows";
import { validateErrorRow } from "../excel-processor/validate-error-import";

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
    bodyLimit: 100 * 1024 * 1024,
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

      const errorRows = extractErrorRows(sheet);
      console.log(`\n📦 Ištraukta eilučių iš Excel: ${errorRows.length}\n`);

      for (const error of errorRows) {
        const validation = await validateErrorRow(error);

        if (!validation.isValid) {
          skipped++;
          if (validation.warning) {
            console.log(`  ❌ Praleista: ${validation.warning}`);
            warnings.push(validation.warning);
          }
          continue;
        }

        const now = new Date();
        try {
          await db.exec`
            INSERT INTO production_errors (
              project_code, product_code, error_description, created_at
            ) VALUES (
              ${validation.projectCode}, ${validation.productCode}, ${error.description}, ${now}
            )
          `;
          console.log(`  ✅ Įrašyta: ${validation.projectCode}-${validation.productCode}`);
          errorsCreated++;
        } catch (err) {
          skipped++;
          console.log(`  ❌ Klaida įrašant: ${err}`);
          warnings.push(`Eilutė ${error.rowNumber}: nepavyko įrašyti klaidos (${err})`);
        }
      }

      console.log(`\n📊 Rezultatai: sukurta=${errorsCreated}, praleista=${skipped}\n`);

      return { success: true, errorsCreated, skipped, warnings };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`Nepavyko importuoti Excel failo: ${msg}`);
    }
  }
);
