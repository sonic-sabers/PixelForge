export type ProcessingStage =
  | "idle"
  | "selected"
  | "uploading"
  | "analyzing"
  | "removing-bg"
  | "flipping"
  | "finalizing"
  | "complete"
  | "error";

export interface ProcessResult {
  id: string;
  processedUrl: string;
  pathname: string;
  originalName: string;
  size: number;
  width?: number;
  height?: number;
  createdAt: string;
}

export interface HistoryItem extends ProcessResult {
  originalPreview?: string;
}

export interface ApiErrorResponse {
  error: string;
  code: string;
  message: string;
}

export type ProcessSuccessResponse = ProcessResult;
