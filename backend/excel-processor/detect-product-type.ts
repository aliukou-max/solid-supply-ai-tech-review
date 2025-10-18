import db from "../db";
import type { ProductTypeMatch } from "./types";

export async function detectProductType(
  productName: string,
  description: string
): Promise<ProductTypeMatch> {
  const combinedText = `${productName} ${description}`.toLowerCase();
  
  const synonyms = await db.queryAll<{ 
    synonym: string; 
    productTypeId: string; 
    productTypeName: string 
  }>`
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

export async function determineProductTypeFromName(
  productName: string, 
  description: string
): Promise<string> {
  const combinedText = `${productName} ${description}`.toLowerCase();
  
  const synonyms = await db.queryAll<{ synonym: string; productTypeId: string }>`
    SELECT s.synonym, s.product_type_id as "productTypeId"
    FROM product_type_synonyms s
    ORDER BY LENGTH(s.synonym) DESC
  `;

  for (const { synonym, productTypeId } of synonyms) {
    const pattern = new RegExp(`\\b${synonym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(combinedText)) {
      console.log(`✓ Product "${productName}" assigned type "${productTypeId}" via synonym "${synonym}"`);
      return productTypeId;
    }
  }

  console.log(`⚠ Product "${productName}" not assigned to any type, using "Kita"`);
  const kita = await db.queryRow<{ id: string }>`
    SELECT id FROM product_types WHERE LOWER(name) = 'kita' OR LOWER(id) = 'kita' LIMIT 1
  `;
  return kita?.id || "Kita";
}
