import { api } from "encore.dev/api";
import ExcelJS from "exceljs";
import { detectColumns } from "../excel-processor/detect-columns";
import { extractPreviewRows } from "../excel-processor/extract-rows";
import { detectProductType } from "../excel-processor/detect-product-type";
import { findValidSheet, extractProjectMetadata } from "../excel-processor/workbook-utils";
import type { ColumnMapping } from "../excel-processor/types";

interface PreviewRow {
  ssCode: string;
  productName: string;
  description: string;
  rowNumber: number;
  detectedType: string | null;
  detectedTypeId: string | null;
  matchedKeyword: string | null;
}

interface PreviewExcelRequest {
  fileData: string;
  filename: string;
}

interface PreviewExcelResponse {
  projectCode: string;
  projectName: string;
  clientName: string;
  sheetName: string;
  columnMapping: ColumnMapping;
  previewRows: PreviewRow[];
  totalRowsFound: number;
  warnings: string[];
}

export const previewExcel = api(
  {
    expose: true,
    method: "POST",
    path: "/tech-review/preview-excel",
    bodyLimit: 50 * 1024 * 1024,
  },
  async (req: PreviewExcelRequest): Promise<PreviewExcelResponse> => {
    const warnings: string[] = [];

    try {
      if (!req.fileData) throw new Error("Excel file is empty or not found");

      const buffer = Buffer.from(req.fileData, "base64");
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer.buffer);

      const sheet = await findValidSheet(workbook);
      warnings.push(`Using sheet: "${sheet.name}"`);

      const { projectCode, projectName, clientName } = extractProjectMetadata(sheet, req.filename);
      
      if (projectCode.startsWith("TEMP-")) {
        warnings.push("Project code not found – will use temporary code");
      } else if (sheet.getCell("C8").text?.trim() !== projectCode) {
        warnings.push(`Project code extracted from filename: ${projectCode}`);
      }

      const columnMapping = detectColumns(sheet);
      warnings.push(`Column detection confidence: ${columnMapping.confidence}`);
      warnings.push(`SS Code: Column ${columnMapping.ssCodeColumn}, Product Name: Column ${columnMapping.productNameColumn}, Description: Column ${columnMapping.descriptionColumn}`);

      if (columnMapping.alternativeDescriptionColumns.length > 0) {
        warnings.push(`Alternative description columns found: ${columnMapping.alternativeDescriptionColumns.join(", ")}`);
      }

      const { rows: extractedRows, totalCount } = extractPreviewRows(sheet, columnMapping);
      
      const rows: PreviewRow[] = [];
      for (const row of extractedRows) {
        const typeMatch = await detectProductType(row.productName, row.description);
        rows.push({
          ...row,
          detectedType: typeMatch.typeName,
          detectedTypeId: typeMatch.typeId,
          matchedKeyword: typeMatch.matchedKeyword,
        });
      }
      
      return {
        projectCode,
        projectName,
        clientName,
        sheetName: sheet.name,
        columnMapping,
        previewRows: rows,
        totalRowsFound: totalCount,
        warnings,
      };

    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to preview Excel file: ${msg}`);
    }
  }
);


