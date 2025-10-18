import type ExcelJS from "exceljs";

export async function findValidSheet(workbook: ExcelJS.Workbook): Promise<ExcelJS.Worksheet> {
  const main = workbook.getWorksheet("Products information");
  if (main && main.getCell("B26").text?.trim()) {
    console.log(`📘 Using sheet: "Products information"`);
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
    console.log(`📊 Sheet "${s.name}" has ${count} products (B+C check)`);
    if (count > maxCount) {
      maxCount = count;
      best = s;
    }
  }

  if (!best) throw new Error("No sheets found with data (B and C columns).");
  console.log(`📘 Selected sheet: "${best.name}" with ${maxCount} products`);
  return best;
}

export function extractProjectCode(filename: string): string {
  const match = filename.match(/[A-Z]{2,3}\d{6}/i);
  return match ? match[0].toUpperCase() : "";
}

export interface ProjectMetadata {
  projectCode: string;
  projectName: string;
  clientName: string;
}

export function extractProjectMetadata(
  sheet: ExcelJS.Worksheet,
  filename: string
): ProjectMetadata {
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
    projectCode = extractProjectCode(filename);
    if (!projectCode) {
      projectCode = "TEMP-" + Date.now();
    }
  }

  return {
    projectCode,
    projectName,
    clientName,
  };
}
