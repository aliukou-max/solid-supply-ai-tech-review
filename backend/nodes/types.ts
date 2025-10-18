export interface DrawingFile {
  filename: string;
  path: string;
}

export interface Node {
  id: string;
  productCode: string;
  brandName: string;
  partName: string;
  description: string;
  pdfUrl: string;
  drawingFiles?: DrawingFile[];
  productType?: string;
  createdAt: Date;
}
