"use client";

import { ImagePlus, Loader2, UploadCloud, X } from "lucide-react";
import { memo, useCallback, type MouseEvent } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { MAX_UPLOAD_SIZE_MB } from "@/lib/constants";
import { validateClientFile } from "@/lib/schemas";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  disabled?: boolean;
  selectedFile: File | null;
  previewUrl: string | null;
  error: string | null;
  onSelect: (file: File) => void;
  onClear: () => void;
  onSubmit: () => void;
}

export const UploadDropzone = memo(function UploadDropzone({
  disabled,
  selectedFile,
  previewUrl,
  error,
  onSelect,
  onClear,
  onSubmit,
}: UploadDropzoneProps) {
  // Stable callback references to prevent unnecessary re-renders
  const onDrop = useCallback(
    (files: File[]) => {
      const [file] = files;
      if (file) {
        onSelect(file);
      }
    },
    [onSelect],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    disabled,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    validator: useCallback((file: File) => {
      const message = validateClientFile(file);
      return message ? { code: "invalid-image", message } : null;
    }, []),
  });

  const openFileDialog = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      open();
    },
    [open],
  );

  // Memoize derived values
  const fileSizeMB = selectedFile
    ? (selectedFile.size / 1024 / 1024).toFixed(2)
    : null;

  const hasFile = selectedFile && previewUrl;

  return (
    <section
      className="min-h-[520px] rounded-[1.75rem] border border-white/80 bg-white/80 p-2 text-card-foreground shadow-[0_32px_90px_rgba(15,23,42,0.11)] backdrop-blur-xl lg:h-[520px]"
      aria-label="Image upload"
    >
      <div
        {...getRootProps()}
        className={cn(
          "grid min-h-[500px] place-items-center rounded-[1.35rem] border border-dashed border-slate-200/90 bg-[linear-gradient(135deg,rgba(255,255,255,.92),rgba(241,245,249,.62))] p-5 text-center transition duration-300 lg:h-[500px]",
          isDragActive && "border-slate-900 bg-white shadow-inner",
          disabled && "cursor-not-allowed opacity-70",
        )}
      >
        <input {...getInputProps()} aria-label="Choose image file" />

        {hasFile ? (
          <div className="grid w-full gap-5 md:grid-cols-[1fr_0.82fr] md:items-center">
            <div className="overflow-hidden rounded-[1.2rem] border border-white bg-[linear-gradient(45deg,rgba(15,23,42,.045)_25%,transparent_25%,transparent_75%,rgba(15,23,42,.045)_75%),linear-gradient(45deg,rgba(15,23,42,.045)_25%,transparent_25%,transparent_75%,rgba(15,23,42,.045)_75%)] bg-[length:22px_22px] bg-[position:0_0,11px_11px] shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt=""
                className="h-72 w-full object-contain p-5"
              />
            </div>
            <div className="space-y-5 text-left">
              <div>
                <p className="text-sm font-medium text-emerald-700">Ready</p>
                <h2 className="mt-2 break-words text-2xl font-semibold leading-tight text-foreground">
                  {selectedFile.name}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {fileSizeMB} MB
                </p>
              </div>
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" onClick={onSubmit} disabled={disabled}>
                  {disabled ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <UploadCloud />
                  )}
                  Transform image
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={openFileDialog}
                  disabled={disabled}
                >
                  <ImagePlus />
                  Change
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClear}
                  disabled={disabled}
                >
                  <X />
                  Clear
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-sm flex-col items-center">
            <div className="grid size-16 place-items-center rounded-2xl bg-white text-foreground shadow-[0_18px_50px_rgba(15,23,42,0.10)]">
              <UploadCloud className="size-7" />
            </div>
            <h2 className="mt-6 text-3xl font-semibold leading-tight text-foreground">
              {isDragActive ? "Release to forge" : "Drop image"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              PNG, JPG, or WEBP up to {MAX_UPLOAD_SIZE_MB}MB.
            </p>
            <Button
              type="button"
              onClick={openFileDialog}
              disabled={disabled}
              className="mt-6"
            >
              <ImagePlus />
              Choose image
            </Button>
            {error ? (
              <p className="mt-4 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
});

export default UploadDropzone;
