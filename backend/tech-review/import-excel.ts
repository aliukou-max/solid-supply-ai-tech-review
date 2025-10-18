import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import db from "../db";
import ExcelJS from "exceljs";

const openAIKey = secret("OpenAIKey");

interface ExcelRow {
  ssCode: string;
  productName: string;
  description: string;
}

interface ParsedComponent {
  name: string;
  material?: string;
  finish?: string;
  other?: string;
  uncertainTerms?: string[];
}

interface ImportExcelRequest {
  fileData: string;
  filename: string;
}

interface ImportExcelResponse {
  success: boolean;
  projectId: string;
  projectName: string;
  productsCreated: number;
  warnings: string[];
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

    try {
      if (!req.fileData) throw new Error("Excel failas tuščias arba nerastas");

      const buffer = Buffer.from(req.fileData, "base64");
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const sheet = await findValidSheet(workbook);
      console.log(`📘 Naudojamas lapas: ${sheet.name}`);

      let projectCode = sheet.getCell("C8").text?.trim() || null;
      const rawProjectName = sheet.getCell("C9").text?.trim();
      const rawClientName = sheet.getCell("C10").text?.trim();

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
          warnings.push("⚠ Projekto kodas nerastas – naudotas laikinas kodas.");
        } else {
          warnings.push(`⚠ Projekto kodas paimtas iš failo pavadinimo: ${projectCode}`);
        }
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

      const rows: ExcelRow[] = [];
      for (let i = 26; i < 1000; i++) {
        const ss = sheet.getCell(`B${i}`).text?.trim();
        const name = sheet.getCell(`C${i}`).text?.trim();
        const desc = sheet.getCell(`AC${i}`).text?.trim();

        if (!ss) break;

        if (i === 26) {
          console.log(`📋 DEBUG Row ${i}:`);
          console.log(`  SS Code (B): "${ss}"`);
          console.log(`  Name (C): "${name}"`);
          console.log(`  Description (AC): "${desc}"`);
        }

        if (name) {
          const cleanDesc = desc && !desc.includes("GMT") && !desc.includes("Coordinated") ? desc : "";
          if (i === 26 && !cleanDesc && desc) {
            console.log(`⚠️ Description filtered out (contains GMT/Coordinated): "${desc}"`);
          }
          rows.push({ ssCode: ss, productName: name, description: cleanDesc });
        }
      }

      console.log(`📦 Rasta produktų: ${rows.length}`);
      if (rows.length === 0) throw new Error("Excel faile nerasta produktų nuo B26 eilutės.");

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

          const productType = await determineProductTypeFromName(row.productName);

          await db.exec`
            INSERT INTO products (id, project_id, ss_code, name, type, product_type_id, has_drawing, created_at, updated_at)
            VALUES (${productId}, ${projectCode}, ${row.ssCode}, ${row.productName}, ${productType}, ${productType}, false, NOW(), NOW())
          `;

