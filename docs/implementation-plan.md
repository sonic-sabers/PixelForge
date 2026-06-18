# PixelForge: Complete End-to-End Implementation Plan

## 1. Product Overview

PixelForge is a premium image transformation app.

The user uploads an image, PixelForge removes the background, horizontally flips the subject, stores the processed image, and gives the user a hosted URL with options to copy, download, or delete the result.

The goal is not just to build a working image tool. The goal is to make the submission feel polished, reliable, and memorable through strong engineering, beautiful UI, smooth animations, and complete edge-case handling.

## 2. Core User Journey

### Main Flow

1. User lands on the PixelForge homepage.
2. User sees a clean upload card with supported formats and file size limits.
3. User drags and drops or selects an image.
4. Client validates file type and size immediately.
5. Image preview appears.
6. User confirms upload or upload starts automatically.
7. Frontend sends image to backend.
8. Backend validates the file again.
9. Backend removes background using Clipdrop.
10. Backend horizontally flips the processed image using Jimp.
11. Backend uploads final PNG to Vercel Blob.
12. Backend returns processed URL and metadata.
13. Frontend shows premium multi-stage processing animation.
14. Result screen appears with original and processed image comparison.
15. User can copy URL, download image, delete image, or process another image.
16. Last processed images are stored in local history.

## 3. Key Differentiators

PixelForge should stand out because of these points:

1. Premium Siri-style processing animation.
2. Provider-backed background removal through Clipdrop.
3. Pure JavaScript image processing with Jimp to avoid deployment issues.
4. Clean Next.js full-stack architecture.
5. Robust validation on both client and server.
6. Friendly error messages for every failure case.
7. Mobile-first responsive design.
8. Local history of recent transformations.
9. Delete support with optimistic UI.
10. Clear README, architecture notes, and deployment instructions.

## 4. Tech Stack

### Frontend

Next.js 15 App Router
TypeScript
Tailwind CSS
Shadcn UI
Framer Motion
Lucide React
React Dropzone
Canvas Confetti

### Backend

Next.js API Routes
Zod validation
Jimp for image flip
Clipdrop API for background removal
Vercel Blob for storage

### Deployment

Vercel
Vercel Blob
Environment variables for provider credentials and upload limits

## 5. High-Level Architecture

PixelForge uses a full-stack Next.js architecture.

The frontend and backend live in the same repository. The frontend handles upload, preview, animation, and result display. The backend handles validation, background removal, image flipping, storage, and deletion.

### Architecture Flow

User
→ UploadDropzone
→ Client validation
→ POST `/api/process`
→ Server validation
→ Background removal
→ Horizontal flip
→ Upload to Vercel Blob
→ Return processed URL
→ Processing animation
→ Result screen
→ Copy, download, delete, or retry

### Delete Flow

User clicks delete
→ Confirmation modal
→ Optimistic removal from UI
→ DELETE `/api/delete`
→ Validate pathname
→ Delete from Vercel Blob
→ Toast success or rollback on failure

## 6. Project Structure

```txt
pixel-forge/
├── app/
│   ├── api/
│   │   ├── process/
│   │   │   └── route.ts
│   │   └── delete/
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── ui/
│   ├── UploadDropzone.tsx
│   ├── ProcessingView.tsx
│   ├── ImageComparison.tsx
│   ├── HistoryList.tsx
│   ├── DeleteConfirmDialog.tsx
│   ├── ErrorState.tsx
│   ├── ResultActions.tsx
│   └── ThemeToggle.tsx
│
├── lib/
│   ├── imageProcessor.ts
│   ├── storage.ts
│   ├── schemas.ts
│   ├── errors.ts
│   ├── constants.ts
│   └── utils.ts
│
├── hooks/
│   ├── useImageProcessor.ts
│   ├── useLocalHistory.ts
│   └── useReducedMotionSafe.ts
│
├── types/
│   └── index.ts
│
├── .env.local
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── package.json
├── README.md
└── tsconfig.json
```

## 7. Environment Variables

```env
CLIPDROP_API_KEY=
BLOB_READ_WRITE_TOKEN=
MAX_UPLOAD_SIZE_MB=10
```

### Environment Meaning

`CLIPDROP_API_KEY` is used only on the server.

`BLOB_READ_WRITE_TOKEN` allows upload and delete from Vercel Blob.

