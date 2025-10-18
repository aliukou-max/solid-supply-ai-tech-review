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
      await workbook.xlsx.load(buffer);

      const sheet =
        workbook.getWorksheet("Products information") ||
        workbook.worksheets.find((s) =>
          s.name.toLowerCase().includes("products information")
        );

      if (!sheet)
        throw new Error(
          `Nerastas lapas "Products information". Rasti: ${workbook.worksheets
            .map((s) => s.name)
            .join(", ")}`
        );

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
        const match = req.filename.match(/(MKZ\d{6}|AB\d{6})/i);
        if (match) {
          projectCode = match[0].toUpperCase();
          warnings.push(`⚠ Projekto kodas paimtas iš failo pavadinimo: ${projectCode}`);
        } else {
          projectCode = "TEMP-" + Date.now();
          warnings.push("⚠ Projekto kodas nerastas — naudotas laikinas kodas.");
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

      const projectDescription = sheet.getCell("AC26").text?.trim();
      if (projectDescription && !projectDescription.includes("GMT") && !projectDescription.includes("Coordinated")) {
        console.log(`📝 Projekto aprašymas: ${projectDescription.substring(0, 100)}...`);
      }

      const rows: ExcelRow[] = [];
      let i = 27;

      while (true) {
        const ss = sheet.getCell(`B${i}`).text?.trim();
        const name = sheet.getCell(`C${i}`).text?.trim();
        const desc = sheet.getCell(`AC${i}`).text?.trim();
        if (!ss) break;

        const cleanDesc = desc && !desc.includes("GMT") && !desc.includes("Coordinated") ? desc : "";
        rows.push({ ssCode: ss, productName: name, description: cleanDesc });
        i++;
        if (i > 2000) break;
      }

      if (rows.length === 0)
        throw new Error("Excel faile nerasta produktų (B26+ tušti).");

      console.log(`🔍 Rasta ${rows.length} produktų.`);

      for (const row of rows) {
        try {
          const productId = `${projectCode}-${row.ssCode}`;

          const existingProduct = await db.queryRow`
            SELECT id FROM products WHERE id = ${productId}
          `;
          if (existingProduct) {
            warnings.push(`SS ${row.ssCode} jau egzistuoja, praleista.`);
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

          if (!row.description) {
            warnings.push(`${row.ssCode} – aprašymas tuščias (stulpelis AC).`);
            productsCreated++;
            continue;
          }

          const components = await analyzeDescriptionWithAI(row.description);

          for (const comp of components) {
            const note =
              comp.uncertainTerms?.length
                ? `⚠ Neaiškūs terminai: ${comp.uncertainTerms.join(", ")}`
                : comp.other;

            await db.exec`
              INSERT INTO components (
                tech_review_id, name, material, finish, technical_notes, created_at, updated_at
              )
              VALUES (
                ${techReview.id},
                ${comp.name},
                ${comp.material || null},
                ${comp.finish || null},
                ${note || null},
                NOW(), NOW()
              )
            `;
          }

          productsCreated++;
        } catch (err) {
          warnings.push(`Klaida apdorojant ${row.ssCode}: ${err}`);
        }
      }

      console.log(`✅ Importuota: ${productsCreated} produktų.`);
      return {
        success: true,
        projectId: projectCode,
        projectName,
        productsCreated,
        warnings,
      };
    } catch (err) {
      console.error("❌ Klaida importuojant:", err);
      throw new Error(
        `Nepavyko importuoti Excel failo: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }
);

async function analyzeDescriptionWithAI(description: string): Promise<ParsedComponent[]> {
  try {
    const prompt = `
You are an expert in furniture and retail fixture engineering.
Parse the following technical description into structured component data.

Description:
${description}

For each distinct component, extract:
- "name" (e.g. Carcass, Header, Shelves, Back panel, Wall cladding)
- "material" (MDF, marble, HPL, steel, acrylic, etc.)
- "finish" (brushed, polished, satin, painted, etc.)
- "other" (any technical details like thickness, LED, dimensions, grain direction)
If something is unclear or ambiguous, include it in "uncertainTerms".

Also detect dimensions like "2815 x 582mm H2002mm" and include them in "other".

Return valid JSON array only.
`;

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
      console.error("OpenAI API klaida:", await response.text());
      return createFallbackComponent(description);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;

    if (!content) return createFallbackComponent(description);

    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : createFallbackComponent(description);
    } catch {
      return createFallbackComponent(description);
    }
  } catch (error) {
    console.error("AI analizės klaida:", error);
    return createFallbackComponent(description);
  }
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

function createFallbackComponent(description: string): ParsedComponent[] {
  return [
    {
      name: "Main component",
      material: undefined,
      finish: undefined,
      other: description.slice(0, 400),
      uncertainTerms: ["AI analysis failed – manual review required"],
    },
  ];
}
