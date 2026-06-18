import { z } from "zod";
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";
import { AppError, ERROR_CODES } from "@/lib/errors";

export const DeleteSchema = z.object({
  pathname: z
    .string()
    .min(1)
    .refine((value) => value.startsWith("processed/"), {
      message: "Invalid image path.",
    }),
});

export function validateUploadFile(file: File | null): asserts file is File {
  if (!file) {
    throw new AppError(ERROR_CODES.NO_FILE);
  }

  if (file.size <= 0) {
    throw new AppError(ERROR_CODES.EMPTY_FILE);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new AppError(ERROR_CODES.FILE_TOO_LARGE);
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    throw new AppError(
      ERROR_CODES.INVALID_TYPE,
      file.type === "image/heic"
        ? "HEIC is not supported yet. Please upload JPG, PNG, or WEBP."
        : undefined,
    );
  }
}

export function validateClientFile(file: File): string | null {
  try {
    validateUploadFile(file);
    return null;
  } catch (error) {
    return error instanceof AppError ? error.message : "This file cannot be used.";
  }
}

