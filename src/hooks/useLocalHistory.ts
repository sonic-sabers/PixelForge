"use client";

import { useCallback, useSyncExternalStore } from "react";
import { HISTORY_STORAGE_KEY, MAX_HISTORY_ITEMS } from "@/lib/constants";
import type { HistoryItem } from "@/types";

const EMPTY_HISTORY: HistoryItem[] = [];
const HISTORY_CHANGE_EVENT = "pixelforge-history-change";

// Cache for the last parsed history to maintain stable reference
let cachedHistory: HistoryItem[] | null = null;
let cachedRaw: string | null = null;

export function useLocalHistory() {
  const history = useSyncExternalStore(
    subscribeToHistory,
    readHistory,
    getServerHistory,
  );

  const persist = useCallback((items: HistoryItem[]) => {
    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new Event(HISTORY_CHANGE_EVENT));
    } catch {
      // localStorage can be unavailable in private browsing; the app still works.
    }
  }, []);

  const addHistoryItem = useCallback(
    (item: HistoryItem) => {
      persist(
        [item, ...history.filter((entry) => entry.id !== item.id)].slice(
          0,
          MAX_HISTORY_ITEMS,
        ),
      );
    },
    [history, persist],
  );

  const removeHistoryItem = useCallback(
    (id: string) => {
      persist(history.filter((entry) => entry.id !== id));
    },
    [history, persist],
  );

  return {
    history,
    addHistoryItem,
    removeHistoryItem,
  };
}

function subscribeToHistory(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(HISTORY_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(HISTORY_CHANGE_EVENT, onStoreChange);
  };
}

function getServerHistory() {
  return EMPTY_HISTORY;
}

function readHistory(): HistoryItem[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) {
      cachedHistory = null;
      cachedRaw = null;
      return EMPTY_HISTORY;
    }
    // Return cached result if localStorage hasn't changed
    if (raw === cachedRaw && cachedHistory) {
      return cachedHistory;
    }
    // Parse and cache new value
    cachedRaw = raw;
    cachedHistory = JSON.parse(raw) as HistoryItem[];
    return cachedHistory;
  } catch {
    cachedHistory = null;
    cachedRaw = null;
    return EMPTY_HISTORY;
  }
}
