"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GenerateImageRequest, HistoryImage, HistoryItem, PredictionStatusResponse, Resolution } from "@/app/lib/text2image/types";
import {
  STABLE_DIFFUSION_MODEL_VERSION,
  SUPPORTED_RESOLUTIONS,
} from "@/app/lib/text2image/constants";
import PromptForm from "@/components/text-to-image/PromptForm";
import GenerationProgress from "@/components/text-to-image/GenerationProgress";
import GeneratedImages from "@/components/text-to-image/GeneratedImages";
import ImageHistory from "@/components/text-to-image/ImageHistory";
import ImageInfoModal from "@/components/text-to-image/ImageInfoModal";

const HISTORY_STORAGE_KEY = "text2image_history_v1";

type GenerationState =
  | { phase: "idle" }
  | {
      phase: "creating";
      predictionId: string;
      status: string;
      progress?: number;
      error?: string;
    }
  | {
      phase: "running";
      predictionId: string;
      status: string;
      progress?: number;
      error?: string;
    }
  | {
      phase: "succeeded";
      predictionId: string;
      status: string;
      progress?: number;
      images: string[];
      request: Omit<GenerateImageRequest, "numOutputs">;
      createdAt: number;
      modelVersion: string;
    }
  | {
      phase: "failed";
      status: string;
      error: string;
    };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeParseHistory(raw: string | null): HistoryItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as HistoryItem[];
  } catch {
    return [];
  }
}

function normalizeOutputToImages(output?: string[]): string[] {
  if (!output) return [];
  return output.filter((u): u is string => typeof u === "string" && u.length > 0);
}

async function fetchJSON<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const text = await res.text();
  if (!res.ok) {
    // Try to surface a helpful message from the server.
    let serverErr: any = null;
    try {
      serverErr = JSON.parse(text);
    } catch {
      serverErr = null;
    }
    const msg =
      serverErr?.error && typeof serverErr.error === "string"
        ? serverErr.error
        : `Request failed with ${res.status}.`;
    throw new Error(msg);
  }

  return JSON.parse(text) as T;
}

