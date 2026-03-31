"use client";

import React from "react";
import Image from "next/image";
import { Info } from "lucide-react";

type GeneratedImagesProps = {
  title: string;
  images?: string[] | null;
  loading?: boolean;
  disabled?: boolean;
  onOpenInfo?: () => void;
};

export default function GeneratedImages({
  title,
  images,
  loading,
  onOpenInfo,
}: GeneratedImagesProps) {
  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        {onOpenInfo ? (
          <button
            type="button"
            onClick={onOpenInfo}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 shadow-sm hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-gray-900"
            disabled={loading}
          >
            <Info className="h-4 w-4" />
            Details
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading && (!images || images.length === 0) ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="relative aspect-square animate-pulse rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-900"
            />
          ))
        ) : images && images.length > 0 ? (
          images.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950"
            >
              <button
                type="button"
                onClick={onOpenInfo}
                disabled={!onOpenInfo}
                className="absolute inset-0 cursor-zoom-in"
                aria-label="View image details"
              >
                <Image
                  src={url}
                  alt={`Generated image ${idx + 1}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                  priority={idx === 0}
                />
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
            No images yet. Enter a prompt and click <span className="font-semibold text-gray-700 dark:text-gray-200">Generate</span>.
          </div>
        )}
      </div>
    </div>
  );
}