`MAX_UPLOAD_SIZE_MB` keeps file limits configurable.

## 8. Data Models and Types

### Processing Stages

```ts
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
```

### Process Result

```ts
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
```

### History Item

```ts
export interface HistoryItem extends ProcessResult {
  originalPreview?: string;
}
```

### API Error Shape

```ts
export interface ApiErrorResponse {
  error: string;
  code: string;
  message: string;
}
```

### API Success Shape

```ts
export interface ProcessSuccessResponse {
  id: string;
  processedUrl: string;
  pathname: string;
  originalName: string;
  size: number;
  createdAt: string;
}
```

## 9. Validation Schemas

### File Validation Rules

Allowed formats:

```txt
image/jpeg
image/png
image/webp
```

Maximum file size:

```txt
10MB
```

Minimum usable file:

```txt
More than 0 bytes
```

Optional dimension guard:

```txt
Warn or reject images above 4000px width or height
```

### Upload Schema

```ts
import { z } from "zod";

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const UploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, {
      message: "This file appears to be empty.",
    })
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: "File must be smaller than 10MB.",
    })
    .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), {
      message: "Only JPG, PNG, and WEBP images are supported.",
    }),
});
```

### Delete Schema

```ts
export const DeleteSchema = z.object({
  pathname: z
    .string()
    .min(1)
    .refine((value) => value.startsWith("processed/"), {
      message: "Invalid image path.",
    }),
});
```

## 10. Backend Implementation Plan

## 10.1 `/api/process` Route

### Responsibility

The process API receives an uploaded image, validates it, removes the background, flips the final image, uploads it to Vercel Blob, and returns a public URL.

### Steps

1. Accept `POST` request.
2. Read `formData`.
3. Extract file.
4. Validate file exists.
5. Validate file type.
6. Validate file size.
7. Convert file to buffer.
8. Pass buffer to image processor.
9. Remove background using Clipdrop.
10. Detect whether result is valid.
11. Flip image horizontally using Jimp.
12. Convert output to PNG.
13. Generate UUID.
14. Upload to Vercel Blob under `processed/{uuid}.png`.
15. Return JSON result.

### Response Example

```json
{
  "id": "7cce1b6c-4b8f-432e-8c6c-19de9cb58aaa",
  "processedUrl": "https://blob.vercel-storage.com/processed/7cce1b6c.png",
  "pathname": "processed/7cce1b6c.png",
  "originalName": "portrait.png",
  "size": 842123,
  "createdAt": "2026-06-18T10:00:00.000Z"
}
```

## 10.2 `/api/delete` Route

### Responsibility

Deletes a processed image from Vercel Blob.

### Steps

1. Accept `DELETE` request.
2. Parse JSON body.
3. Validate `pathname`.
4. Ensure pathname starts with `processed/`.
5. Call Vercel Blob `del`.
6. Return success message.
7. If already deleted, return a friendly success-like response.

### Response Example

```json
{
  "success": true,
  "message": "Image deleted successfully."
}
```

## 11. Image Processing Service

## 11.1 `lib/imageProcessor.ts`

### Responsibility

This file owns the actual transformation pipeline.

### Main Function

```ts
processImage(inputBuffer: Buffer, originalName: string): Promise<ProcessedBuffer>
```

### Pipeline

1. Read input buffer.
2. Call Clipdrop.
3. Validate returned image buffer.
4. Load returned image into Jimp.
5. Flip image horizontally.
6. Export as PNG buffer.
7. Return final buffer and metadata.

## 11.2 Clipdrop Processing

### Flow

1. Create `FormData`.
2. Add uploaded file buffer.
3. Send request to Clipdrop remove-background endpoint.
4. Include API key from server env.
5. Receive output image buffer.
6. Normalize to PNG.
7. Pass through Jimp flip.

### Clipdrop Error Handling

Map errors into friendly messages.

Examples:

401
Message: “Background removal service is not configured correctly.”

402 or quota error
Message: “Background removal quota is exhausted. Please try again later.”

429
Message: “Too many requests. Please wait a moment and try again.”

400
Message: “This image could not be processed. Try a clearer image with one main subject.”

500
Message: “Background removal service is temporarily unavailable.”

Timeout
Message: “Processing took too long. Please try a smaller or clearer image.”

## 12. Storage Service

## 12.1 `lib/storage.ts`

