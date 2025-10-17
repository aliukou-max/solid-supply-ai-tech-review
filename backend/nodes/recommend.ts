import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import db from "../db";
import type { Node } from "./types";

const openAIKey = secret("OpenAIKey");

interface NodeRecommendation {
  node: Node;
  confidence: number;
  reason: string;
}

interface RecommendNodesParams {
  productId: string;
}

interface RecommendNodesResponse {
  recommendations: NodeRecommendation[];
}

// Recommends relevant nodes based on product type, similar projects, and AI analysis
export const recommend = api<RecommendNodesParams, RecommendNodesResponse>(
  { expose: true, method: "POST", path: "/nodes/recommend" },
  async ({ productId }) => {
    const product = await db.queryRow<{
      type: string;
      name: string;
      dimensions?: string;
      projectId: string;
    }>`
      SELECT type, name, dimensions, project_id as "projectId"
      FROM products
      WHERE id = ${productId}
    `;

    if (!product) {
      return { recommendations: [] };
    }

    const project = await db.queryRow<{
      projectType?: string;
    }>`
      SELECT project_type as "projectType"
      FROM projects
      WHERE id = ${product.projectId}
    `;

    const allNodes = await db.queryAll<Node>`
      SELECT 
        id, product_code as "productCode", brand_name as "brandName",
        part_name as "partName", description, pdf_url as "pdfUrl",
        product_type as "productType", created_at as "createdAt"
      FROM nodes
      ORDER BY created_at DESC
    `;

    if (allNodes.length === 0) {
      return { recommendations: [] };
    }

    const similarProducts = await db.queryAll<{
      productId: string;
      nodeIds: string[];
    }>`
      SELECT DISTINCT
        p.id as "productId",
        ARRAY_AGG(DISTINCT c.node_id) FILTER (WHERE c.node_id IS NOT NULL) as "nodeIds"
      FROM products p
      LEFT JOIN tech_reviews tr ON tr.product_id = p.id
      LEFT JOIN components c ON c.tech_review_id = tr.id
      WHERE p.type = ${product.type}
        AND p.id != ${productId}
        AND c.node_id IS NOT NULL
      GROUP BY p.id
      LIMIT 10
    `;

    const usedNodeIds = new Set<string>();
    similarProducts.forEach(sp => {
      sp.nodeIds?.forEach(nodeId => usedNodeIds.add(nodeId));
    });

    const nodesByProductType = allNodes.filter(
      node => node.productType && node.productType.toLowerCase() === product.type.toLowerCase()
    );

    const prompt = `You are a technical expert analyzing product components for a manufacturing company.

Product Details:
- Type: ${product.type}
- Name: ${product.name}
- Dimensions: ${product.dimensions || "Not specified"}
- Project Type: ${project?.projectType || "Not specified"}

Available Nodes (component library):
${allNodes.slice(0, 50).map((node, i) => 
  `${i + 1}. ID: ${node.id}
   Product Code: ${node.productCode}
   Brand: ${node.brandName}
   Part: ${node.partName}
   Product Type: ${node.productType || "Not specified"}
   Description: ${node.description}`
).join("\n\n")}

${usedNodeIds.size > 0 ? `\nNodes frequently used in similar ${product.type} products: ${Array.from(usedNodeIds).join(", ")}` : ""}

Analyze the product and recommend the 5 most relevant nodes with confidence scores (0-100).
Consider: product type match, component compatibility, past usage patterns, and technical requirements.

Respond ONLY with a JSON array (no markdown formatting):
[
  {
    "nodeId": "node_id_here",
    "confidence": 85,
    "reason": "Brief explanation"
  }
]`;

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
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json() as { 
        choices?: Array<{ message?: { content?: string } }> 
      };
      const aiResponse = data.choices?.[0]?.message?.content || "[]";

      const cleanedResponse = aiResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const aiRecommendations = JSON.parse(cleanedResponse) as Array<{
        nodeId: string;
        confidence: number;
        reason: string;
      }>;

      const recommendations: NodeRecommendation[] = aiRecommendations
        .map(rec => {
          const node = allNodes.find(n => n.id === rec.nodeId);
          if (!node) return null;
          
          let adjustedConfidence = rec.confidence;
          if (usedNodeIds.has(node.id)) {
            adjustedConfidence = Math.min(100, adjustedConfidence + 15);
          }
          if (node.productType && node.productType.toLowerCase() === product.type.toLowerCase()) {
            adjustedConfidence = Math.min(100, adjustedConfidence + 10);
          }

          return {
            node,
            confidence: adjustedConfidence,
            reason: rec.reason,
          };
        })
        .filter((rec): rec is NodeRecommendation => rec !== null)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5);

      return { recommendations };
    } catch (error) {
      console.error("AI recommendation error:", error);

      const fallbackRecommendations: NodeRecommendation[] = [];

      nodesByProductType.slice(0, 3).forEach(node => {
        const confidence = usedNodeIds.has(node.id) ? 75 : 60;
        fallbackRecommendations.push({
          node,
          confidence,
          reason: `Matches product type: ${product.type}`,
        });
      });

      const frequentlyUsedNodes = allNodes.filter(node => usedNodeIds.has(node.id));
      frequentlyUsedNodes.slice(0, 2).forEach(node => {
        if (!fallbackRecommendations.find(r => r.node.id === node.id)) {
          fallbackRecommendations.push({
            node,
            confidence: 70,
            reason: `Frequently used in similar ${product.type} products`,
          });
        }
      });

      return { 
        recommendations: fallbackRecommendations
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 5)
      };
    }
  }
);
