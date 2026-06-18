import { randomUUID } from "crypto";
import { errorResponse } from "@/lib/errors";
import { processImage } from "@/lib/imageProcessor";
import { validateUploadFile } from "@/lib/schemas";
import { uploadProcessedImage } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const formFile = formData.get("file");
    const file = formFile instanceof File ? formFile : null;

    validateUploadFile(file);

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const processed = await processImage(inputBuffer, file.name, file.type);
    const id = randomUUID();
    const pathname = `processed/${id}.png`;
    const stored = await uploadProcessedImage(processed.buffer, pathname);

    return Response.json({
      id,
      processedUrl: stored.url,
      pathname: stored.pathname,
      originalName: file.name,
      size: processed.buffer.length,
      width: processed.width,
      height: processed.height,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
