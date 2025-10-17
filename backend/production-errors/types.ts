export interface ProductionError {
  id: number;
  projectCode: string;
  productCode: string;
  partName?: string;
  errorDescription: string;
  isResolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
}
