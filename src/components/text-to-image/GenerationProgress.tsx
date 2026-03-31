"use client";

import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

type GenerationProgressProps = {
  status: string;
  progress?: number;
  error?: string;
};

function statusToLabel(status: string) {
  const s = status.toLowerCase();
  if (s.includes("starting")) return "Starting generation…";
  if (s.includes("processing")) return "Generating image…";
  if (s.includes("succeeded")) return "Done!";
  if (s.includes("failed")) return "Generation failed.";
  if (s.includes("canceled")) return "Generation canceled.";
  return `Status: ${status}`;
}

export default function GenerationProgress({
  status,
  progress,
  error,
}: GenerationProgressProps) {
  const label = statusToLabel(status);

  if (error) {
    return (
      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5" />
          <div className="min-w-0">
            <div className="text-sm font-semibold">Could not generate the image</div>
            <div className="mt-1 text-xs leading-relaxed">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  const pct = typeof progress === "number" && Number.isFinite(progress) ? progress : undefined;

  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{label}</div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {typeof pct === "number" ? `Progress: ${Math.round(pct)}%` : "Working…"}
          </div>
        </div>
        {status.toLowerCase().includes("succeed") ? (
          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            Complete
          </div>
        ) : (
          <Loader2 className="h-5 w-5 animate-spin text-gray-700 dark:text-gray-200" />
        )}
      </div>

      <div className="mt-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            className="h-full rounded-full bg-gray-900 transition-[width] duration-300 dark:bg-gray-100"
            style={{ width: `${typeof pct === "number" ? Math.min(100, Math.max(0, pct)) : 25}%` }}
          />
        </div>
      </div>
    </div>
  );
}

