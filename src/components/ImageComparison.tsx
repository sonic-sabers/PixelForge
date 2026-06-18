"use client";

import { RotateCcw } from "lucide-react";
import { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ResultActions } from "@/components/ResultActions";
import type { ProcessResult } from "@/types";

interface ImageComparisonProps {
  originalPreview: string | null;
  result: ProcessResult;
  onDelete: () => void;
  onReset: () => void;
}

/**
 * Displays original vs processed image side-by-side
 * with memoized file size calculation to prevent recalculation
 */
export const ImageComparison = memo(function ImageComparison({
  originalPreview,
  result,
  onDelete,
  onReset,
}: ImageComparisonProps) {
  const fileSizeKB = useMemo(
    () => (result.size / 1024).toFixed(0),
    [result.size],
  );

  const resultActionsProps = useMemo(
    () => ({
      result,
      onDelete,
    }),
    [result, onDelete],
  );

  return (
    <section className="min-h-[520px] rounded-[1.75rem] border border-slate-200/60 bg-white/90 p-5 text-card-foreground shadow-[0_32px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:h-[520px]">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-sm font-medium text-emerald-700">Ready</p>
          <h2 className="mt-1 text-2xl font-semibold leading-tight text-foreground">
            Cutout flipped and saved
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {result.width} x {result.height} PNG, {fileSizeKB} KB
          </p>
        </div>
        <Button type="button" variant="ghost" onClick={onReset}>
          <RotateCcw />
          Process another
        </Button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <figure className="overflow-hidden rounded-[1.1rem] border border-slate-200 bg-white">
          <figcaption className="px-4 pt-3 text-xs font-medium text-muted-foreground">
            Original
          </figcaption>
          {originalPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={originalPreview}
              alt=""
              className="h-64 w-full object-contain p-4 transition duration-300 hover:scale-[1.02]"
            />
          ) : (
            <div className="grid h-64 place-items-center text-sm text-muted-foreground">
              Original preview unavailable
            </div>
          )}
        </figure>
        <figure className="overflow-hidden rounded-[1.1rem] border border-slate-200 bg-[linear-gradient(45deg,rgba(15,23,42,.045)_25%,transparent_25%,transparent_75%,rgba(15,23,42,.045)_75%),linear-gradient(45deg,rgba(15,23,42,.045)_25%,transparent_25%,transparent_75%,rgba(15,23,42,.045)_75%)] bg-[length:22px_22px] bg-[position:0_0,11px_11px]">
          <figcaption className="px-4 pt-3 text-xs font-medium text-muted-foreground">
            Processed
          </figcaption>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result.processedUrl}
            alt="Processed PixelForge result"
            className="h-64 w-full object-contain p-4 transition duration-300 hover:scale-[1.02]"
          />
        </figure>
      </div>

      <div className="mt-auto pt-5">
        <ResultActions {...resultActionsProps} />
      </div>
    </section>
  );
});

export default ImageComparison;
