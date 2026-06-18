export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const ACCEPTED_EXTENSIONS = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
} as const;

export const MAX_UPLOAD_SIZE_MB = Number(process.env.MAX_UPLOAD_SIZE_MB ?? 10);
export const MAX_FILE_SIZE = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
export const MAX_HISTORY_ITEMS = 5;
export const HISTORY_STORAGE_KEY = "pixelforge-history";
export const MAX_IMAGE_DIMENSION = 4000;
export const PROCESSING_STAGES = [
  "uploading",
  "analyzing",
  "removing-bg",
  "flipping",
  "finalizing",
] as const;

