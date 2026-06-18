import { del, put } from "@vercel/blob";
import { AppError, ERROR_CODES } from "@/lib/errors";

const usesLocalFallback = process.env.NODE_ENV === "development";

export interface BlobUploadResult {
  url: string;
  pathname: string;
  local: boolean;
}

export async function uploadProcessedImage(buffer: Buffer, pathname: string): Promise<BlobUploadResult> {
  if (usesLocalFallback) {
    return {
      url: `data:image/png;base64,${buffer.toString("base64")}`,
      pathname,
      local: true,
    };
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new AppError(ERROR_CODES.STORAGE_UPLOAD_FAILED, undefined, 500);
  }

  try {
    const result = await put(pathname, buffer, {
      access: "public",
      contentType: "image/png",
    });

    return {
      url: result.url,
      pathname: result.pathname,
      local: false,
    };
  } catch {
    throw new AppError(ERROR_CODES.STORAGE_UPLOAD_FAILED, undefined, 500);
  }
}

export async function deleteProcessedImage(pathname: string): Promise<void> {
  if (usesLocalFallback) {
    return;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new AppError(ERROR_CODES.STORAGE_DELETE_FAILED, undefined, 500);
  }

  try {
    await del(pathname);
  } catch {
    throw new AppError(ERROR_CODES.STORAGE_DELETE_FAILED, undefined, 500);
  }
}
