import { api } from "encore.dev/api";
import db from "../db";

interface DeleteProductRequest {
  id: string;
}

export const deleteProduct = api(
  { expose: true, method: "DELETE", path: "/product/:id" },
  async ({ id }: DeleteProductRequest): Promise<void> => {
    await db.exec`
      DELETE FROM products WHERE id = ${id}
    `;
  }
);
