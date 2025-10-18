import { api } from "encore.dev/api";
import ExcelJS from "exceljs";
import db from "../db";

interface ColumnMapping {
  ssCodeColumn: string;
  productNameColumn: string;
  descriptionColumn: string;
  confidence: "high" | "medium" | "low";
  alternativeDescriptionColumns: string[];
}

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
      await workbook.xlsx.load(buffer as any);

      const sheet = await findValidSheet(workbook);
      warnings.push(`Using sheet: "${sheet.name}"`);

      let projectCode = sheet.getCell("C8").text?.trim() || "";
      const rawProjectName = sheet.getCell("C9").text?.trim() || "";
      const rawClientName = sheet.getCell("C10").text?.trim() || "";

      const projectName = rawProjectName && !rawProjectName.includes("GMT") && !rawProjectName.includes("Coordinated")
        ? rawProjectName
        : projectCode || "Unnamed project";
      const clientName = rawClientName && !rawClientName.includes("GMT") && !rawClientName.includes("Coordinated")
        ? rawClientName
        : "";

      if (!projectCode) {
        projectCode = extractProjectCode(req.filename);
        if (!projectCode) {
          projectCode = "TEMP-" + Date.now();
          warnings.push("Project code not found – will use temporary code");
        } else {
          warnings.push(`Project code extracted from filename: ${projectCode}`);
        }
      }

      const columnMapping = detectColumns(sheet);
      warnings.push(`Column detection confidence: ${columnMapping.confidence}`);
      warnings.push(`SS Code: Column ${columnMapping.ssCodeColumn}, Product Name: Column ${columnMapping.productNameColumn}, Description: Column ${columnMapping.descriptionColumn}`);

      if (columnMapping.alternativeDescriptionColumns.length > 0) {
        warnings.push(`Alternative description columns found: ${columnMapping.alternativeDescriptionColumns.join(", ")}`);
      }

      const { rows, totalCount } = await extractPreviewRows(sheet, columnMapping);
      
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

function detectColumns(sheet: ExcelJS.Worksheet): ColumnMapping {
  const startRow = 26;
  const columnsToCheck = ["AC", "AD", "AE", "AB", "AA", "Z", "Y", "X", "W"];
  
  const headerRow = 25;
  const headers: Record<string, string> = {};
  for (const col of columnsToCheck) {
    const headerText = sheet.getCell(`${col}${headerRow}`).text?.trim().toLowerCase() || "";
    headers[col] = headerText;
  }

  const descriptionKeywords = ["description", "aprašymas", "aprasymas", "desc", "technical", "specification", "spec"];
  
  let bestColumn = "";
  let bestScore = 0;
  let confidence: "high" | "medium" | "low" = "low";
  const alternatives: string[] = [];

  for (const col of columnsToCheck) {
    let score = 0;
    const header = headers[col];
    
    for (const keyword of descriptionKeywords) {
      if (header.includes(keyword)) {
        score += 10;
      }
    }

    let contentLength = 0;
    let filledRows = 0;
    for (let i = startRow; i < startRow + 10; i++) {
      const text = sheet.getCell(`${col}${i}`).text?.trim() || "";
      if (text) {
        filledRows++;
        contentLength += text.length;
      }
    }

    if (filledRows > 0) {
      const avgLength = contentLength / filledRows;
      if (avgLength > 50) score += 5;
      if (avgLength > 100) score += 3;
      if (filledRows >= 5) score += 2;
    }

    if (score > bestScore) {
      if (bestColumn && bestScore > 3) {
        alternatives.push(bestColumn);
      }
      bestScore = score;
      bestColumn = col;
    } else if (score > 3 && score >= bestScore * 0.7) {
      alternatives.push(col);
    }
  }

  if (bestScore >= 10) {
    confidence = "high";
  } else if (bestScore >= 5) {
    confidence = "medium";
  }

  if (!bestColumn) {
    bestColumn = "AC";
    confidence = "low";
  }

  return {
    ssCodeColumn: "B",
    productNameColumn: "C",
    descriptionColumn: bestColumn,
    confidence,
    alternativeDescriptionColumns: alternatives,
  };
}

async function extractPreviewRows(
  sheet: ExcelJS.Worksheet,
  mapping: ColumnMapping
): Promise<{ rows: PreviewRow[]; totalCount: number }> {
  const startRow = 26;
  const maxPreview = 5;
  const rows: PreviewRow[] = [];
  let totalCount = 0;

  for (let i = startRow; i < 1000; i++) {
    const ss = sheet.getCell(`${mapping.ssCodeColumn}${i}`).text?.trim();
    if (!ss) break;

    const name = sheet.getCell(`${mapping.productNameColumn}${i}`).text?.trim() || "";
    let desc = sheet.getCell(`${mapping.descriptionColumn}${i}`).text?.trim() || "";

    if (!desc) {
      for (const altCol of mapping.alternativeDescriptionColumns) {
        desc = sheet.getCell(`${altCol}${i}`).text?.trim() || "";
        if (desc) break;
      }
    }

    if (name) {
      totalCount++;
      if (rows.length < maxPreview) {
        const typeMatch = await detectProductType(name, desc);
        rows.push({
          ssCode: ss,
          productName: name,
          description: desc,
          rowNumber: i,
          detectedType: typeMatch.typeName,
          detectedTypeId: typeMatch.typeId,
          matchedKeyword: typeMatch.matchedKeyword,
        });
      }
    }
  }

  return { rows, totalCount };
}

async function findValidSheet(workbook: ExcelJS.Workbook): Promise<ExcelJS.Worksheet> {
  const main = workbook.getWorksheet("Products information");
  if (main && main.getCell("B26").text?.trim()) {
    return main;
  }

  let best: ExcelJS.Worksheet | null = null;
  let maxCount = 0;

  for (const s of workbook.worksheets) {
    let count = 0;
    for (let i = 26; i < 100; i++) {
      const ss = s.getCell(`B${i}`).text;
      const name = s.getCell(`C${i}`).text;
      if (ss && name) count++;
    }
    if (count > maxCount) {
      maxCount = count;
      best = s;
    }
  }

  if (!best) throw new Error("No sheets found with data (B and C columns).");
  return best;
}

function extractProjectCode(filename: string): string {
  const match = filename.match(/[A-Z]{2,3}\d{6}/i);
  return match ? match[0].toUpperCase() : "";
}

async function detectProductType(productName: string, description: string): Promise<{
  typeId: string | null;
  typeName: string | null;
  matchedKeyword: string | null;
}> {
  const combinedText = `${productName} ${description}`.toLowerCase();
  
  const synonyms = await db.queryAll<{ synonym: string; productTypeId: string; productTypeName: string }>`
    SELECT s.synonym, s.product_type_id as "productTypeId", pt.name as "productTypeName"
    FROM product_type_synonyms s
    JOIN product_types pt ON pt.id = s.product_type_id
    ORDER BY LENGTH(s.synonym) DESC
  `;

  for (const { synonym, productTypeId, productTypeName } of synonyms) {
    const pattern = new RegExp(`\\b${synonym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(combinedText)) {
      return {
        typeId: productTypeId,
        typeName: productTypeName,
        matchedKeyword: synonym,
      };
    }
  }

  const kitaType = await db.queryRow<{ id: string; name: string }>`
    SELECT id, name FROM product_types WHERE LOWER(name) = 'kita' OR LOWER(id) = 'kita' LIMIT 1
  `;

  return {
    typeId: kitaType?.id || null,
    typeName: kitaType?.name || null,
    matchedKeyword: null,
  };
}
