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

  console.log(`🔍 Validacija: ${fullProductId} -> project="${projectCode}" product="${productCode}"`);

  let existingError;
  try {
    existingError = await db.queryRow<{ id: string }>`
      SELECT id FROM production_errors 
      WHERE project_code = ${projectCode}
      AND product_code = ${productCode}
      AND LOWER(error_description) = LOWER(${error.description})
      AND deleted_at IS NULL
    `;
    console.log(`  ⚠️  Dublikatas rastas!`);
    return {
      isValid: false,
      projectCode,
      productCode,
      warning: `Eilutė ${error.rowNumber}: klaida jau egzistuoja (${fullProductId})`,
    };
  } catch {
    console.log(`  ✅ Validi klaida`);
  }

  return {
    isValid: true,
    projectCode,
    productCode,
  };
}
