export enum ComparisonStatus {
  MATCH = "Khớp",
  MISMATCH = "Sai lệch",
  MISSING = "Thiếu",
}

export interface BoundingBox {
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  width: number; // 0-100 percentage
  height: number; // 0-100 percentage
}

export interface ComparisonItem {
  component: string;
  status: ComparisonStatus;
  description: string;
  requirement: string;
  boundingBox?: BoundingBox;
}

export interface QCReport {
  timestamp: string;
  customerFile: string; // base64
  proofFile: string; // base64
  items: ComparisonItem[];
  conclusion: "ĐẠT" | "KHÔNG ĐẠT";
  overallSummary: string;
}
