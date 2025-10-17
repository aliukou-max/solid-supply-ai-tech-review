export interface TechReview {
  id: number;
  productId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Component {
  id: number;
  techReviewId: number;
  name: string;
  material?: string;
  finish?: string;
  color?: string;
  grainDirection?: string;
  technicalNotes?: string;
  assemblyNotes?: string;
  nodeId?: string;
  photoUrl?: string;
  photos?: ComponentPhoto[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ComponentPhoto {
  id: number;
  componentId: number;
  photoUrl: string;
  displayOrder: number;
  createdAt: Date;
}

export interface Error {
  id: number;
  techReviewId: number;
  componentId?: number;
  description: string;
  solution?: string;
  lessonLearntId?: number;
  status: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface AISuggestion {
  id: number;
  techReviewId: number;
  errorId?: number;
  suggestion: string;
  confidence?: number;
  createdAt: Date;
}
