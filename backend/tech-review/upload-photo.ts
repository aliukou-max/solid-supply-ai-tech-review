import { api } from "encore.dev/api";
import { componentPhotos } from "./storage";

interface UploadPhotoRequest {
  fileName: string;
  fileData: string;
  contentType: string;
}

interface UploadPhotoResponse {
  url: string;
}

export const uploadPhoto = api(
  { method: "POST", path: "/tech-review/upload-photo", expose: true },
  async (req: UploadPhotoRequest): Promise<UploadPhotoResponse> => {
    const buffer = Buffer.from(req.fileData, "base64");
    const timestamp = Date.now();
    const safeName = req.fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const objectName = `${timestamp}-${safeName}`;

    await componentPhotos.upload(objectName, buffer, {
      contentType: req.contentType,
    });

    const url = componentPhotos.publicUrl(objectName);
    return { url };
  }
);
