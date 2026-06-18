"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiErrorResponse, ProcessResult, ProcessingStage } from "@/types";

const STAGE_TIMING: Array<{ stage: ProcessingStage; progress: number; delay: number }> = [
  { stage: "uploading", progress: 12, delay: 120 },
  { stage: "analyzing", progress: 32, delay: 650 },
  { stage: "removing-bg", progress: 62, delay: 1200 },
  { stage: "flipping", progress: 84, delay: 1700 },
  { stage: "finalizing", progress: 96, delay: 2200 },
];

export function useImageProcessor() {
  const [stage, setStage] = useState<ProcessingStage>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    setStage("idle");
    setProgress(0);
    setResult(null);
    setError(null);
  }, []);

  const processFile = useCallback(async (file: File) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setError(null);
    setResult(null);
    setStage("uploading");
    setProgress(8);

    const timers = STAGE_TIMING.map(({ stage: nextStage, progress: nextProgress, delay }) =>
      window.setTimeout(() => {
        setStage(nextStage);
        setProgress(nextProgress);
      }, delay),
    );

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/process", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        const apiError = data as ApiErrorResponse;
        throw new Error(apiError.message ?? "Unable to process this image.");
      }

      timers.forEach(window.clearTimeout);
      setStage("complete");
      setProgress(100);
      setResult(data as ProcessResult);
      return data as ProcessResult;
    } catch (processError) {
      timers.forEach(window.clearTimeout);

      if (processError instanceof DOMException && processError.name === "AbortError") {
        setError("Processing cancelled.");
      } else if (typeof navigator !== "undefined" && !navigator.onLine) {
        setError("You seem to be offline. Check your connection and try again.");
      } else {
        setError(processError instanceof Error ? processError.message : "Unable to process this image.");
      }

      setStage("error");
      setProgress(0);
      return null;
    }
  }, []);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
  }, []);

  return {
    stage,
    progress,
    result,
    error,
    processFile,
    cancel,
    reset,
    setResult,
    setStage,
  };
}

