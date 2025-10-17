import { api } from "encore.dev/api";
import db from "../db";

interface DeletePhotoRequest {
  photoId: number;
}

interface DeletePhotoResponse {
  success: boolean;
}

export const deletePhoto = api<DeletePhotoRequest, DeletePhotoResponse>(
  { expose: true, method: "DELETE", path: "/tech-reviews/photos/:photoId" },
  async ({ photoId }) => {
    await db.exec`
      DELETE FROM component_photos
      WHERE id = ${photoId}
    `;

    return { success: true };
  }
);
