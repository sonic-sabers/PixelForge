"use client";

import { AlertTriangle } from "lucide-react";
import { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";

interface DeleteConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  itemName?: string;
}

/**
 * Delete confirmation modal with memoized display name
 * Prevents recalculation of display text on every render
 */
export const DeleteConfirmDialog = memo(function DeleteConfirmDialog({
  open,
  onCancel,
  onConfirm,
  itemName,
}: DeleteConfirmDialogProps) {
  const displayName = useMemo(
    () => (itemName ? `"${itemName}"` : "this image"),
    [itemName],
  );

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-title"
    >
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-5 text-card-foreground shadow-lg">
        <div className="flex items-start gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-destructive/10 text-destructive">
            <AlertTriangle />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="delete-title"
              className="text-lg font-semibold text-foreground"
            >
              Delete {displayName}?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The processed URL will stop working after deletion. This action
              cannot be undone.
            </p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
});

export default DeleteConfirmDialog;