          const techReview = await db.queryRow<{ id: number }>`
            INSERT INTO tech_reviews (product_id, status, created_at, updated_at)
            VALUES (${productId}, 'draft', NOW(), NOW())
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
            const analysisResult = await analyzeDescriptionWithAI(row.description, productType);
            
            const createdComponentParts = await db.queryAll<{ id: number; partName: string }>`
              SELECT id, part_name as "partName"
              FROM component_parts
              WHERE tech_review_id = ${techReview.id}
            `;

            for (const comp of analysisResult) {
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
                warnings.push(`${row.ssCode} – AI rado "${comp.name}", bet nerasta atitinkama kortelė`);
              }

              if (comp.uncertainTerms?.length) {
                warnings.push(`${row.ssCode} – "${comp.name}" turi neaiškių terminų: ${comp.uncertainTerms.join(", ")}`);
              }
            }
          } else {
            warnings.push(`${row.ssCode} – trūksta aprašymo`);
          }

          productsCreated++;
        } catch (err) {
          warnings.push(`Klaida apdorojant ${row.ssCode}: ${err}`);
        }
      }

      console.log(`✅ Importuota ${productsCreated} produktų su ${warnings.length} perspėjimų.`);
      return { success: true, projectId: projectCode, projectName, productsCreated, warnings };

    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`Nepavyko importuoti Excel failo: ${msg}`);
    }
  }
);

async function findValidSheet(workbook: ExcelJS.Workbook): Promise<ExcelJS.Worksheet> {
  const main = workbook.getWorksheet("Products information");
  if (main && main.getCell("B26").text?.trim()) return main;

  let best: ExcelJS.Worksheet | null = null;
  let maxCount = 0;

  for (const s of workbook.worksheets) {
    let count = 0;
    for (let i = 26; i < 100; i++) {
      const ss = s.getCell(`B${i}`).text;
      const desc = s.getCell(`AC${i}`).text;
      if (ss && desc) count++;
    }
    if (count > maxCount) {
      maxCount = count;
      best = s;
    }
  }

  if (!best) throw new Error("Nerasta lapų su duomenimis.");
  return best;
}

function extractProjectCode(filename: string): string {
  const match = filename.match(/[A-Z]{2,3}\d{6}/i);
  return match ? match[0].toUpperCase() : "";
}

async function determineProductTypeFromName(productName: string): Promise<string> {
  const name = productName.toLowerCase();

  const allTypes = await db.queryAll<{ id: string; name: string }>`
    SELECT id, name FROM product_types ORDER BY name
  `;

  for (const type of allTypes) {
    const typeName = type.name.toLowerCase();
    const typeWords = typeName.split(/\s+/);

    for (const word of typeWords) {
      if (word.length > 3 && name.includes(word)) {
        console.log(`✓ Produktas "${productName}" priskirtas tipui "${type.name}"`);
        return type.id;
      }
    }
  }

  if (name.includes("backwall") || name.includes("back wall") || name.includes("wall")) {
    const backwall = allTypes.find(t => t.name.toLowerCase().includes("backwall"));
    if (backwall) return backwall.id;
  }
  if (name.includes("shelf") || name.includes("shelv") || name.includes("lentyna")) {
    const shelf = allTypes.find(t => t.name.toLowerCase().includes("lentyna") || t.name.toLowerCase().includes("shelf"));
    if (shelf) return shelf.id;
  }
  if (name.includes("vitrina") || name.includes("showcase") || name.includes("cabinet") || name.includes("counter")) {
    const vitrina = allTypes.find(t => t.name.toLowerCase().includes("vitrina") || t.name.toLowerCase().includes("cabinet"));
    if (vitrina) return vitrina.id;
  }
  if (name.includes("table") || name.includes("stalas") || name.includes("island") || name.includes("desk")) {
    const table = allTypes.find(t => t.name.toLowerCase().includes("stalas") || t.name.toLowerCase().includes("table"));
    if (table) return table.id;
  }
  if (name.includes("lightbox") || name.includes("light box")) {
    const lightbox = allTypes.find(t => t.name.toLowerCase().includes("lightbox"));
    if (lightbox) return lightbox.id;
  }

  console.log(`⚠ Produktas "${productName}" nebuvo priskirtas jokiam tipui, naudojamas "Kita"`);
  const kita = allTypes.find(t => t.name.toLowerCase() === "kita");
  return kita?.id || "Kita";
}

async function analyzeDescriptionWithAI(description: string, productType: string): Promise<ParsedComponent[]> {
  const apiKey = openAIKey();
  
  if (!apiKey) {
    console.error("OpenAI API key not configured");
    return createFallbackComponent(description, "OpenAI API key missing - configure in Settings");
  }

  const prompt = `
You are an expert in furniture and retail fixture engineering.
Parse the following technical description into structured component data.

Product Type: ${productType}
Description: ${description}

For each distinct component, extract:
- "name" (e.g. Carcass, Header, Shelves, Back panel, Wall cladding)
- "material" (MDF, marble, HPL, steel, acrylic, etc.)
- "finish" (brushed, polished, satin, painted, etc.)
- "other" (any technical details like thickness, LED, dimensions, grain direction)
If something is unclear or ambiguous, include it in "uncertainTerms".

Also detect dimensions like "2815 x 582mm H2002mm" and include them in "other".

Respond ONLY with valid JSON array format:
[
  {
    "name": "component name",
    "material": "material name or null",
    "finish": "finish description or null", 
    "other": "other technical details or null",
    "uncertainTerms": ["list", "of", "unclear", "terms"] or null
  }
]

If the description is too vague or empty, return an empty array: []
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAIKey()}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API klaida:", response.status, errorText);
      return createFallbackComponent(description, `API error ${response.status}: ${errorText.slice(0, 100)}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("OpenAI grąžino tuščią atsakymą");
      return createFallbackComponent(description, "Empty AI response");
    }

    try {
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed)) {
        console.error("AI response not an array:", content.slice(0, 200));
        return createFallbackComponent(description, "Invalid JSON structure");
      }
      return parsed;
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", content.slice(0, 200));
      return createFallbackComponent(description, "JSON parse failed");
    }
  } catch (error) {
    console.error("AI analizės klaida:", error);
    return createFallbackComponent(description, `Network error: ${error}`);
  }
}

function createFallbackComponent(description: string, reason?: string): ParsedComponent[] {
  console.log("Fallback triggered for description:", description.slice(0, 100), "Reason:", reason);
  return [
    {
      name: "Main component",
      material: undefined,
      finish: undefined,
      other: description.slice(0, 400),
      uncertainTerms: reason ? [`AI failed: ${reason}`] : ["AI analysis failed – manual review required"],
    },
  ];
}
