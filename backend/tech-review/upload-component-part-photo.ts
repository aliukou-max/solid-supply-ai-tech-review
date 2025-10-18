import { api } from "encore.dev/api";
import { Bucket } from "encore.dev/storage/objects";
import db from "../db";

const componentPartPhotos = new Bucket("component-part-photos", {
  public: true,
});

export interface UploadComponentPartPhotoRequest {
  partId: number;
  filename: string;
  contentType: string;
  fileData: string;
}

export interface UploadComponentPartPhotoResponse {
  url: string;
}

export const uploadComponentPartPhoto = api(
  { method: "POST", path: "/tech-reviews/component-parts/:partId/upload-photo", expose: true },
  async (req: UploadComponentPartPhotoRequest): Promise<UploadComponentPartPhotoResponse> => {
    const buffer = Buffer.from(req.fileData, "base64");
    const timestamp = Date.now();
    const safeName = req.filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const objectName = `part-${req.partId}-${timestamp}-${safeName}`;
    
    await componentPartPhotos.upload(objectName, buffer, {
      contentType: req.contentType,
    });
    
    const url = componentPartPhotos.publicUrl(objectName);
    
    const maxOrder = await db.queryRow<{ maxOrder: number | null }>`
      SELECT MAX(display_order) as "maxOrder"
      FROM component_part_photos
      WHERE component_part_id = ${req.partId}
    `;
    
    const displayOrder = (maxOrder?.maxOrder ?? -1) + 1;
    
    await db.exec`
      INSERT INTO component_part_photos (component_part_id, photo_url, display_order, created_at)
      VALUES (${req.partId}, ${url}, ${displayOrder}, NOW())
    `;
    
    return { url };
  }
);
