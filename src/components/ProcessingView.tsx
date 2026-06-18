"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";
import { memo, useMemo } from "react";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";
import type { ProcessingStage } from "@/types";

const STAGE_COPY: Record<ProcessingStage, string> = {
  idle: "Waiting for an image...",
  selected: "Ready to transform.",
  uploading: "Uploading your image...",
  analyzing: "Detecting the main subject...",
  "removing-bg": "Isolating the subject...",
  flipping: "Applying horizontal flip...",
  finalizing: "Finalizing your cutout...",
  complete: "Your PixelForge is ready.",
  error: "Processing stopped.",
};

interface ProcessingViewProps {
  stage: ProcessingStage;
  progress: number;
  previewUrl: string | null;
}

// Memoized corner marks to prevent recreating array on every render
const CORNER_MARKS = [
  "left-0 top-0 border-l border-t",
  "right-0 top-0 border-r border-t",
  "bottom-0 left-0 border-b border-l",
  "bottom-0 right-0 border-b border-r",
] as const;

export const ProcessingView = memo(function ProcessingView({
  stage,
  progress,
  previewUrl,
}: ProcessingViewProps) {
  const reducedMotion = useReducedMotionSafe();

  // Memoize derived state to prevent recalculation
  const { isComplete, isFlipping, isTracing } = useMemo(
    () => ({
      isComplete: stage === "complete",
      isFlipping: stage === "flipping",
      isTracing: ["analyzing", "removing-bg", "finalizing"].includes(stage),
    }),
    [stage],
  );

  // Memoize stage copy lookup
  const stageCopy = STAGE_COPY[stage];

  // Memoize animation props to prevent recreating objects
  const imageAnimation = useMemo(
    () => ({
      animate: reducedMotion
        ? { opacity: 1 }
        : isFlipping
          ? { rotateY: [0, 180, 360] }
          : {
              scale: [1, 1.012, 1],
              filter: ["saturate(1)", "saturate(1.12)", "saturate(1)"],
            },
      transition: {
        duration: isFlipping ? 1.25 : 2.6,
        repeat: reducedMotion || isComplete ? 0 : Infinity,
      },
    }),
    [reducedMotion, isFlipping, isComplete],
  );

  return (
    <section className="min-h-[520px] rounded-[1.75rem] border border-white/80 bg-white/80 p-2 text-card-foreground shadow-[0_32px_90px_rgba(15,23,42,0.11)] backdrop-blur-xl lg:h-[520px]">
      <div className="relative grid min-h-[500px] overflow-hidden rounded-[1.35rem] border border-slate-200/70 bg-[radial-gradient(circle_at_50%_24%,rgba(255,255,255,.98),rgba(248,250,252,.92)_46%,rgba(241,245,249,.84))] p-5 sm:p-6 lg:h-[500px]">
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              PixelForge is processing
            </p>
            <h2 className="mt-1 text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
              {stageCopy}
            </h2>
          </div>
          <div
            className={cn(
              "grid size-12 shrink-0 place-items-center rounded-[1.1rem] border border-white bg-white/90 shadow-[0_14px_35px_rgba(15,23,42,0.10)]",
              isComplete ? "text-emerald-700" : "text-foreground",
            )}
          >
            {isComplete ? (
              <CheckCircle2 className="size-5" />
            ) : (
              <Sparkles className="size-5" />
            )}
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-6 grid w-full max-w-3xl flex-1 place-items-center">
          <div className="relative w-full overflow-hidden rounded-[1.25rem] border border-white/90 bg-[linear-gradient(45deg,rgba(15,23,42,.04)_25%,transparent_25%,transparent_75%,rgba(15,23,42,.04)_75%),linear-gradient(45deg,rgba(15,23,42,.04)_25%,transparent_25%,transparent_75%,rgba(15,23,42,.04)_75%),rgba(255,255,255,.62)] bg-[length:22px_22px] bg-[position:0_0,11px_11px] shadow-[inset_0_1px_0_rgba(255,255,255,.95),0_24px_60px_rgba(15,23,42,.10)]">
            {previewUrl ? (
              <motion.img
                src={previewUrl}
                alt=""
                className="h-[300px] w-full object-contain p-6 sm:h-[318px] sm:p-8"
                {...imageAnimation}
                style={{ transformStyle: "preserve-3d" }}
              />
            ) : (
              <div className="grid h-[300px] place-items-center p-6 text-sm text-muted-foreground sm:h-[318px] sm:p-8">
                Preparing preview
              </div>
            )}

            <div className="pointer-events-none absolute inset-4 rounded-[0.95rem] border border-cyan-200/70" />
            <div className="pointer-events-none absolute inset-4 rounded-[0.95rem] shadow-[0_0_52px_rgba(56,189,248,.18),inset_0_0_34px_rgba(255,255,255,.78)]" />

            {isTracing && !reducedMotion ? (
              <>
                <motion.div
                  className="pointer-events-none absolute inset-y-6 w-20 rounded-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.95),rgba(125,211,252,.48),transparent)] blur-md"
                  animate={{ x: ["-30%", "520%", "-30%"] }}
                  transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="pointer-events-none absolute inset-4 rounded-[0.95rem] border border-cyan-300/75"
                  animate={{
                    opacity: [0.25, 1, 0.35],
                    boxShadow: [
                      "0 0 0 rgba(34,211,238,0)",
                      "0 0 38px rgba(34,211,238,.35)",
                      "0 0 0 rgba(34,211,238,0)",
                    ],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </>
            ) : null}

            {!reducedMotion ? (
              <div className="pointer-events-none absolute inset-4">
                {CORNER_MARKS.map((position, index) => (
                  <motion.span
                    key={position}
                    className={cn(
                      "absolute size-7 border-slate-950/70",
                      position,
                    )}
                    animate={{ opacity: [0.42, 0.9, 0.42] }}
                    transition={{
                      duration: 1.7,
                      delay: index * 0.18,
                      repeat: isComplete ? 0 : Infinity,
                    }}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex w-full items-center justify-between gap-4 px-1 text-sm">
            <span className="text-muted-foreground">
              {isComplete ? "Done" : "Tracing edges"}
            </span>
            <span className="font-medium tabular-nums text-foreground">
              {progress}%
            </span>
          </div>
        </div>
      </div>
    </section>
  );
});

export default ProcessingView;
