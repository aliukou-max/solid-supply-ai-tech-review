export interface ComponentPart {
  id: number;
  techReviewId: number;
  productTypePartId: string;
  partName: string;
  photoUrl?: string;
  hasDone: boolean;
  hasNode: boolean;
  hadErrors: boolean;
  material?: string;
  finish?: string;
  notes?: string;
  recommendedNodeId?: string;
  selectedNodeId?: string;
  drawingCode?: string;
  technologicalDescription?: string;
  assemblyTechnology?: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  linkedErrors?: number[];
}
