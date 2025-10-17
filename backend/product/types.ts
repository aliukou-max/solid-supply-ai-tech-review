export type ProductType = 
  | "Stalas" 
  | "Backwall" 
  | "Lightbox" 
  | "Lentyna" 
  | "Vitrina" 
  | "Kita";

export interface Product {
  id: string;
  projectId: string;
  ssCode: string;
  name: string;
  type: ProductType;
  dimensions?: string;
  hasDrawing: boolean;
  drawingReference?: string;
  createdAt: Date;
  updatedAt: Date;
}
