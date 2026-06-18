import type { ApiErrorResponse } from "@/types";

export const ERROR_CODES = {
  NO_FILE: "NO_FILE",
  INVALID_TYPE: "INVALID_TYPE",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  EMPTY_FILE: "EMPTY_FILE",
  CORRUPT_IMAGE: "CORRUPT_IMAGE",
  NO_SUBJECT: "NO_SUBJECT",
  BG_SERVICE_FAILED: "BG_SERVICE_FAILED",
  BG_SERVICE_QUOTA: "BG_SERVICE_QUOTA",
  BG_SERVICE_TIMEOUT: "BG_SERVICE_TIMEOUT",
  FLIP_FAILED: "FLIP_FAILED",
  STORAGE_UPLOAD_FAILED: "STORAGE_UPLOAD_FAILED",
  STORAGE_DELETE_FAILED: "STORAGE_DELETE_FAILED",
  INVALID_DELETE_PATH: "INVALID_DELETE_PATH",
  UNKNOWN: "UNKNOWN",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  NO_FILE: "Please choose an image before starting.",
  INVALID_TYPE: "Only JPG, PNG, and WEBP images are supported.",
  FILE_TOO_LARGE: "This image is too large. Please upload an image under 10MB.",
  EMPTY_FILE: "This file appears to be empty.",
  CORRUPT_IMAGE: "This image appears to be corrupted. Please try another file.",
  NO_SUBJECT: "No clear subject was detected. Try a photo with one main object.",
  BG_SERVICE_FAILED: "Background removal service is temporarily unavailable.",
  BG_SERVICE_QUOTA: "Background removal quota is exhausted. Please try again later.",
  BG_SERVICE_TIMEOUT: "Processing took too long. Please try a smaller image.",
  FLIP_FAILED: "Could not apply the flip. Please try again with another image.",
  STORAGE_UPLOAD_FAILED: "Image was processed but could not be saved. Please try again.",
  STORAGE_DELETE_FAILED: "Could not delete the image. Please try again.",
  INVALID_DELETE_PATH: "Invalid image path.",
  UNKNOWN: "Something went wrong. Please try again.",
};

export class AppError extends Error {
  code: ErrorCode;
  status: number;

  constructor(code: ErrorCode, message = ERROR_MESSAGES[code], status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function errorResponse(error: unknown): Response {
  const appError =
    error instanceof AppError
      ? error
      : new AppError(ERROR_CODES.UNKNOWN, ERROR_MESSAGES.UNKNOWN, 500);

  const payload: ApiErrorResponse = {
    error: appError.code,
    code: appError.code,
    message: appError.message,
  };

  return Response.json(payload, { status: appError.status });
}

export function messageForCode(code: ErrorCode) {
  return ERROR_MESSAGES[code];
}

export function mapClipdropStatus(status: number): AppError {
  if (status === 401 || status === 403) {
    return new AppError(
      ERROR_CODES.BG_SERVICE_FAILED,
      "Background removal service is not configured correctly.",
      502,
    );
  }

  if (status === 402) {
    return new AppError(ERROR_CODES.BG_SERVICE_QUOTA, undefined, 502);
  }

  if (status === 429) {
    return new AppError(
      ERROR_CODES.BG_SERVICE_FAILED,
      "Too many requests. Please wait a moment and try again.",
      429,
    );
  }

  if (status === 400) {
    return new AppError(
      ERROR_CODES.NO_SUBJECT,
      "This image could not be processed. Try a clearer image with one main subject.",
      422,
    );
  }

  return new AppError(ERROR_CODES.BG_SERVICE_FAILED, undefined, 502);
}
