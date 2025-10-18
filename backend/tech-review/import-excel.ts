import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import db from "../db";

const openAIKey = secret("OpenAIKey");

interface ExcelRow {
  ssCode: string;
  productName: string;
  description: string;
  projectCode: string;
}

interface ParsedComponent {
  name: string;
  material?: string;
  finish?: string;
  other?: string;
  uncertainTerms?: string[];
}

interface ImportExcelRequest {
  projectId: string;
  fileData: string;
  filename: string;
}

interface ImportExcelResponse {
  success: boolean;
  productsCreated: number;
  warnings: string[];
}

export const importExcel = api(
  { expose: true, method: "POST", path: "/tech-review/import-excel" },
  async (req: ImportExcelRequest): Promise<ImportExcelResponse> => {
    const warnings: string[] = [];
    let productsCreated = 0;

    try {
      const buffer = Buffer.from(req.fileData, "base64");
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

      const rows: ExcelRow[] = [];
      let rowIndex = 26;

      while (true) {
        const ssCodeCell = firstSheet[`B${rowIndex}`];
        if (!ssCodeCell || !ssCodeCell.v) break;

        const productNameCell = firstSheet[`C${rowIndex}`];
        const descriptionCell = firstSheet[`AC${rowIndex}`];
        const projectCodeCell = firstSheet[`C8`];

        if (productNameCell?.v && descriptionCell?.v) {
          rows.push({
            ssCode: String(ssCodeCell.v),
            productName: String(productNameCell.v),
            description: String(descriptionCell.v),
            projectCode: projectCodeCell?.v ? String(projectCodeCell.v) : req.projectId,
          });
        }

        rowIndex++;
        if (rowIndex > 1000) break;
      }

      for (const row of rows) {
        try {
          const productId = `${row.projectCode}-${row.ssCode}`;

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
            VALUES (${productId}, ${req.projectId}, ${row.ssCode}, ${row.productName}, ${productType}, false, NOW(), NOW())
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

          productsCreated++;
        } catch (error) {
          console.error(`Error processing ${row.ssCode}:`, error);
          warnings.push(`Klaida apdorojant ${row.ssCode}: ${error}`);
        }
      }

      return {
        success: true,
        productsCreated,
        warnings,
      };
    } catch (error) {
      console.error("Import error:", error);
      throw new Error(`Failed to import Excel: ${error}`);
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
