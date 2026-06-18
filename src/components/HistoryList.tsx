"use client";

import { Check, Copy, Trash2, ChevronRight } from "lucide-react";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MAX_HISTORY_ITEMS } from "@/lib/constants";
import { copyToClipboard } from "@/lib/utils";
import type { HistoryItem } from "@/types";

interface HistoryListProps {
  items: HistoryItem[];
  onOpen: (item: HistoryItem) => void;
  onDelete: (item: HistoryItem) => void;
  maxVisible?: number;
}

interface HistoryCardProps {
  item: HistoryItem;
  onOpen: (item: HistoryItem) => void;
  onDelete: (item: HistoryItem) => void;
  isCopied: boolean;
  onCopy: (url: string, id: string) => void;
}

/**
 * Individual history card - split into separate memoized component
 * to prevent re-renders of entire list when single item state changes
 */
const HistoryCard = memo(function HistoryCard({
  item,
  onOpen,
  onDelete,
  isCopied,
  onCopy,
}: HistoryCardProps) {
  // Stable callbacks prevent child re-renders when parent updates
  const handleOpen = useCallback(() => onOpen(item), [onOpen, item]);
  const handleDelete = useCallback(() => onDelete(item), [onDelete, item]);
  const handleCopy = useCallback(
    () => onCopy(item.processedUrl, item.id),
    [onCopy, item.processedUrl, item.id],
  );

  return (
    <article className="rounded-lg border border-border bg-card p-3 text-card-foreground shadow-sm">
      <button
        type="button"
        onClick={handleOpen}
        className="block w-full overflow-hidden rounded-md border border-border bg-background text-left"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.processedUrl}
          alt=""
          className="h-28 w-full object-contain"
          loading="lazy"
        />
      </button>
      <p className="mt-3 truncate text-sm font-medium text-foreground">
        {item.originalName}
      </p>
      <p className="text-xs text-muted-foreground">
        {new Date(item.createdAt).toLocaleDateString()}
      </p>
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          size="icon-sm"
          variant={isCopied ? "default" : "outline"}
          aria-label={isCopied ? "Copied!" : "Copy processed URL"}
          onClick={handleCopy}
        >
          {isCopied ? (
            <Check className="size-4" />
          ) : (
            <Copy className="size-4" />
          )}
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="destructive"
          aria-label="Delete history item"
          onClick={handleDelete}
        >
          <Trash2 />
        </Button>
      </div>
    </article>
  );
});

/**
 * History list with performance optimizations:
 * - Uses refs for ephemeral UI state (copied indicator, expanded view)
 *   to avoid re-rendering entire list during transient states
 * - forceRender pattern: only triggers render when UI must update
 * - History cards memoized to prevent unnecessary re-renders
 */
export const HistoryList = memo(function HistoryList({
  items,
  onOpen,
  onDelete,
  maxVisible = 5,
}: HistoryListProps) {
  // Refs used for transient UI state that shouldn't trigger re-renders
  // during animations (copy feedback, view toggle)
  const showAllRef = useRef(false);
  const copiedIdRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Minimal state - only used to trigger render when refs change
  const [, forceRender] = useState({});

  const hasMore = items.length > maxVisible;

  // Memoize visible items to prevent recalculation on every render
  const visibleItems = useMemo(
    () => (showAllRef.current ? items : items.slice(0, maxVisible)),
    [items, maxVisible],
  );

  const handleShowAll = useCallback(() => {
    showAllRef.current = true;
    forceRender({});
  }, []);

  const handleShowLess = useCallback(() => {
    showAllRef.current = false;
    forceRender({});
  }, []);

  /**
   * Copy handler with visual feedback management:
   * - Uses ref for copied state (not React state) to avoid list re-render
   * - forceRender triggers single re-render when feedback starts/ends
   * - Cleanup: clears previous timeout to prevent state collision
   */
  const handleCopy = useCallback(async (url: string, id: string) => {
    try {
      await copyToClipboard(url);
      copiedIdRef.current = id;
      forceRender({});
      toast.success("Copied to clipboard!");

      // Clear existing timeout to prevent overlap on rapid clicks
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (copiedIdRef.current === id) {
          copiedIdRef.current = null;
          forceRender({});
        }
      }, 1600);
    } catch {
      toast.error("Failed to copy. Please try again.");
    }
  }, []);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            Recent transformations
          </p>
          <h2 className="text-xl font-semibold text-foreground">
            Recent results
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {items.length >= MAX_HISTORY_ITEMS && (
            <span
              className="text-xs text-amber-600 dark:text-amber-400"
              title="Maximum history limit reached"
            >
              Limit reached
            </span>
          )}
          <p className="text-xs text-muted-foreground">
            {items.length} / {MAX_HISTORY_ITEMS}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {visibleItems.map((item) => (
          <HistoryCard
            key={item.id}
            item={item}
            onOpen={onOpen}
            onDelete={onDelete}
            isCopied={copiedIdRef.current === item.id}
            onCopy={handleCopy}
          />
        ))}
      </div>

      {hasMore && !showAllRef.current && (
        <div className="mt-4 flex justify-center">
          <Button
            type="button"
            variant="ghost"
            onClick={handleShowAll}
            className="gap-1"
          >
            View all {items.length} images
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {showAllRef.current && hasMore && (
        <div className="mt-4 flex justify-center">
          <Button
            type="button"
            variant="ghost"
            onClick={handleShowLess}
            className="gap-1"
          >
            Show less
          </Button>
        </div>
      )}
    </section>
  );
});

export { HistoryList as default };
