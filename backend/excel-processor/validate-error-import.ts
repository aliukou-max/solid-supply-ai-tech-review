import db from "../db";
import type { ErrorRow } from "./types";

export interface ValidationResult {
  isValid: boolean;
  productId: string;
  warning?: string;
}

export async function validateErrorRow(error: ErrorRow): Promise<ValidationResult> {
  const productId = error.productCode;

  let product;
  try {
    product = await db.queryRow<{ id: string }>`
      SELECT id FROM products WHERE id = ${productId}
    `;
  } catch {
    return {
      isValid: false,
      productId,
      warning: `Eilutė ${error.rowNumber}: produktas ${productId} nerastas`,
    };
  }

  let existingError;
  try {
    existingError = await db.queryRow<{ id: string }>`
      SELECT id FROM production_errors 
      WHERE product_id = ${productId} 
      AND LOWER(description) = LOWER(${error.description})
      AND deleted_at IS NULL
    `;
    return {
      isValid: false,
      productId,
      warning: `Eilutė ${error.rowNumber}: klaida jau egzistuoja (${productId})`,
    };
  } catch {
  }

  return {
    isValid: true,
    productId,
  };
}
