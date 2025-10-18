export interface ColumnMapping {
  ssCodeColumn: string;
  productNameColumn: string;
  descriptionColumn: string;
  confidence: "high" | "medium" | "low";
  alternativeDescriptionColumns: string[];
}

export interface ExtractedRow {
  ssCode: string;
  productName: string;
  description: string;
  rowNumber: number;
}

export interface ProductTypeMatch {
  typeId: string | null;
  typeName: string | null;
  matchedKeyword: string | null;
}

export interface ErrorRow {
  productCode: string;
  description: string;
  rowNumber: number;
}

export interface ProjectBlock {
  projectCode: string;
  startRow: number;
}