### Functions

```ts
uploadProcessedImage(buffer: Buffer, pathname: string): Promise<BlobUploadResult>
deleteProcessedImage(pathname: string): Promise<void>
```

### Upload Rules

Store all processed images under:

```txt
processed/{uuid}.png
```

### Why This Matters

It makes delete validation safer because the backend can reject any pathname that does not start with `processed/`.

## 13. Error Handling System

Create `lib/errors.ts`.

### Error Codes

```ts
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
```

### User-Friendly Error Examples

Invalid file type:

```txt
Only JPG, PNG, and WEBP images are supported.
```

File too large:

```txt
This image is too large. Please upload an image under 10MB.
```

No subject:

```txt
No clear subject was detected. Try a photo with one main object.
```

Quota exhausted:

```txt
Background removal quota is exhausted. Please try again later.
```

Corrupt image:

```txt
This image appears to be corrupted. Please try another file.
```

Delete failure:

```txt
Could not delete the image right now. Please try again.
```

## 14. Frontend Implementation Plan

## 14.1 Page State

Use a state machine-like setup.

```ts
const [stage, setStage] = useState<ProcessingStage>("idle");
const [progress, setProgress] = useState(0);
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [previewUrl, setPreviewUrl] = useState<string | null>(null);
const [result, setResult] = useState<ProcessResult | null>(null);
const [error, setError] = useState<string | null>(null);
```

## 14.2 Main Page Layout

Sections:

1. Header
2. Hero copy
3. Upload card
4. Processing view
5. Result comparison
6. Recent history
7. Footer

### Header

Brand:

```txt
PixelForge
```

Tagline:

```txt
Remove background. Flip beautifully. Share instantly.
```

## 14.3 UploadDropzone

### Responsibilities

1. Drag and drop image.
2. Click to select image.
3. Show accepted file types.
4. Validate file immediately.
5. Show preview.
6. Show inline errors.
7. Disable during processing.
8. Support keyboard selection.

### UI States

Idle:

```txt
Drop your image here
PNG, JPG, WEBP up to 10MB
```

Drag active:

```txt
Release to transform
```

Invalid file:

```txt
Only JPG, PNG, and WEBP are supported.
```

Selected:

```txt
Ready to transform
```

Processing:

```txt
Processing your image...
```

## 14.4 ProcessingView

This is the most important UI component.

The animation should make the app feel premium.

### Stages

#### Stage 1: Uploading

Progress:

```txt
0% to 15%
```

Visual:

1. Upload pulse.
2. Thin glowing border around preview.
3. Small floating dots.

Text:

```txt
Uploading your image...
```

#### Stage 2: Analyzing

Progress:

```txt
15% to 35%
```

Visual:

1. Scanning line moves top to bottom.
2. Image gets subtle blur and glow.
3. Particles appear around major edges.

Text:

```txt
Detecting the main subject...
```

#### Stage 3: Removing Background

Progress:

```txt
35% to 70%
```

Visual:

1. Background dissolves.
2. Checkerboard transparency grid fades in.
3. Particles move outward from the subject.
4. Soft glow behind the subject.

Text:

```txt
Isolating the subject...
```

#### Stage 4: Flipping

Progress:

```txt
70% to 90%
```

Visual:

1. Image card rotates on Y axis.
2. Slight 3D perspective.
3. The processed image appears after rotation.
4. Motion should feel smooth, not gimmicky.

Text:

```txt
Applying horizontal flip...
```

#### Stage 5: Finalizing

Progress:

```txt
90% to 100%
```

Visual:

1. Sparkle burst.
2. Success glow.
3. Progress bar completes.
4. Result card fades in.

Text:

```txt
Finalizing your cutout...
```

## 14.5 Animation Principles

Use Framer Motion for:

1. Enter and exit transitions.
2. Card scale.
3. Image flip.
4. Scanning line.
5. Button micro-interactions.
6. Result reveal.

Use CSS for:

1. Background gradients.
2. Animated border.
3. Checkerboard transparency grid.
4. Soft blur.
5. Glow effects.

Use canvas or lightweight `motion.div` particles for:

1. Edge particles.
2. Sparkles.
3. Small floating lights.

## 14.6 Reduced Motion Support

If the user has reduced motion enabled:

1. Disable particles.
2. Disable 3D flip.
3. Use fade transitions.
4. Keep progress and status text.
5. Avoid infinite animations.

