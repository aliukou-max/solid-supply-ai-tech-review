export type Severity = "low" | "medium" | "high" | "critical";
export type PracticeType = "good" | "bad";

export interface LessonLearnt {
  id: number;
  productType: string;
  errorDescription: string;
  solution: string;
  prevention?: string;
  aiSuggestion?: string;
  practiceType?: PracticeType;
  errorId?: number;
  occurrenceCount: number;
  severity: Severity;
  createdAt: Date;
  updatedAt: Date;
}
