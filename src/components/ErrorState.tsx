"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <section className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive" role="alert">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0" />
        <div>
          <h2 className="font-semibold">Could not process this image</h2>
          <p className="mt-1 text-sm text-destructive/80">{message}</p>
          <Button type="button" onClick={onRetry} variant="outline" className="mt-4 border-destructive/30 bg-background text-destructive hover:bg-destructive/10">
            Try another image
          </Button>
        </div>
      </div>
    </section>
  );
}