## 14.7 ImageComparison

### Responsibilities

1. Show original preview.
2. Show processed image.
3. Side-by-side on desktop.
4. Vertical stack on mobile.
5. Allow hover zoom.
6. Allow copy URL.
7. Allow download.
8. Allow delete.

### Actions

Copy URL:

1. Copy processed URL to clipboard.
2. Show toast.
3. Button changes to checkmark briefly.

Download:

1. Use anchor download.
2. Filename: `pixelforge-{originalName}.png`.

Delete:

1. Open confirmation modal.
2. Optimistically remove result.
3. Call delete API.
4. Rollback if delete fails.

## 14.8 HistoryList

### Responsibilities

1. Store last 5 processed results in localStorage.
2. Show small thumbnails.
3. Allow opening result.
4. Allow copying URL.
5. Allow deleting history item.
6. Remove stale item if delete succeeds.

### LocalStorage Key

```txt
pixelforge-history
```

### History Rules

1. Keep max 5 items.
2. Most recent first.
3. Avoid duplicates by `id`.
4. If localStorage is unavailable, app still works.

## 15. Full Edge Case Handling

## 15.1 Upload Edge Cases

### Wrong File Type

Example:

PDF, GIF, SVG, HEIC, AVIF, TXT.

Handling:

Client blocks immediately. Server also rejects.

Message:

```txt
Only JPG, PNG, and WEBP images are supported.
```

### File Too Large

Handling:

Client blocks before upload. Server rejects if bypassed.

Message:

```txt
This image is too large. Please upload an image under 10MB.
```

### Empty File

Handling:

Server checks size is greater than zero.

Message:

```txt
This file appears to be empty.
```

### Corrupt Image

Handling:

Jimp fails to decode or Clipdrop fails.

Message:

```txt
This image appears to be corrupted. Please try another file.
```

### HEIC from iPhone

Handling:

Reject unless conversion support is added.

Message:

```txt
HEIC is not supported yet. Please upload JPG, PNG, or WEBP.
```

### Animated GIF

Handling:

Reject because scope is static image transformation.

Message:

```txt
Animated images are not supported. Please upload a static JPG, PNG, or WEBP.
```

### Extremely Large Dimensions

Example:

8000x8000 image under 10MB.

Handling:

Option A: warn and continue.
Option B: resize before processing.
Recommended: resize to max 4000px on longest side.

Message:

```txt
Large image detected. We will optimize it before processing.
```

## 15.2 Processing Edge Cases

### No Clear Subject

Handling:

Check if output is mostly transparent or Clipdrop returns error.

Message:

```txt
No clear subject was detected. Try a photo with one main object.
```

### Fully Transparent Output

Handling:

Analyze alpha channel. If too many pixels are transparent, fail gracefully.

Message:

```txt
The result looks empty. Try a clearer image with a visible subject.
```

### Clipdrop API Key Missing

Handling:

Fail with a configuration message.

Message:

```txt
Background removal is not configured. Please add the Clipdrop API key.
```

### Clipdrop Quota Exhausted

Handling:

Show clear message.

Message:

```txt
Background removal quota is exhausted. Please try again later.
```

### Clipdrop Timeout

Handling:

Abort request after timeout.

Message:

```txt
Processing took too long. Please try a smaller image.
```

### Clipdrop Unexpected Response

Handling:

Check content type and buffer size.

Message:

```txt
The background removal service returned an unexpected response.
```

### Jimp Flip Failure

Handling:

Catch error.

Message:

```txt
Could not apply the flip. Please try again with another image.
```

### Blob Upload Failure

Handling:

Do not show success. Return storage error.

Message:

```txt
Image was processed but could not be saved. Please try again.
```

## 15.3 Network Edge Cases

### User Goes Offline During Upload

Handling:

Abort request and show retry.

Message:

```txt
You seem to be offline. Check your connection and try again.
```

### Slow Network

Handling:

Keep progress animation alive with realistic status messages.

Message:

```txt
Still working. Large images can take a few extra seconds.
```

### Request Cancelled

Handling:

Use `AbortController`.

Message:

```txt
Processing cancelled.
```

### Duplicate Submissions

Handling:

Disable upload button during processing.

Message:

No extra message needed.

## 15.4 UI Edge Cases

### Multiple Rapid Uploads

