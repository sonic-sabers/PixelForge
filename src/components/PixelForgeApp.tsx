"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { HistoryList } from "@/components/HistoryList";
import { ImageComparison } from "@/components/ImageComparison";
import { ProcessingView } from "@/components/ProcessingView";
import { UploadDropzone } from "@/components/UploadDropzone";
import { useImageProcessor } from "@/hooks/useImageProcessor";
import { useLocalHistory } from "@/hooks/useLocalHistory";
import { validateClientFile } from "@/lib/schemas";
import type { HistoryItem, ProcessResult } from "@/types";

type DeleteTarget =
  | { type: "result"; item: ProcessResult }
  | { type: "history"; item: HistoryItem }
  | null;

// Constant array prevents recreating on each render
const PROCESSING_STAGES = [
  "uploading",
  "analyzing",
  "removing-bg",
  "flipping",
  "finalizing",
] as const;

/**
 * Main app container with performance optimizations:
 * - All callbacks memoized with useCallback to provide stable
 *   references for child components (prevents child re-renders)
 * - Props memoized with useMemo to prevent unnecessary updates
 * - Components wrapped in React.memo for shallow prop comparison
 */
export const PixelForgeApp = memo(function PixelForgeApp() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const {
    stage,
    progress,
    result,
    error,
    processFile,
    reset,
    setResult,
    setStage,
  } = useImageProcessor();

  const { history, addHistoryItem, removeHistoryItem } = useLocalHistory();

  // Memoized: prevents recalculating stage check on every render
  const isProcessing = useMemo(
    () =>
      PROCESSING_STAGES.includes(stage as (typeof PROCESSING_STAGES)[number]),
    [stage],
  );

  // Cleanup: revoke object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  /**
   * File selection handler:
   * - Validates file client-side before accepting
   * - Revokes previous preview URL to prevent memory leaks
   * - Creates new object URL for selected file
   */
  const selectFile = useCallback(
    (file: File) => {
      const validationMessage = validateClientFile(file);
      setClientError(validationMessage);

      if (validationMessage) {
        return;
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setStage("selected");
    },
    [previewUrl, setStage],
  );

  /** Clears selection and resets all related state */
  const clearSelection = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl(null);
    setClientError(null);
    reset();
  }, [previewUrl, reset]);

  /**
   * Submits selected file for processing:
   * - Waits for processing to complete
   * - Adds result to history with original preview for context
   */
  const submit = useCallback(async () => {
    if (!selectedFile) {
      setClientError("Please choose an image before starting.");
      return;
    }

    const processed = await processFile(selectedFile);
    if (processed) {
      addHistoryItem({
        ...processed,
        originalPreview: previewUrl ?? undefined,
      });
    }
  }, [selectedFile, processFile, addHistoryItem, previewUrl]);

  /**
   * Delete confirmation handler with optimistic UI:
   * - Removes item from UI immediately (optimistic)
   * - Makes API call to delete from storage
   * - Rolls back UI if delete fails (restores item)
   *
   * Two delete paths:
   * 1. Result view: clears result and removes from history
   * 2. History item: removes from history only
   */
  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }

    const target = deleteTarget;
    setDeleteTarget(null);

    if (target.type === "result") {
      // Optimistic: clear result immediately for responsive UI
      setResult(null);
      removeHistoryItem(target.item.id);

      try {
        const response = await fetch("/api/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pathname: target.item.pathname }),
        });

        if (!response.ok) {
          throw new Error("Delete failed");
        }

        toast.success("Image deleted.");
      } catch {
        // Rollback: restore item and result on failure
        addHistoryItem({
          ...target.item,
          originalPreview: previewUrl ?? undefined,
        });
        setResult(target.item);
        toast.error("Could not delete the image. Please try again.");
      }
    } else {
      // History item deletion
      removeHistoryItem(target.item.id);

      try {
        const response = await fetch("/api/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pathname: target.item.pathname }),
        });

        if (!response.ok) {
          throw new Error("Delete failed");
        }

        toast.success("Image deleted.");
      } catch {
        // Rollback: restore history item on failure
        addHistoryItem(target.item);
        toast.error("Could not delete the image. Please try again.");
      }
    }
  }, [deleteTarget, removeHistoryItem, setResult, addHistoryItem, previewUrl]);

  const requestDeleteHistoryItem = useCallback((item: HistoryItem) => {
    setDeleteTarget({ type: "history", item });
  }, []);

  const handleDeleteResult = useCallback(() => {
    if (result) {
      setDeleteTarget({ type: "result", item: result });
    }
  }, [result]);

  const handleOpenHistoryItem = useCallback(
    (item: HistoryItem) => {
      setResult(item);
      setStage("complete");
    },
    [setResult, setStage],
  );

  const handleCancelDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  // Memoized props: prevents child re-renders when parent updates
  // but these specific values haven't changed
  const dropzoneProps = useMemo(
    () => ({
      disabled: isProcessing,
      selectedFile,
      previewUrl,
      error: error ?? clientError,
      onSelect: selectFile,
      onClear: clearSelection,
      onSubmit: submit,
    }),
    [
      isProcessing,
      selectedFile,
      previewUrl,
      error,
      clientError,
      selectFile,
      clearSelection,
      submit,
    ],
  );

  const processingViewProps = useMemo(
    () => ({
      stage,
      progress,
      previewUrl,
    }),
    [stage, progress, previewUrl],
  );

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[radial-gradient(circle_at_50%_-10%,oklch(0.97_0.005_260),transparent_38%),linear-gradient(180deg,oklch(1_0_0),oklch(0.985_0.001_240))] text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <section className="grid flex-1 gap-6 py-4 lg:grid-cols-[0.72fr_1fr] lg:items-center">
          <div className="max-w-md">
            <p className="text-sm font-semibold tracking-normal text-foreground">
              PixelForge
            </p>
            <h1 className="mt-8 text-5xl font-semibold leading-[0.98] text-foreground sm:text-6xl">
              Clean image cuts, no clutter.
            </h1>
            <p className="mt-5 max-w-sm text-base leading-7 text-muted-foreground">
              Drop an image and watch PixelForge trace the edges, lift the
              subject, and ship a polished transparent PNG.
            </p>
          </div>

          {/* Conditional rendering based on app state */}
          {isProcessing ? (
            <ProcessingView {...processingViewProps} />
          ) : result ? (
            <ImageComparison
              originalPreview={previewUrl}
              result={result}
              onDelete={handleDeleteResult}
              onReset={clearSelection}
            />
          ) : (
            <UploadDropzone {...dropzoneProps} />
          )}
        </section>

        <HistoryList
          items={history}
          onOpen={handleOpenHistoryItem}
          onDelete={requestDeleteHistoryItem}
          maxVisible={5}
        />
      </div>

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onCancel={handleCancelDelete}
        onConfirm={confirmDelete}
        itemName={deleteTarget?.item.originalName}
      />
    </main>
  );
});

export default PixelForgeApp;
