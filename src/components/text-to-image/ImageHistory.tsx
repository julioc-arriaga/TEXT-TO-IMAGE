"use client";

import React from "react";
import Image from "next/image";
import type { HistoryItem } from "@/app/lib/text2image/types";

type ImageHistoryProps = {
  items: HistoryItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onSelect: (item: HistoryItem) => void;
};

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function ImageHistory({
  items,
  page,
  totalItems,
  pageSize,
  onPageChange,
  onSelect,
}: ImageHistoryProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">History</h2>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {totalItems === 0 ? "No generated images yet." : `Showing page ${page} of ${totalPages}.`}
          </div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{totalItems} items</div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.length > 0 ? (
          items.map((item) => {
            const thumb = item.images[0];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item)}
                className="group text-left"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm transition-transform group-hover:-translate-y-0.5 dark:border-gray-800 dark:bg-gray-900">
                  {thumb?.url ? (
                    <Image
                      src={thumb.url}
                      alt={item.prompt}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                      priority={false}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                      Missing image
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <div className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {item.prompt || "Untitled prompt"}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatDate(item.createdAt)}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                      {item.resolution}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="col-span-full rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400 lg:col-span-3">
            Your generated images will appear here.
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-gray-900"
        >
          Previous
        </button>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Page {page} / {totalPages}
        </div>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-gray-900"
        >
          Next
        </button>
      </div>
    </div>
  );
}

