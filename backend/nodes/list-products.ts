import { api } from "encore.dev/api";
import db from "../db";

interface ListProductsResponse {
  products: Array<{ code: string; count: number }>;
}

export const listProducts = api<void, ListProductsResponse>(
  { expose: true, method: "GET", path: "/nodes/products" },
  async () => {
    const rows = await db.queryAll<{
      product_code: string;
      count: number;
    }>`
      SELECT product_code, COUNT(*) as count
      FROM nodes
      GROUP BY product_code
      ORDER BY product_code
    `;

    return {
      products: rows.map((row) => ({
        code: row.product_code,
        count: Number(row.count),
      })),
    };
  }
);
