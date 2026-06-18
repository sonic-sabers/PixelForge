import { AppError, ERROR_CODES, errorResponse } from "@/lib/errors";
import { DeleteSchema } from "@/lib/schemas";
import { deleteProcessedImage } from "@/lib/storage";

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = DeleteSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError(ERROR_CODES.INVALID_DELETE_PATH);
    }

    await deleteProcessedImage(parsed.data.pathname);

    return Response.json({
      success: true,
      message: "Image deleted successfully.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}

