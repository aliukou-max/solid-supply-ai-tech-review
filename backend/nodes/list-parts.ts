import { api } from "encore.dev/api";
import db from "../db";

interface PartGroup {
  partName: string;
  count: number;
}

interface ListByPartResponse {
  parts: PartGroup[];
}

export const listParts = api<void, ListByPartResponse>(
  { expose: true, method: "GET", path: "/nodes/parts" },
  async () => {
    const result = await db.query`
      SELECT part_name, COUNT(*) as count
      FROM nodes
      GROUP BY part_name
      ORDER BY part_name ASC
    `;

    const parts: PartGroup[] = [];
    for await (const row of result) {
      parts.push({
        partName: row.part_name,
        count: Number(row.count),
      });
    }

    return { parts };
  }
);
