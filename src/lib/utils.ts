import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Copies text to clipboard.
 * Tries the modern Clipboard API first; falls back to the legacy
 * execCommand approach for browsers/contexts where the Clipboard API
 * is unavailable or the document isn't focused.
 */
export async function copyToClipboard(text: string): Promise<void> {
  // Modern async clipboard API (requires HTTPS + document focus)
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to execCommand fallback
    }
  }

  // Legacy fallback: works even when document focus is lost
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const success = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!success) {
    throw new Error("execCommand copy failed");
  }
}
