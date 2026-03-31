"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { Download, X } from "lucide-react";
import type { HistoryItem, Resolution } from "@/app/lib/text2image/types";

type ImageInfoModalProps = {
  open: boolean;
  item: HistoryItem;
  onClose: () => void;
  onDownloadResolution: (resolution: Resolution) => Promise<void> | void;
  downloadingResolution?: Resolution | null;
};

function formatDate(ms: number) {
  return new Date(ms).toLocaleString();
}

export default function ImageInfoModal({
  open,
  item,
  onClose,
  onDownloadResolution,
  downloadingResolution,
}: ImageInfoModalProps) {
  const [selected, setSelected] = useState<Resolution>(
    (item.images.find((img) => img.resolution === item.resolution)?.resolution as Resolution) ||
      (item.resolution as Resolution)
  );

  const selectedImage = useMemo(() => {
    return item.images.find((img) => img.resolution === selected);
  }, [item.images, selected]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-950">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-4 dark:border-gray-800">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Image details</div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Generated: {formatDate(item.createdAt)}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-5">
          <div className="md:col-span-3">
            <div className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
              {selectedImage?.url ? (
                <Image
                  src={selectedImage.url}
                  alt="Generated image"
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  No image for {selected} yet.
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {(["512x512", "1024x1024"] as Resolution[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelected(r)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                    selected === r
                      ? "border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-950"
                      : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-gray-900"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950">
              <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">Prompt</div>
              <div className="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">
                {item.prompt}
              </div>
              {item.negativePrompt ? (
                <>
                  <div className="mt-3 text-xs font-semibold text-gray-900 dark:text-gray-100">
                    Negative prompt
                  </div>
                  <div className="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">
                    {item.negativePrompt}
                  </div>
                </>
              ) : null}

              <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                <div>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Model</span>
                  <div className="text-gray-800 dark:text-gray-100 break-words">
                    {item.modelVersion}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Scheduler</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{item.scheduler}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Steps</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {item.numInferenceSteps}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Guidance</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {item.guidanceScale}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              {(["512x512", "1024x1024"] as Resolution[]).map((r) => {
                const hasImage = item.images.some((img) => img.resolution === r);
                const isDownloading = downloadingResolution === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => onDownloadResolution(r)}
                    disabled={isDownloading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-100 dark:text-gray-950 dark:hover:bg-gray-200"
                  >
                    <Download className="h-4 w-4" />
                    {isDownloading ? "Generating…" : hasImage ? `Download ${r}` : `Generate & Download ${r}`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

