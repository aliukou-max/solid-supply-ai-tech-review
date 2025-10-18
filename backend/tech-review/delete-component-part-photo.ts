import { api } from "encore.dev/api";
import db from "../db";

export interface DeleteComponentPartPhotoRequest {
  partId: number;
  photoUrl: string;
}

export const deleteComponentPartPhoto = api(
  { method: "DELETE", path: "/tech-reviews/component-parts/:partId/photo", expose: true },
  async (req: DeleteComponentPartPhotoRequest): Promise<void> => {
    await db.exec`
      DELETE FROM component_part_photos
      WHERE component_part_id = ${req.partId} AND photo_url = ${req.photoUrl}
    `;
  }
);
