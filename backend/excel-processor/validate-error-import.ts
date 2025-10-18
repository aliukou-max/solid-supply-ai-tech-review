import db from "../db";
import type { ErrorRow } from "./types";

export interface ValidationResult {
  isValid: boolean;
  projectCode: string;
  productCode: string;
  warning?: string;
}

export async function validateErrorRow(error: ErrorRow): Promise<ValidationResult> {
  const fullProductId = error.productCode;
  const parts = fullProductId.split('-');
  const projectCode = parts[0];
  const productCode = parts.slice(1).join('-');

  console.log(`🔍 Validacija eilutės ${error.rowNumber}:`);
  console.log(`   fullProductId: "${fullProductId}"`);
  console.log(`   projectCode: "${projectCode}"`);
  console.log(`   productCode: "${productCode}"`);
  console.log(`   description: "${error.description}"`);

  let existingError;
  try {
    existingError = await db.queryRow<{ id: string }>`
      SELECT id FROM production_errors 
      WHERE project_code = ${projectCode}
      AND product_code = ${productCode}
      AND LOWER(error_description) = LOWER(${error.description})
      AND deleted_at IS NULL
    `;
    console.log(`  ⚠️  Dublikatas rastas! ID=${existingError.id}`);
    return {
      isValid: false,
      projectCode,
      productCode,
      warning: `Eilutė ${error.rowNumber}: klaida jau egzistuoja (${fullProductId})`,
    };
  } catch (err) {
    console.log(`  ✅ Dublikato nėra (tai gerai)`);
  }

  console.log(`  ➡️  Grąžinama: isValid=true`);
  return {
    isValid: true,
    projectCode,
    productCode,
  };
}
