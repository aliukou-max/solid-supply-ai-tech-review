import { api } from "encore.dev/api";
import db from "../db";
import type { Node } from "./types";

interface RecommendForPartRequest {
  partName: string;
  productType: string;
  material?: string;
  finish?: string;
}

interface RecommendForPartResponse {
  recommendations: Array<{
    node: Node;
    matchScore: number;
    reason: string;
  }>;
}

export const recommendForPart = api(
  {
    expose: true,
    method: "POST",
    path: "/nodes/recommend-for-part",
  },
  async (req: RecommendForPartRequest): Promise<RecommendForPartResponse> => {
    const partNameLower = req.partName.toLowerCase();
    const productTypeLower = req.productType.toLowerCase();

    const allNodes = await db.queryAll<Node>`
      SELECT 
        id, product_code as "productCode", brand_name as "brandName",
        part_name as "partName", description, pdf_url as "pdfUrl",
        product_type as "productType", created_at as "createdAt"
      FROM nodes
      WHERE 
        LOWER(part_name) LIKE ${'%' + partNameLower + '%'}
        OR LOWER(product_type) = ${productTypeLower}
      ORDER BY 
        CASE 
          WHEN LOWER(part_name) = ${partNameLower} THEN 1
          WHEN LOWER(part_name) LIKE ${partNameLower + '%'} THEN 2
          WHEN LOWER(part_name) LIKE ${'%' + partNameLower + '%'} THEN 3
          ELSE 4
        END,
        created_at DESC
      LIMIT 20
    `;

    const usageStats = await db.queryAll<{ nodeId: string; usageCount: number }>`
      SELECT 
        node_id as "nodeId",
        COUNT(*) as "usageCount"
      FROM components
      WHERE node_id IS NOT NULL
      GROUP BY node_id
    `;

    const usageMap = new Map(usageStats.map(s => [s.nodeId, Number(s.usageCount)]));

    const recommendations = allNodes.map(node => {
      let score = 0;
      const reasons: string[] = [];

      const nodePartNameLower = (node.partName || "").toLowerCase();
      if (nodePartNameLower === partNameLower) {
        score += 50;
        reasons.push("Tikslus pavadinimo atitikmuo");
      } else if (nodePartNameLower.includes(partNameLower)) {
        score += 30;
        reasons.push("Pavadinimas atitinka");
      } else if (partNameLower.includes(nodePartNameLower)) {
        score += 20;
        reasons.push("Dalinis pavadinimo atitikmuo");
      }

      const nodeProductTypeLower = (node.productType || "").toLowerCase();
      if (nodeProductTypeLower === productTypeLower) {
        score += 25;
        reasons.push("Produkto tipas atitinka");
      }

      if (req.material) {
        const materialLower = req.material.toLowerCase();
        const descLower = (node.description || "").toLowerCase();
        if (descLower.includes(materialLower)) {
          score += 15;
          reasons.push("Medžiaga atitinka");
        }
      }

      if (req.finish) {
        const finishLower = req.finish.toLowerCase();
        const descLower = (node.description || "").toLowerCase();
        if (descLower.includes(finishLower)) {
          score += 10;
          reasons.push("Apdaila atitinka");
        }
      }

      const usageCount = usageMap.get(node.id) || 0;
      if (usageCount > 0) {
        score += Math.min(20, usageCount * 2);
        reasons.push(`Naudotas ${usageCount} kartų`);
      }

      return {
        node,
        matchScore: score,
        reason: reasons.join(" • ") || "Bendras atitikmuo",
      };
    })
    .filter(r => r.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

    return { recommendations };
  }
);
