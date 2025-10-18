import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import db from "../db";
import ExcelJS from "exceljs";
import { analyzeDescription } from "../ai-analysis/analyze";
import type { ParsedComponent } from "../ai-analysis/analyze";
import { detectColumns } from "../excel-processor/detect-columns";
import { extractAllRows } from "../excel-processor/extract-rows";
import { determineProductTypeFromName } from "../excel-processor/detect-product-type";
import { findValidSheet, extractProjectMetadata } from "../excel-processor/workbook-utils";

const openAIKey = secret("OpenAIKey");





interface ImportExcelRequest {
  fileData: string;
  filename: string;
  manualTypeOverrides?: Record<string, string>;
}

interface ImportExcelResponse {
  success: boolean;
  projectId: string;
  projectName: string;
  productsCreated: number;
  warnings: string[];
  aiAnalysisResults?: AIAnalysisDebugInfo[];
}

interface AIAnalysisDebugInfo {
  ssCode: string;
  productName: string;
  description: string;
  aiResponse?: string;
  componentsFound: number;
  error?: string;
}

export const importExcel = api(
  {
    expose: true,
    method: "POST",
    path: "/tech-review/import-excel",
    bodyLimit: 50 * 1024 * 1024,
  },
  async (req: ImportExcelRequest): Promise<ImportExcelResponse> => {
    const warnings: string[] = [];
    let productsCreated = 0;
    const aiAnalysisResults: AIAnalysisDebugInfo[] = [];

    try {
      if (!req.fileData) throw new Error("Excel failas tuščias arba nerastas");

      const buffer = Buffer.from(req.fileData, "base64");
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer.buffer);

      const sheet = await findValidSheet(workbook);
      console.log(`📘 Naudojamas lapas: ${sheet.name}`);
      warnings.push(`📘 Naudojamas lapas: "${sheet.name}"`);

      const { projectCode, projectName, clientName } = extractProjectMetadata(sheet, req.filename);
      
      if (projectCode.startsWith("TEMP-")) {
        warnings.push("⚠ Projekto kodas nerastas – naudotas laikinas kodas.");
      } else if (!sheet.getCell("C8").text?.trim()) {
        warnings.push(`⚠ Projekto kodas paimtas iš failo pavadinimo: ${projectCode}`);
      }

      console.log(`📁 Projektas: ${projectCode} – ${projectName} (${clientName})`);

      const existingProject = await db.queryRow`
        SELECT id FROM projects WHERE id = ${projectCode}
      `;

      if (!existingProject) {
        await db.exec`
          INSERT INTO projects (id, name, client, status, project_type, created_at, updated_at)
          VALUES (${projectCode}, ${projectName}, ${clientName}, 'active', 'new_development', NOW(), NOW())
        `;
      }

      const columnMapping = detectColumns(sheet);
      console.log(`📊 Column mapping: SS=${columnMapping.ssCodeColumn}, Name=${columnMapping.productNameColumn}, Desc=${columnMapping.descriptionColumn} (confidence: ${columnMapping.confidence})`);
      warnings.push(`Detected columns - SS: ${columnMapping.ssCodeColumn}, Name: ${columnMapping.productNameColumn}, Description: ${columnMapping.descriptionColumn} (${columnMapping.confidence} confidence)`);
      
      const rows = extractAllRows(sheet, columnMapping);
      
      if (rows.length > 0) {
        const firstRow = rows[0];
        console.log(`\n📋 FIRST PRODUCT Row ${firstRow.rowNumber}:`);
        console.log(`  SS Code: "${firstRow.ssCode}"`);
        console.log(`  Name: "${firstRow.productName}"`);
        console.log(`  Description: "${firstRow.description}"`);
        console.log(`  Description length: ${firstRow.description?.length || 0}`);
        
        warnings.push(`First product: ${firstRow.ssCode} | Name: ${firstRow.productName} | Desc length: ${firstRow.description?.length || 0}`);
      }

      console.log(`📦 Rasta produktų: ${rows.length}`);
      if (rows.length === 0) {
        const debugInfo = [];
        for (let i = 26; i <= 30; i++) {
          debugInfo.push(`Row ${i}: B="${sheet.getCell(`B${i}`).text?.trim() || 'EMPTY'}", C="${sheet.getCell(`C${i}`).text?.trim() || 'EMPTY'}"`);
        }
        throw new Error(`Nėra duomenų importavimui. Patikrinkite ar C stulpelis užpildytas.\n\nDebug info:\n${debugInfo.join('\n')}`);
      }

      for (const row of rows) {
        try {
          const productId = `${projectCode}-${row.ssCode}`;

          const existing = await db.queryRow`
            SELECT id FROM products WHERE id = ${productId}
          `;
          if (existing) {
            warnings.push(`SS kodas ${row.ssCode} jau egzistuoja, praleistas.`);
            continue;
          }

          let productType: string;
          if (req.manualTypeOverrides && req.manualTypeOverrides[row.ssCode]) {
            productType = req.manualTypeOverrides[row.ssCode];
            console.log(`✓ Produktas "${row.ssCode}" naudoja rankinį tipą: ${productType}`);
          } else {
            productType = await determineProductTypeFromName(row.productName, row.description);
          }

          await db.exec`
            INSERT INTO products (id, project_id, ss_code, name, type, product_type_id, has_drawing, created_at, updated_at)
            VALUES (${productId}, ${projectCode}, ${row.ssCode}, ${row.productName}, ${productType}, ${productType}, false, NOW(), NOW())
          `;

          const techReview = await db.queryRow<{ id: number }>`
            INSERT INTO tech_reviews (product_id, status, general_notes, created_at, updated_at)
            VALUES (${productId}, 'draft', ${row.description || null}, NOW(), NOW())
            RETURNING id
          `;

          if (!techReview) {
            warnings.push(`Nepavyko sukurti tech review ${row.ssCode}`);
            continue;
          }

          const parts = await db.queryAll<{ id: string; name: string; sortOrder: number }>`
            SELECT id, name, sort_order AS "sortOrder"
            FROM product_type_parts
            WHERE product_type_id = ${productType}
            ORDER BY sort_order, name
          `;

          for (const part of parts) {
            await db.exec`
              INSERT INTO component_parts (
                tech_review_id, product_type_part_id, part_name, sort_order,
                has_done, has_node, had_errors, created_at, updated_at
              )
              VALUES (
                ${techReview.id}, ${part.id}, ${part.name}, ${part.sortOrder},
                false, false, false, NOW(), NOW()
              )
            `;
          }

          if (row.description) {
            console.log(`🤖 Analyzing description for ${row.ssCode}: "${row.description.slice(0, 100)}..."`);
            const debugInfo: AIAnalysisDebugInfo = {
              ssCode: row.ssCode,
              productName: row.productName,
              description: row.description,
              componentsFound: 0,
            };

            try {
              const components = await analyzeDescription(row.description, productType);
              debugInfo.componentsFound = components?.length || 0;
              debugInfo.aiResponse = `Found ${components.length} components`;
              
              console.log(`🤖 AI returned ${debugInfo.componentsFound} components for ${row.ssCode}`);
              
              const createdComponentParts = await db.queryAll<{ id: number; partName: string }>`
                SELECT id, part_name as "partName"
                FROM component_parts
                WHERE tech_review_id = ${techReview.id}
              `;

              for (const comp of components || []) {
                const matchingPart = createdComponentParts.find(p => 
                  p.partName.toLowerCase().includes(comp.name.toLowerCase()) ||
                  comp.name.toLowerCase().includes(p.partName.toLowerCase())
                );

                if (matchingPart) {
                  const notes = [
                    comp.other,
                    comp.uncertainTerms?.length ? `⚠ ${comp.uncertainTerms.join(", ")}` : null
                  ].filter(Boolean).join(" | ");

                  await db.exec`
                    UPDATE component_parts
                    SET 
                      material = ${comp.material || null},
                      finish = ${comp.finish || null},
                      notes = ${notes || null},
                      updated_at = NOW()
                    WHERE id = ${matchingPart.id}
                  `;

                  console.log(`✓ AI matched "${comp.name}" → "${matchingPart.partName}": ${comp.material}, ${comp.finish}`);
                } else {
                  const existingTypePart = await db.queryRow<{ id: string; sortOrder: number }>`
                    SELECT id, sort_order as "sortOrder"
                    FROM product_type_parts
                    WHERE product_type_id = ${productType}
                      AND LOWER(name) = LOWER(${comp.name})
                  `;

                  let partId: string;
                  let sortOrder: number;

                  if (existingTypePart) {
                    partId = existingTypePart.id;
                    sortOrder = existingTypePart.sortOrder;
                    console.log(`✓ Found existing product_type_part "${comp.name}" (${partId})`);
                  } else {
                    const maxSortOrder = parts.length > 0 ? Math.max(...parts.map(p => p.sortOrder)) : 0;
                    sortOrder = maxSortOrder + 1;
                    partId = `PTP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                    
                    await db.exec`
                      INSERT INTO product_type_parts (id, product_type_id, name, sort_order, created_at)
                      VALUES (${partId}, ${productType}, ${comp.name}, ${sortOrder}, NOW())
                    `;
                    
                    console.log(`✓ AI created new product_type_part "${comp.name}" (${partId})`);
                    warnings.push(`${row.ssCode} – AI sukūrė naują tipo dalį "${comp.name}"`);
                  }
                  
                  const notes = [
                    comp.other,
                    comp.uncertainTerms?.length ? `⚠ ${comp.uncertainTerms.join(", ")}` : null
                  ].filter(Boolean).join(" | ");
                  
                  const newComponentPart = await db.queryRow<{ id: number }>`
                    INSERT INTO component_parts (
                      tech_review_id, product_type_part_id, part_name, sort_order,
                      has_done, has_node, had_errors,
                      material, finish, notes,
                      created_at, updated_at
                    )
                    VALUES (
                      ${techReview.id}, ${partId}, ${comp.name}, ${sortOrder},
                      false, false, false,
                      ${comp.material || null}, ${comp.finish || null}, ${notes || null},
                      NOW(), NOW()
                    )
                    RETURNING id
                  `;
                  
                  parts.push({ id: partId, name: comp.name, sortOrder });
                  createdComponentParts.push({ id: newComponentPart!.id, partName: comp.name });
                  
                  console.log(`✓ AI created new component_part "${comp.name}" with material: ${comp.material}, finish: ${comp.finish}`);
                  warnings.push(`${row.ssCode} – AI sukūrė naują kortelę "${comp.name}"`);
                }

                if (comp.uncertainTerms?.length) {
                  warnings.push(`${row.ssCode} – "${comp.name}" turi neaiškių terminų: ${comp.uncertainTerms.join(", ")}`);
                }
              }
            } catch (aiError) {
              debugInfo.error = aiError instanceof Error ? aiError.message : String(aiError);
              console.error(`🚨 AI analysis failed for ${row.ssCode}:`, aiError);
              warnings.push(`${row.ssCode} – AI analizės klaida: ${debugInfo.error}`);
            }

            aiAnalysisResults.push(debugInfo);
          } else {
            warnings.push(`${row.ssCode} – trūksta aprašymo`);
            aiAnalysisResults.push({
              ssCode: row.ssCode,
              productName: row.productName,
              description: "",
              componentsFound: 0,
              error: "No description found in AC column",
            });
          }

          productsCreated++;
        } catch (err) {
          warnings.push(`Klaida apdorojant ${row.ssCode}: ${err}`);
        }
      }

      console.log(`✅ Importuota ${productsCreated} produktų su ${warnings.length} perspėjimų.`);
      return { success: true, projectId: projectCode, projectName, productsCreated, warnings, aiAnalysisResults };

    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`Nepavyko importuoti Excel failo: ${msg}`);
    }
  }
);




