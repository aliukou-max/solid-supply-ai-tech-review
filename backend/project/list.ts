import { api } from "encore.dev/api";
import db from "../db";
import type { Project } from "./create";

interface ListProjectsResponse {
  projects: Project[];
}

// Retrieves all projects, ordered by creation date (latest first)
export const list = api<void, ListProjectsResponse>(
  { expose: true, method: "GET", path: "/projects" },
  async () => {
    const rows = await db.queryAll<Project>`
      SELECT id, name, client, status, project_type as "projectType", created_at as "createdAt", updated_at as "updatedAt"
      FROM projects
      ORDER BY created_at DESC
    `;

    return { projects: rows };
  }
);
