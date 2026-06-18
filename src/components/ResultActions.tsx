"use client";

import { Check, Copy, Download, Loader2, Share2, Trash2 } from "lucide-react";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ProcessResult } from "@/types";

interface ResultActionsProps {
  result: ProcessResult;
  onDelete: () => void;
}

/**
 * Result actions with optimized render performance:
 * - Ephemeral UI states (copied indicator, downloading) use refs
 *   to prevent re-rendering during transient animations
 * - forceRender pattern: only triggers re-render when UI state
 *   actually needs to change, not during async operations
 */
export const ResultActions = memo(function ResultActions({
  result,
  onDelete,
}: ResultActionsProps) {
  // Refs track transient states without causing re-renders
  // during share/copy/download operations
  const copiedRef = useRef(false);
  const downloadingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Minimal state for forced re-renders when needed
  const [, forceRender] = useState({});

  // Memoized: navigator check only runs once per session
  const canShare = useMemo(
    () => typeof navigator !== "undefined" && "share" in navigator,
    [],
  );

  // Memoized: only recalculates when result changes
  const downloadName = useMemo(
    () => `pixelforge-${result.originalName.replace(/\.[^.]+$/, "")}.png`,
    [result.originalName],
  );

  /**
   * Share or copy handler:
   * - Attempts native share on mobile/supported browsers
   * - Falls back to clipboard copy if share fails or is unavailable
   * - User cancellation of share dialog is handled silently (no error)
   */
  const handleShareOrCopy = useCallback(async () => {
    // Try native share first (mobile devices, supported browsers)
    if (canShare) {
      try {
        await navigator.share({
          title: "PixelForge Image",
          text: `Check out this cutout: ${result.originalName}`,
          url: result.processedUrl,
        });
        toast.success("Shared successfully!");
        return;
      } catch (error) {
        // User cancelled the share dialog - don't show error
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        // Share failed (network, HTTPS, etc) - fall through to clipboard
      }
    }

    // Fallback: copy URL to clipboard
    if (!navigator.clipboard) {
      toast.error("Sharing not available on this device");
      return;
    }

    try {
      await navigator.clipboard.writeText(result.processedUrl);
      copiedRef.current = true;
      forceRender({});
      toast.success("Copied to clipboard!");

      // Prevent multiple overlapping timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        copiedRef.current = false;
        forceRender({});
      }, 1600);
    } catch {
      toast.error("Failed to copy. Please try again.");
    }
  }, [canShare, result.originalName, result.processedUrl]);

  /**
   * Download handler:
   * - Uses ref for loading state (avoids re-render during fetch)
   * - forceRender only at start and end of download operation
   * - Falls back to window.open if fetch fails
   */
  const handleDownload = useCallback(async () => {
    if (downloadingRef.current) return;

    downloadingRef.current = true;
    forceRender({});

    try {
      const res = await fetch(result.processedUrl);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      toast.success("Download started!");
    } catch {
      // Fallback: open in new tab if blob fetch fails
      window.open(result.processedUrl, "_blank");
      toast.info("Opening image in new tab...");
    } finally {
      downloadingRef.current = false;
      forceRender({});
    }
  }, [downloadName, result.processedUrl]);

  // Memoize button content to prevent recreation on every render
  const shareButtonContent = useMemo(() => {
    const Icon = copiedRef.current ? Check : canShare ? Share2 : Copy;
    const label = copiedRef.current
      ? "Copied"
      : canShare
        ? "Share"
        : "Copy URL";
    return (
      <>
        <Icon />
        {label}
      </>
    );
  }, [canShare]);

  const downloadButtonContent = useMemo(() => {
    if (downloadingRef.current) {
      return (
        <>
          <Loader2 className="animate-spin" />
          Downloading...
        </>
      );
    }
    return (
      <>
        <Download />
        Download
      </>
    );
  }, []);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
      <Button type="button" variant="destructive" onClick={onDelete}>
        <Trash2 />
        Delete
      </Button>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" onClick={handleShareOrCopy}>
          {shareButtonContent}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleDownload}
          disabled={downloadingRef.current}
        >
          {downloadButtonContent}
        </Button>
      </div>
    </div>
  );
});

export default ResultActions;
