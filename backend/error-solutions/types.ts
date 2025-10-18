export interface ErrorSolution {
  id: number;
  errorId: number;
  solution: string;
  practiceType: 'good' | 'bad';
  createdAt: Date;
  updatedAt: Date;
}
