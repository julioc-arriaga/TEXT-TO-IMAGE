"use client";

import React, { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import type { GenerateImageRequest } from "@/app/lib/text2image/types";
import {
  DEFAULT_SAMPLER,
  SCHEDULERS,
  SUPPORTED_RESOLUTIONS,
} from "@/app/lib/text2image/constants";

type PromptFormProps = {
  disabled?: boolean;
  onGenerate: (payload: GenerateImageRequest) => Promise<void> | void;
};

export default function PromptForm({ disabled, onGenerate }: PromptFormProps) {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [resolution, setResolution] = useState<GenerateImageRequest["resolution"]>(
    SUPPORTED_RESOLUTIONS[0]
  );
  const [scheduler, setScheduler] = useState<GenerateImageRequest["scheduler"]>(DEFAULT_SAMPLER);
  const [numInferenceSteps, setNumInferenceSteps] = useState(50);
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [showAdvanced, setShowAdvanced] = useState(true);

  const isPromptValid = useMemo(() => prompt.trim().length > 0, [prompt]);

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
            Image prompt
          </label>
          <textarea
            className="mt-2 w-full resize-none rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-900 shadow-sm outline-none focus:border-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100"
            rows={4}
            placeholder="Describe what you want to see (e.g., 'a cyberpunk cat wearing a space helmet')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={disabled}
          />
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Tip: include style, subject, lighting, camera angle, and background.
          </div>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-900 shadow-sm hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-gray-900"
          onClick={() => setShowAdvanced((v) => !v)}
          disabled={disabled}
        >
          {showAdvanced ? "Hide advanced" : "Show advanced"}
        </button>
      </div>

      {showAdvanced && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
              Negative prompt (optional)
            </label>
            <textarea
              className="mt-2 w-full resize-none rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-900 shadow-sm outline-none focus:border-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100"
              rows={3}
              placeholder="Things to avoid (e.g., 'blurry, low quality, watermark')"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              disabled={disabled}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
              Resolution
            </label>
            <select
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-900 shadow-sm outline-none focus:border-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100"
              value={resolution}
              onChange={(e) => setResolution(e.target.value as any)}
              disabled={disabled}
            >
              {SUPPORTED_RESOLUTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
              Sampling method (scheduler)
            </label>
            <select
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-900 shadow-sm outline-none focus:border-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100"
              value={scheduler}
              onChange={(e) => setScheduler(e.target.value as GenerateImageRequest["scheduler"])}
              disabled={disabled}
            >
              {SCHEDULERS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
              Inference steps: <span className="font-semibold">{numInferenceSteps}</span>
            </label>
            <input
              type="range"
              min={10}
              max={100}
              step={1}
              value={numInferenceSteps}
              onChange={(e) => setNumInferenceSteps(Number(e.target.value))}
              disabled={disabled}
              className="mt-3 w-full accent-gray-900 dark:accent-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
              Guidance scale: <span className="font-semibold">{guidanceScale}</span>
            </label>
            <input
              type="range"
              min={1}
              max={15}
              step={0.5}
              value={guidanceScale}
              onChange={(e) => setGuidanceScale(Number(e.target.value))}
              disabled={disabled}
              className="mt-3 w-full accent-gray-900 dark:accent-gray-100"
            />
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Stable Diffusion (Replicate) - runs on your server, not in the browser.
        </div>
        <button
          type="button"
          onClick={async () => {
            if (!isPromptValid || disabled) return;
            await onGenerate({
              prompt,
              negativePrompt: negativePrompt.trim() ? negativePrompt.trim() : undefined,
              resolution,
              scheduler,
              numInferenceSteps,
              guidanceScale,
              numOutputs: 1,
            });
          }}
          disabled={!isPromptValid || disabled}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {disabled ? "Generating..." : "Generate"}
        </button>
      </div>
    </div>
  );
}

