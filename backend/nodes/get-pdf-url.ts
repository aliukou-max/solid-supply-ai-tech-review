import { api } from "encore.dev/api";
import { nodesBucket } from "./storage";

interface GetPdfUrlRequest {
  pdfPath: string;
}

interface GetPdfUrlResponse {
  url: string;
}

export const getPdfUrl = api<GetPdfUrlRequest, GetPdfUrlResponse>(
  { expose: true, method: "GET", path: "/nodes/pdf-url" },
  async (req) => {
    const { url } = await nodesBucket.signedDownloadUrl(req.pdfPath, {
      ttl: 3600,
    });
    
    return { url };
  }
);
