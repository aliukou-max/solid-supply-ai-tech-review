import { api, APIError } from "encore.dev/api";
import db from "../db";
import type { Project } from "./create";

// Retrieves a project by ID
export const get = api<{ id: string }, Project>(
  { expose: true, method: "GET", path: "/projects/:id" },
  async ({ id }) => {
    const row = await db.queryRow<Project>`
      SELECT id, name, client, status, created_at as "createdAt", updated_at as "updatedAt"
      FROM projects
      WHERE id = ${id}
    `;

    if (!row) {
      throw APIError.notFound("project not found");
    }

    return row;
  }
);
