import { api } from "encore.dev/api";
import db from "../db";

interface ListBrandsResponse {
  brands: Array<{ name: string; count: number }>;
}

export const listBrands = api<void, ListBrandsResponse>(
  { expose: true, method: "GET", path: "/nodes/brands" },
  async () => {
    const rows = await db.queryAll<{
      brand_name: string;
      count: number;
    }>`
      SELECT brand_name, COUNT(*) as count
      FROM nodes
      GROUP BY brand_name
      ORDER BY brand_name
    `;

    return {
      brands: rows.map((row) => ({
        name: row.brand_name,
        count: Number(row.count),
      })),
    };
  }
);
