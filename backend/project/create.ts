import { api } from "encore.dev/api";
import db from "../db";

interface CreateProjectParams {
  id: string;
  name: string;
  client: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// Creates a new project
export const create = api<CreateProjectParams, Project>(
  { expose: true, method: "POST", path: "/projects" },
  async (params) => {
    const now = new Date();
    await db.exec`
      INSERT INTO projects (id, name, client, status, created_at, updated_at)
      VALUES (${params.id}, ${params.name}, ${params.client}, 'active', ${now}, ${now})
    `;

    return {
      id: params.id,
      name: params.name,
      client: params.client,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
  }
);