Handling:

Disable upload during processing or ask user to cancel current one.

### Page Refresh During Processing

Handling:

Processing request may be lost. Keep history for completed items only.

Message after refresh is not required.

### Mobile Screens

Handling:

1. Stack comparison vertically.
2. Reduce animation particles.
3. Make buttons full width.
4. Keep upload area touch-friendly.

### Small Screens

Handling:

Avoid large fixed widths. Use responsive cards.

### Reduced Motion

Handling:

Respect `prefers-reduced-motion`.

### Clipboard Not Available

Handling:

Fallback by selecting URL text.

Message:

```txt
Copy failed. You can manually copy the URL.
```

### Image Preview Fails

Handling:

Show file icon and filename instead of broken preview.

## 15.5 Delete Edge Cases

### Delete Already Deleted File

Handling:

Treat as success.

Message:

```txt
This image was already deleted.
```

### Invalid Delete Path

Handling:

Reject server-side.

Message:

```txt
Invalid image path.
```

### Delete Fails

Handling:

Rollback optimistic UI.

Message:

```txt
Could not delete the image. Please try again.
```

### Delete While Processing

Handling:

Disable delete until processing is complete.

## 15.6 Security Edge Cases

### Client Tries to Delete Arbitrary Blob

Handling:

Only allow pathnames starting with `processed/`.

### User Uploads File With Dangerous Name

Handling:

Ignore original filename for storage. Use UUID.

### API Key Exposure

Handling:

Never expose Clipdrop key to frontend.

### Large Payload Abuse

Handling:

Set size limit and reject early.

### MIME Spoofing

Handling:

Check MIME type and attempt image decode server-side.

## 16. UI Design Details

## 16.1 Visual Style

PixelForge should feel like a premium AI utility.

### Theme

Dark-first with light mode support.

### Colors

Background:

```txt
zinc-950
```

Card:

```txt
zinc-900 / zinc-50
```

Primary:

```txt
indigo / violet
```

Success:

```txt
emerald
```

Error:

```txt
rose
```

### Typography

Use Inter through `next/font`.

### Card Style

1. Rounded corners.
2. Soft border.
3. Subtle glass effect.
4. Gentle glow on active state.
5. No clutter.

## 16.2 Homepage Layout

Desktop:

```txt
Header
Hero title
Hero subtitle
Upload card
Processing or result section
History
Footer
```

Mobile:

```txt
Header
Hero
Upload card
Result stacked vertically
History
```

## 16.3 Copywriting

Hero title:

```txt
Cut. Flip. Share.
```

Subtitle:

```txt
Remove backgrounds and create flipped transparent PNGs in seconds.
```

Upload helper:

```txt
PNG, JPG, or WEBP up to 10MB.
```

Processing messages:

```txt
Uploading your image...
Detecting the main subject...
Isolating the subject...
Applying horizontal flip...
Finalizing your cutout...
```

Success message:

```txt
Your PixelForge is ready.
```

Error CTA:

```txt
Try another image
```

## 17. API Contracts

## 17.1 POST `/api/process`

### Request

`multipart/form-data`

Field:

```txt
file
```

### Success Response

```json
{
  "id": "uuid",
  "processedUrl": "https://...",
  "pathname": "processed/uuid.png",
  "originalName": "image.png",
  "size": 123456,
  "createdAt": "2026-06-18T10:00:00.000Z"
}
```

### Error Response

```json
{
  "error": "FILE_TOO_LARGE",
  "code": "FILE_TOO_LARGE",
  "message": "This image is too large. Please upload an image under 10MB."
}
```

## 17.2 DELETE `/api/delete`

### Request

```json
{
  "pathname": "processed/uuid.png"
}
```

### Success Response

```json
{
  "success": true,
  "message": "Image deleted successfully."
}
```

### Error Response

```json
{
  "error": "INVALID_DELETE_PATH",
  "code": "INVALID_DELETE_PATH",
  "message": "Invalid image path."
}
```

## 18. Implementation Phases

## Phase 1: Foundation

Estimated time:

```txt
2 hours
```

Tasks:

1. Create Next.js app.
2. Install dependencies.
3. Configure Tailwind.
4. Initialize Shadcn.
5. Add base layout.
6. Add theme support.
7. Create folder structure.
8. Add environment files.

Commands:

