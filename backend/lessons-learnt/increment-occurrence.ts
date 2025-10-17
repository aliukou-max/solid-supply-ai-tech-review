import { api } from "encore.dev/api";
import db from "../db";

// Increments the occurrence count of a lesson learnt
export const incrementOccurrence = api<{ id: number }, void>(
  { expose: true, method: "POST", path: "/lessons-learnt/:id/increment" },
  async ({ id }) => {
    const now = new Date();
    await db.exec`
      UPDATE lessons_learnt 
      SET occurrence_count = occurrence_count + 1, updated_at = ${now}
      WHERE id = ${id}
    `;
  }
);
