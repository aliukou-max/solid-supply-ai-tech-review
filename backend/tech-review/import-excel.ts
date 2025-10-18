import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import db from "../db";

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
    bodyLimit: 50 * 1024 * 1024, // 50MB limit for large Excel files
  },
  async (req: ImportExcelRequest): Promise<ImportExcelResponse> => {
    const warnings: string[] = [];
    let productsCreated = 0;

    try {
      if (!req.fileData || req.fileData.trim().length === 0) {
        throw new Error("Excel failas tuščias arba nerastas");
      }

      const buffer = Buffer.from(req.fileData, "base64");
      
      if (buffer.length === 0) {
        throw new Error("Excel failas negali būti nuskaitytas");
      }

      const XLSX = await import("xlsx");
      const workbook = XLSX.read(buffer, { type: "buffer" });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error("Excel failas neturi lapų");
      }

      // Look for "products information" sheet
      const sheetName = workbook.SheetNames.find(name => 
        name.toLowerCase().includes("products information") || 
        name.toLowerCase().includes("products_information") ||
        name.toLowerCase() === "products information"
      );

      if (!sheetName) {
        throw new Error(`Nerastas "products information" lapas. Rasti lapai: ${workbook.SheetNames.join(", ")}`);
      }

      const firstSheet = workbook.Sheets[sheetName];

      if (!firstSheet) {
        throw new Error("Nepavyko nuskaityti Excel lapo");
      }

      console.log(`Reading from sheet: ${sheetName}`);

      const projectCodeCell = firstSheet["C8"];
      const projectNameCell = firstSheet["C9"];
      const clientNameCell = firstSheet["C10"];

      if (!projectCodeCell || !projectCodeCell.v) {
        throw new Error("Projekto kodas nerastas langelyje C8. Patikrinkite ar failas turi teisingą formatą.");
      }

      const projectCode = String(projectCodeCell.v).trim();
      const projectName = projectNameCell?.v ? String(projectNameCell.v).trim() : projectCode;
      const clientName = clientNameCell?.v ? String(clientNameCell.v).trim() : "Unknown Client";

      console.log(`Importing project: ${projectCode} - ${projectName} (${clientName})`);

      const existingProject = await db.queryRow`
        SELECT id FROM projects WHERE id = ${projectCode}
      `;

      if (!existingProject) {
        await db.exec`
          INSERT INTO projects (id, name, client, status, project_type, created_at, updated_at)
          VALUES (${projectCode}, ${projectName}, ${clientName}, 'active', 'new_development', NOW(), NOW())
        `;
        console.log(`Created project: ${projectCode}`);
      } else {
        console.log(`Project ${projectCode} already exists, will add products to it`);
      }

      const rows: ExcelRow[] = [];
      let rowIndex = 26;

      while (true) {
        const ssCodeCell = firstSheet[`B${rowIndex}`];
        if (!ssCodeCell || !ssCodeCell.v) break;

        const productNameCell = firstSheet[`C${rowIndex}`];
        const descriptionCell = firstSheet[`AC${rowIndex}`];

        if (productNameCell?.v) {
          rows.push({
            ssCode: String(ssCodeCell.v).trim(),
            productName: String(productNameCell.v).trim(),
            description: descriptionCell?.v ? String(descriptionCell.v).trim() : "",
          });
        }

        rowIndex++;
        if (rowIndex > 1000) break;
      }

      console.log(`Found ${rows.length} products to import`);

      if (rows.length === 0) {
        throw new Error("Excel faile nerasta jokių produktų. Patikrinkite ar duomenys prasideda eilutėje 26 (stulpelis B).");
      }

      for (const row of rows) {
        try {
          const productId = `${projectCode}-${row.ssCode}`;

          const existingProduct = await db.queryRow`
            SELECT id FROM products WHERE id = ${productId}
          `;

          if (existingProduct) {
            warnings.push(`SS ${row.ssCode} jau egzistuoja, praleista`);
            continue;
          }

          const productType = determineProductType(row.productName);

          await db.exec`
            INSERT INTO products (id, project_id, ss_code, name, type, has_drawing, created_at, updated_at)
            VALUES (${productId}, ${projectCode}, ${row.ssCode}, ${row.productName}, ${productType}, false, NOW(), NOW())
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

          if (row.description && row.description.length > 0) {
            const components = await analyzeDescriptionWithAI(row.description, productType);

            for (const comp of components) {
              const uncertainTermsNote = comp.uncertainTerms && comp.uncertainTerms.length > 0
                ? `⚠ Neaiškūs terminai: ${comp.uncertainTerms.join(", ")}`
                : undefined;

              await db.exec`
                INSERT INTO components (
                  tech_review_id, name, material, finish, technical_notes,
                  created_at, updated_at
                )
                VALUES (
                  ${techReview.id}, ${comp.name}, ${comp.material || null}, ${comp.finish || null},
                  ${comp.other || uncertainTermsNote || null},
                  NOW(), NOW()
                )
              `;

              if (comp.uncertainTerms && comp.uncertainTerms.length > 0) {
                warnings.push(
                  `${row.ssCode} – "${comp.name}" turi neaiškių terminų: ${comp.uncertainTerms.join(", ")}`
                );
              }
            }
          } else {
            warnings.push(`${row.ssCode} – trūksta aprašymo (stulpelis AC), komponentai nesukurti`);
          }

          productsCreated++;
          console.log(`Created product ${row.ssCode} (${productsCreated}/${rows.length})`);
        } catch (error) {
          console.error(`Error processing ${row.ssCode}:`, error);
          warnings.push(`Klaida apdorojant ${row.ssCode}: ${error}`);
        }
      }

      console.log(`Import completed: ${productsCreated} products created with ${warnings.length} warnings`);

      return {
        success: true,
        projectId: projectCode,
        projectName,
        productsCreated,
        warnings,
      };
    } catch (error) {
      console.error("Import error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Nepavyko importuoti Excel failo: ${errorMessage}`);
    }
  }
);