```bash
npx create-next-app@latest pixel-forge --typescript --tailwind --eslint --app --yes
cd pixel-forge

npm install framer-motion jimp @vercel/blob react-dropzone uuid zod canvas-confetti lucide-react
npm install -D @types/uuid

npx shadcn-ui@latest init
npx shadcn-ui@latest add button card progress toast skeleton separator badge dialog
```

## Phase 2: Backend Core

Estimated time:

```txt
4 to 5 hours
```

Tasks:

1. Create schemas.
2. Create error mapping.
3. Create image processor.
4. Add Clipdrop background removal.
5. Add Jimp horizontal flip.
6. Add Vercel Blob upload helper.
7. Add delete helper.
8. Build `/api/process`.
9. Build `/api/delete`.
10. Test Clipdrop processing.
11. Test Blob delivery.

## Phase 3: Frontend Core

Estimated time:

```txt
4 hours
```

Tasks:

1. Build upload page.
2. Build UploadDropzone.
3. Add file validation.
4. Add preview.
5. Add processing state machine.
6. Connect to process API.
7. Handle API success.
8. Handle API errors.

## Phase 4: Premium Animations

Estimated time:

```txt
3 to 4 hours
```

Tasks:

1. Build ProcessingView.
2. Add scanning animation.
3. Add particle animation.
4. Add background dissolve animation.
5. Add 3D flip.
6. Add final sparkle animation.
7. Add progress bar.
8. Add stage text.
9. Add reduced-motion fallback.
10. Optimize mobile animations.

## Phase 5: Result and History

Estimated time:

```txt
2 to 3 hours
```

Tasks:

1. Build ImageComparison.
2. Add copy URL.
3. Add download.
4. Add delete confirmation.
5. Add optimistic delete.
6. Build HistoryList.
7. Add localStorage persistence.
8. Add stale item cleanup.

## Phase 6: Polish and Edge Cases

Estimated time:

```txt
3 hours
```

Tasks:

1. Improve empty states.
2. Improve error states.
3. Add retry.
4. Add cancel.
5. Add keyboard accessibility.
6. Add mobile polish.
7. Add loading skeletons.
8. Add toast notifications.
9. Add final copywriting.
10. Test all edge cases.

## Phase 7: Testing and Deployment

Estimated time:

```txt
2 hours
```

Tasks:

1. Manual test all supported formats.
2. Test large files.
3. Test corrupt files.
4. Test Clipdrop processing.
5. Test delete.
6. Test mobile.
7. Test dark and light mode.
8. Deploy on Vercel.
9. Add env vars.
10. Verify deployed URL.
11. Write README.

Total estimated time:

```txt
17 to 23 hours
```

## 19. Testing Plan

## 19.1 Manual Test Cases

### Upload

1. Upload valid JPG.
2. Upload valid PNG.
3. Upload valid WEBP.
4. Upload PDF.
5. Upload GIF.
6. Upload HEIC.
7. Upload file over 10MB.
8. Upload zero-byte file.
9. Upload corrupt image.
10. Upload image with special characters in filename.

### Processing

1. Clipdrop success.
3. Missing API key.
4. Quota exhausted.
5. Timeout.
6. No clear subject.
7. Very small image.
8. Very large dimension image.
9. Transparent PNG input.
10. Image with multiple subjects.

### UI

1. Drag active state.
2. Invalid file message.
3. Processing animation.
4. Reduced motion mode.
5. Mobile layout.
6. Copy URL.
7. Download.
8. Delete.
9. History.
10. Retry after error.

### Delete

1. Delete valid image.
2. Delete already deleted image.
3. Delete invalid pathname.
4. Delete with network failure.
5. Delete from history.

## 19.2 Unit Tests

Recommended tests:

1. `validateFile` rejects invalid MIME.
2. `validateFile` rejects large file.
3. `sanitizeFilename` works.
4. `isValidDeletePath` blocks unsafe path.
5. `mapErrorToMessage` returns friendly message.
6. `flipImage` returns a valid PNG buffer.

## 19.3 Integration Tests

Recommended tests:

1. `/api/process` works with Clipdrop configured.
2. `/api/process` rejects invalid file.
3. `/api/delete` rejects invalid path.
4. `/api/delete` accepts processed path.

## 20. Performance Plan

