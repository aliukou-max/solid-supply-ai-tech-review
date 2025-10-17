import { api } from "encore.dev/api";
import db from "../db";

interface DeleteProjectRequest {
  id: string;
}

export const deleteProject = api<DeleteProjectRequest, void>(
  { expose: true, method: "DELETE", path: "/projects/:id" },
  async ({ id }) => {
    await db.exec`DELETE FROM projects WHERE id = ${id}`;
  }
);
