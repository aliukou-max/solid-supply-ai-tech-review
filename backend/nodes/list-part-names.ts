import { api } from "encore.dev/api";
import db from "../db";

export interface PartNamesResponse {
  partNames: string[];
}

export const listPartNames = api<void, PartNamesResponse>(
  { method: "GET", path: "/nodes/part-names", expose: true },
  async () => {
    const result = await db.query`
      SELECT DISTINCT part_name 
      FROM nodes 
      WHERE part_name IS NOT NULL 
      ORDER BY part_name ASC
    `;
    
    const partNames: string[] = [];
    for await (const row of result) {
      partNames.push(row.part_name);
    }
    
    return { partNames };
  }
);