function determineProductType(productName: string): string {
  const name = productName.toLowerCase();
  
  if (name.includes("backwall") || name.includes("back wall")) return "Backwall";
  if (name.includes("lightbox") || name.includes("light box")) return "Lightbox";
  if (name.includes("shelf") || name.includes("shelv") || name.includes("lentyna")) return "Lentyna";
  if (name.includes("vitrina") || name.includes("showcase") || name.includes("cabinet")) return "Vitrina";
  if (name.includes("table") || name.includes("stalas") || name.includes("island") || name.includes("desk")) return "Stalas";
  
  return "Kita";
}

async function analyzeDescriptionWithAI(description: string, productType: string): Promise<ParsedComponent[]> {
  try {
    const prompt = `You are an expert at parsing furniture/retail fixture technical descriptions into structured component data.

Product Type: ${productType}
Description: ${description}

Extract ALL components mentioned in the description. For each component, identify:
1. Component name (e.g., "Carcass", "Top panel", "Shelves", "Back panel")
2. Material (e.g., "MDF", "Black marble Grand Antique", "Stainless steel", "Acrylic")
3. Finish (e.g., "HPL brushed brass", "Polished", "Satin", "Brushed")
4. Other details (e.g., "20mm thickness", "LED 3500K strip", "grain vertical", "hidden fix")

IMPORTANT: If you find ANY unclear or unusual terms that don't fit standard materials/finishes (like "patina hybrid composite", "glossed", unusual color codes), list them as "uncertainTerms".

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

Example response:
[
  {
    "name": "Carcass",
    "material": "Fireproof MDF",
    "finish": "HPL brushed brass",
    "other": "glued, hidden fix",
    "uncertainTerms": null
  },
  {
    "name": "Top panel",
    "material": "Black marble Grand Antique",
    "finish": "Polished",
    "other": "20mm thickness",
    "uncertainTerms": null
  }
]

If the description is too vague or empty, return an empty array: []`;

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
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", await response.text());
      return createFallbackComponent(description);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return createFallbackComponent(description);
    }

    let parsed;
    try {
      const jsonData = JSON.parse(content);
      parsed = jsonData.components || jsonData;
    } catch {
      return createFallbackComponent(description);
    }

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }

    return createFallbackComponent(description);
  } catch (error) {
    console.error("AI analysis error:", error);
    return createFallbackComponent(description);
  }
}

function createFallbackComponent(description: string): ParsedComponent[] {
  return [
    {
      name: "Main component",
      material: undefined,
      finish: undefined,
      other: description.substring(0, 500),
      uncertainTerms: ["AI analysis failed - manual review needed"],
    },
  ];
}
