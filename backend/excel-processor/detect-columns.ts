import type ExcelJS from "exceljs";
import type { ColumnMapping } from "./types";

export function detectColumns(sheet: ExcelJS.Worksheet): ColumnMapping {
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
