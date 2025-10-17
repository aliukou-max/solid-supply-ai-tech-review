import { api } from "encore.dev/api";
import db from "../db";

interface AddPhotosRequest {
  componentId: number;
  photoUrls: string[];
}

interface AddPhotosResponse {
  success: boolean;
  photoIds: number[];
}

export const addPhotos = api<AddPhotosRequest, AddPhotosResponse>(
  { expose: true, method: "POST", path: "/tech-reviews/components/:componentId/photos" },
  async ({ componentId, photoUrls }) => {
    const photoIds: number[] = [];

    const maxOrder = await db.queryRow<{ max: number | null }>`
      SELECT MAX(display_order) as max
      FROM component_photos
      WHERE component_id = ${componentId}
    `;

    let nextOrder = (maxOrder?.max ?? -1) + 1;

    for (const photoUrl of photoUrls) {
      const result = await db.queryRow<{ id: number }>`
        INSERT INTO component_photos (component_id, photo_url, display_order)
        VALUES (${componentId}, ${photoUrl}, ${nextOrder})
        RETURNING id
      `;
      
      if (result) {
        photoIds.push(result.id);
        nextOrder++;
      }
    }

    return { success: true, photoIds };
  }
);
