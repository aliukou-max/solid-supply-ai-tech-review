import { api } from "encore.dev/api";
import db from "../db";
import type { DeleteProductTypeRequest } from "./types";

export const deleteProductType = api(
  { method: "DELETE", path: "/product-types/:id", expose: true },
  async (req: DeleteProductTypeRequest): Promise<void> => {
    await db.exec`
      DELETE FROM product_types
      WHERE id = ${req.id}
    `;
  }
);
