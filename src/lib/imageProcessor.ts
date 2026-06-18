import { Jimp } from "jimp";
import { AppError, ERROR_CODES, mapClipdropStatus } from "@/lib/errors";

export interface ProcessedBuffer {
  buffer: Buffer;
  width: number;
  height: number;
}

const CLIPDROP_ENDPOINT = "https://clipdrop-api.co/remove-background/v1";
const PNG_MIME = "image/png";
const usesLocalFallback = process.env.NODE_ENV === "development";

export async function processImage(
  inputBuffer: Buffer,
  originalName: string,
  mimeType: string,
): Promise<ProcessedBuffer> {
  const backgroundRemoved = await removeBackground(
    inputBuffer,
    originalName,
    mimeType,
  );

  try {
    const image = await Jimp.read(backgroundRemoved);
    image.flip({ horizontal: true });

    const buffer = await image.getBuffer(PNG_MIME);

    if (buffer.length === 0) {
      throw new AppError(ERROR_CODES.FLIP_FAILED);
    }

    return {
      buffer,
      width: image.bitmap.width,
      height: image.bitmap.height,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(ERROR_CODES.CORRUPT_IMAGE);
  }
}

async function removeBackground(
  inputBuffer: Buffer,
  originalName: string,
  mimeType: string,
): Promise<Buffer> {
  if (usesLocalFallback) {
    return inputBuffer;
  }

  const apiKey = process.env.CLIPDROP_API_KEY;
  if (!apiKey) {
    throw new AppError(ERROR_CODES.BG_SERVICE_FAILED, undefined, 500);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const formData = new FormData();
    const fileBytes = new Uint8Array(inputBuffer);
    formData.append(
      "image_file",
      new Blob([fileBytes], { type: mimeType }),
      originalName,
    );

    const response = await fetch(CLIPDROP_ENDPOINT, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
      },
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw mapClipdropStatus(response.status);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("image/")) {
      throw new AppError(
        ERROR_CODES.BG_SERVICE_FAILED,
        "The background removal service returned an unexpected response.",
        502,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const output = Buffer.from(arrayBuffer);

    if (output.length === 0) {
      throw new AppError(
        ERROR_CODES.NO_SUBJECT,
        "No background could be removed. This might be because the image has a complex background or no clear subject. Try an image with a distinct object against a simple background.",
        422,
      );
    }

    return output;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AppError(ERROR_CODES.BG_SERVICE_TIMEOUT, undefined, 504);
    }

    throw new AppError(ERROR_CODES.BG_SERVICE_FAILED, undefined, 502);
  } finally {
    clearTimeout(timeout);
  }
}
