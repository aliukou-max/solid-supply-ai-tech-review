export type Severity = "low" | "medium" | "high" | "critical";

export interface LessonLearnt {
  id: number;
  productType: string;
  errorDescription: string;
  solution: string;
  occurrenceCount: number;
  severity: Severity;
  createdAt: Date;
  updatedAt: Date;
}
