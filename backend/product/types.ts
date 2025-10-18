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
  productTypeId?: string;
  dimensions?: string;
  hasDrawing: boolean;
  drawingReference?: string;
  createdAt: Date;
  updatedAt: Date;
}
