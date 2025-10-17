import { api } from "encore.dev/api";
import db from "../db";
import type { Project } from "./create";

interface UpdateProjectParams {
  id: string;
  name: string;
  client: string;
  status: string;
  projectType?: string;
}

export const update = api<UpdateProjectParams, Project>(
  { expose: true, method: "PUT", path: "/projects/:id" },
  async (params) => {
    const now = new Date();
    await db.exec`
      UPDATE projects
      SET name = ${params.name},
          client = ${params.client},
          status = ${params.status},
          project_type = ${params.projectType || 'new_development'},
          updated_at = ${now}
      WHERE id = ${params.id}
    `;

    const row = await db.queryRow<Project>`
      SELECT id, name, client, status, project_type as "projectType", created_at as "createdAt", updated_at as "updatedAt"
      FROM projects
      WHERE id = ${params.id}
    `;

    if (!row) {
      throw new Error("Project not found");
    }

    return row;
  }
);