1. Use client-side preview with `URL.createObjectURL`.
2. Revoke preview URL after use.
3. Disable heavy particles on mobile.
4. Respect reduced motion.
5. Keep image processing server-side.
6. Avoid storing original images in Blob.
7. Store only final PNG.
8. Use Vercel Blob CDN for result delivery.
9. Keep localStorage history small.
10. Use lazy loading for history thumbnails.

## 21. Accessibility Plan

1. Upload area should be keyboard accessible.
2. Add `aria-label` to upload button.
3. Progress should have accessible label.
4. Error messages should be announced.
5. Buttons must have visible focus rings.
6. Confirmation modal should trap focus.
7. Use semantic headings.
8. Support reduced motion.
9. Do not rely only on color for errors.
10. Ensure contrast in dark and light mode.

## 22. Security Plan

1. Never expose Clipdrop API key.
2. Validate file type and size on server.
3. Do not trust client validation.
4. Use UUID for stored files.
5. Do not use original filename as Blob pathname.
6. Validate delete pathname.
7. Only allow deletion from `processed/`.
8. Sanitize metadata.
9. Do not store unnecessary user data.
10. Add comments for future rate limiting.

## 23. Deployment Plan

### Vercel Setup

1. Push repo to GitHub.
2. Import project into Vercel.
3. Add environment variables.
4. Enable Vercel Blob.
5. Deploy.
6. Test deployed upload.
7. Test deployed delete.
8. Test Clipdrop processing and Blob delivery.

### Deployment Env

```env
CLIPDROP_API_KEY=real_key
BLOB_READ_WRITE_TOKEN=vercel_blob_token
MAX_UPLOAD_SIZE_MB=10
```

## 24. README Structure

The README should be strong because reviewers will read it.

### README Sections

1. Project title.
2. Deployed URL.
3. Product screenshots.
4. What PixelForge does.
5. Features.
6. Tech stack.
7. Architecture overview.
8. Processing pipeline.
9. Animation decisions.
10. Edge cases handled.
11. Setup instructions.
12. Environment variables.
13. Provider configuration.
14. Deployment instructions.
15. Testing checklist.
16. Future improvements.

## 25. Future Improvements

These are not required for the take-home, but can be mentioned as future scope.

1. Batch image processing.
2. User accounts.
3. Permanent gallery.
4. Background replacement.
5. AI shadow generation.
6. Image upscaling.
7. Smart crop.
8. Webhook callback after processing.
9. Rate limiting.
10. Usage analytics.
11. Stripe-based credits.
12. HEIC support.
13. AVIF support.
14. Before-after slider.
15. Queue-based processing for large files.

## 26. Final Execution Checklist

### Backend

- [ ] File validation added.
- [ ] Clipdrop integration works.
- [ ] Jimp horizontal flip works.
- [ ] PNG output generated.
- [ ] Blob upload works.
- [ ] Delete API works.
- [ ] Friendly errors added.
- [ ] Pathname validation added.

### Frontend

- [ ] Upload dropzone works.
- [ ] Preview works.
- [ ] Client validation works.
- [ ] Processing stages work.
- [ ] Progress bar works.
- [ ] Premium animations added.
- [ ] Result comparison works.
- [ ] Copy URL works.
- [ ] Download works.
- [ ] Delete works.
- [ ] History works.
- [ ] Mobile responsive.
- [ ] Reduced motion supported.

### Testing

- [ ] JPG tested.
- [ ] PNG tested.
- [ ] WEBP tested.
- [ ] Invalid file tested.
- [ ] Large file tested.
- [ ] Clipdrop processing tested.
- [ ] Delete tested.
- [ ] Mobile tested.
- [ ] Deployed flow tested.

### Docs

- [ ] README completed.
- [ ] Env example added.
- [ ] Architecture explained.
- [ ] Edge cases listed.
- [ ] Screenshots or GIFs added.
- [ ] Deployed URL linked.

## 27. Final Product Standard

PixelForge should feel like a complete premium product, not just a working assignment.

The final app should be:

1. Beautiful.
2. Fast.
3. Reliable.
4. Easy to understand.
5. Ready to ship.
6. Clear in failure states.
7. Smooth on mobile.
8. Well documented.
9. Easy to deploy.
10. Memorable to reviewers.

The main priority is to build a polished, end-to-end experience where the reviewer can instantly see strong product taste, frontend skill, backend reliability, and attention to edge cases.