async function downloadImage(url: string, filename: string) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to download (HTTP ${resp.status}).`);
    const blob = await resp.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    // If CORS prevents downloading the blob, fall back to opening the URL.
    window.open(url, "_blank");
  }
}

export default function TextToImageApp() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const [generation, setGeneration] = useState<GenerationState>({ phase: "idle" });

  const [modalItem, setModalItem] = useState<HistoryItem | null>(null);
  const [downloadingResolution, setDownloadingResolution] = useState<Resolution | null>(null);

  const pollingRef = useRef<number | null>(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    const loaded = safeParseHistory(
      typeof window !== "undefined" ? window.localStorage.getItem(HISTORY_STORAGE_KEY) : null
    );
    setHistory(loaded);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const totalItems = history.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const visibleHistory = useMemo(() => {
    const start = (page - 1) * pageSize;
    return history.slice(start, start + pageSize);
  }, [history, page]);

  const cancelPolling = useCallback(() => {
    cancelRef.current = true;
    if (pollingRef.current) window.clearInterval(pollingRef.current);
    pollingRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cancelPolling();
    };
  }, [cancelPolling]);

  const updateHistoryItemWithImage = useCallback(
    (itemId: string, resolution: Resolution, url: string) => {
      setHistory((prev) => {
        const idx = prev.findIndex((x) => x.id === itemId);
        if (idx === -1) return prev;
        const item = prev[idx];
        const images: HistoryImage[] = [
          ...item.images.filter((img) => img.resolution !== resolution),
          { resolution, url },
        ];
        images.sort(
          (a, b) =>
            SUPPORTED_RESOLUTIONS.indexOf(a.resolution as any) -
            SUPPORTED_RESOLUTIONS.indexOf(b.resolution as any)
        );
        const nextItem: HistoryItem = { ...item, images, resolution };
        const next = [...prev];
        next[idx] = nextItem;
        return next;
      });
    },
    []
  );

  const createPrediction = useCallback(async (payload: GenerateImageRequest) => {
    const res = await fetchJSON<{
      predictionId: string;
      status: string;
      modelVersion: string;
      createdAt: number;
    }>("/api/replicate/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return res;
  }, []);

  const pollPrediction = useCallback(
    async (
      predictionId: string,
      onUpdate: (data: PredictionStatusResponse) => void
    ) => {
    cancelRef.current = false;
    let fakeProgress = 8;
    const startedAt = Date.now();

    while (Date.now() - startedAt < 1000 * 120) {
      if (cancelRef.current) throw new Error("Generation canceled.");

      const data = await fetchJSON<PredictionStatusResponse>(
        `/api/replicate/predictions/${predictionId}`
      );
      const status = data.status?.toLowerCase() ?? "";
      if (status.includes("succeeded")) {
        const progressToSend =
          typeof data.progress === "number" ? clamp(data.progress, 0, 100) : fakeProgress;
        onUpdate({ ...data, progress: progressToSend });
        return { ...data, progress: progressToSend };
      }
      if (status.includes("failed") || status.includes("canceled")) {
        onUpdate({ ...data });
        throw new Error(data.error || `Generation ${data.status}.`);
      }

      // If Replicate doesn't provide an actual progress value, still give a smooth UI.
      if (typeof data.progress === "number") {
        fakeProgress = clamp(data.progress, 0, 100);
      } else if (status.includes("processing")) {
        fakeProgress = clamp(fakeProgress + 10, 10, 90);
      } else {
        fakeProgress = clamp(fakeProgress + 3, 0, 60);
      }

      onUpdate({ ...data, progress: fakeProgress });
      await new Promise((r) => setTimeout(r, 1000));
    }

    throw new Error("Timed out while waiting for the image to generate.");
    },
    []
  );

  const generate = useCallback(
    async (payload: GenerateImageRequest) => {
      if (!payload.prompt.trim()) return;
      cancelPolling();
      setGeneration({ phase: "creating", predictionId: "pending", status: "starting" });

      const request: Omit<GenerateImageRequest, "numOutputs"> = {
        prompt: payload.prompt,
        negativePrompt: payload.negativePrompt,
        resolution: payload.resolution,
        scheduler: payload.scheduler,
        numInferenceSteps: payload.numInferenceSteps,
        guidanceScale: payload.guidanceScale,
      };

      try {
        const created = await createPrediction(payload);
        const predictionId = created.predictionId;

        setGeneration({
          phase: "running",
          predictionId,
          status: created.status,
          progress: undefined,
        });

        const result = await pollPrediction(predictionId, (data) => {
          const nextStatus = data.status || "processing";
          setGeneration((prev) => {
            if (prev.phase !== "running") return prev;
            const progress = typeof data.progress === "number" ? data.progress : prev.progress;
            return {
              ...prev,
              status: nextStatus,
              progress,
            };
          });
        });

        const images = normalizeOutputToImages(result.output);
        if (!images[0]) {
          throw new Error("Replicate returned no images.");
        }

        const createdAt = Date.now();
        setGeneration({
          phase: "succeeded",
          predictionId,
          status: result.status,
          images,
          request,
          createdAt,
          modelVersion: STABLE_DIFFUSION_MODEL_VERSION,
          progress: result.progress,
        });

        // Persist to history (localStorage).
        const newItem: HistoryItem = {
          id: `${predictionId}-${createdAt}`,
          prompt: request.prompt,
          negativePrompt: request.negativePrompt,
          resolution: request.resolution,
          scheduler: request.scheduler,
          numInferenceSteps: request.numInferenceSteps,
          guidanceScale: request.guidanceScale,
          modelVersion: STABLE_DIFFUSION_MODEL_VERSION,
          createdAt,
          images: [
            {
              resolution: request.resolution,
              url: images[0],
            },
          ],
        };

        setHistory((prev) => {
          const next = [newItem, ...prev];
          return next.slice(0, 60); // keep storage bounded
        });
        setPage(1);
      } catch (error) {
        setGeneration({
          phase: "failed",
          status: "failed",
          error: error instanceof Error ? error.message : "Something went wrong.",
        });
      }
    },
    [createPrediction, pollPrediction, cancelPolling]
  );

  const generatedImages = generation.phase === "succeeded" ? generation.images : undefined;
  const isGenerating = generation.phase === "creating" || generation.phase === "running";
  const progressStatus =
    generation.phase === "creating"
      ? generation.status
      : generation.phase === "running"
        ? generation.status
        : generation.phase === "failed"
          ? generation.status
          : "idle";
  const progressValue =
    generation.phase === "creating"
      ? generation.progress
      : generation.phase === "running"
        ? generation.progress
        : undefined;
  const generationError = generation.phase === "failed" ? generation.error : undefined;

  const generatedInfoItem: HistoryItem | null = useMemo(() => {
    if (generation.phase !== "succeeded") return null;
    const createdAt = generation.createdAt;
    return {
      id: `${generation.predictionId}-${createdAt}-generated-preview`,
      prompt: generation.request.prompt,
      negativePrompt: generation.request.negativePrompt,
      resolution: generation.request.resolution,
      scheduler: generation.request.scheduler,
      numInferenceSteps: generation.request.numInferenceSteps,
      guidanceScale: generation.request.guidanceScale,
      modelVersion: generation.modelVersion,
      createdAt,
      images: [
        {
          resolution: generation.request.resolution,
          url: generation.images[0],
        },
      ],
    };
  }, [generation]);

  const openModalForGenerated = useCallback(() => {
    if (!generatedInfoItem) return;
    setModalItem(generatedInfoItem);
  }, [generatedInfoItem]);

  const requestDownloadResolution = useCallback(
    async (resolution: Resolution) => {
      if (!modalItem) return;
      setDownloadingResolution(resolution);

      try {
        const existing = modalItem.images.find((img) => img.resolution === resolution);
        if (existing?.url) {
          await downloadImage(existing.url, `text2image_${resolution}.png`);
          return;
        }

        // If the resolution isn't present yet, generate it and then download.
        const createdAt = Date.now();
        const payload: GenerateImageRequest = {
          prompt: modalItem.prompt,
          negativePrompt: modalItem.negativePrompt,
          resolution,
          scheduler: modalItem.scheduler as any,
          numInferenceSteps: modalItem.numInferenceSteps,
          guidanceScale: modalItem.guidanceScale,
          numOutputs: 1,
        };

        const created = await createPrediction(payload);
        const predictionId = created.predictionId;

        const result = await pollPrediction(predictionId, (_data) => {
          // Download flow keeps modal responsive; progress is shown in the main UI.
        });

        const images = normalizeOutputToImages(result.output);
        if (!images[0]) throw new Error("Replicate returned no images.");

        const url = images[0];
        await downloadImage(url, `text2image_${resolution}.png`);
        // Update the stored history item if it's a real history item.
        if (modalItem.id && modalItem.id.includes("-generated-preview") === false) {
          updateHistoryItemWithImage(modalItem.id, resolution, url);
          setModalItem((prev) => {
            if (!prev) return prev;
            const nextImages: HistoryImage[] = [
              ...prev.images.filter((img) => img.resolution !== resolution),
              { resolution, url },
            ];
            nextImages.sort(
              (a, b) =>
                SUPPORTED_RESOLUTIONS.indexOf(a.resolution as any) -
                SUPPORTED_RESOLUTIONS.indexOf(b.resolution as any)
            );
            return { ...prev, resolution, images: nextImages };
          });
        }
      } catch (error) {
        alert(error instanceof Error ? error.message : "Download failed.");
      } finally {
        setDownloadingResolution(null);
      }
    },
    [modalItem, createPrediction, pollPrediction, updateHistoryItemWithImage]
  );

  return (
    <div className="min-h-screen bg-white px-4 py-8 dark:bg-gray-950">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Text to Image
          </div>
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Generate images with Replicate (Stable Diffusion) and keep a local history.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <PromptForm
              disabled={isGenerating}
              onGenerate={async (payload) => {
                await generate(payload);
              }}
            />

            {generation.phase !== "idle" ? (
              <GenerationProgress
                status={progressStatus}
                progress={progressValue}
                error={generationError}
              />
            ) : null}
          </div>

          <div className="lg:col-span-3">
            <GeneratedImages
              title="Generated"
              images={generatedImages}
              loading={isGenerating}
              onOpenInfo={generatedInfoItem ? openModalForGenerated : undefined}
            />

            <div className="mt-6">
              <ImageHistory
                items={visibleHistory}
                page={page}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={setPage}
                onSelect={(item) => setModalItem(item)}
              />
            </div>
          </div>
        </div>
      </div>

      {modalItem ? (
        <ImageInfoModal
          open={true}
          item={modalItem}
          onClose={() => setModalItem(null)}
          onDownloadResolution={requestDownloadResolution}
          downloadingResolution={downloadingResolution}
        />
      ) : null}
    </div>
  );
}

