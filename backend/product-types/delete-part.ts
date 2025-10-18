import { api } from "encore.dev/api";
import db from "../db";
import type { DeleteProductTypePartRequest } from "./types";

export const deletePart = api(
  { method: "DELETE", path: "/product-types/parts/:id", expose: true },
  async (req: DeleteProductTypePartRequest): Promise<void> => {
    await db.exec`
      DELETE FROM product_type_parts
      WHERE id = ${req.id}
    `;
  }
);
