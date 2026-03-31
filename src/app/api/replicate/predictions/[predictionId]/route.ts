import { NextResponse } from "next/server";
import Replicate from "replicate";
import { STABLE_DIFFUSION_MODEL_VERSION } from "@/app/lib/text2image/constants";
import {
  createReplicateClient,
  friendlyReplicateError,
} from "@/app/lib/replicate/auth";

export async function GET(
  _request: Request,
  { params }: { params: { predictionId: string } }
) {
  let replicate: Replicate;
  try {
    replicate = createReplicateClient();
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 503 }
    );
  }

  const predictionId = params.predictionId;
  if (!predictionId) {
    return NextResponse.json({ error: "predictionId is required." }, { status: 400 });
  }

  try {
    const prediction = await (replicate as any).predictions.get(predictionId);

    const status = prediction?.status ?? "unknown";

    const outputRaw = prediction?.output;
    const output =
      Array.isArray(outputRaw) ? (outputRaw.filter(Boolean) as string[]) : undefined;

    const errorRaw = prediction?.error;
    const error =
      typeof errorRaw === "string"
        ? errorRaw
        : errorRaw?.message
          ? String(errorRaw.message)
          : undefined;

    const progress =
      typeof prediction?.metrics?.progress === "number"
        ? prediction.metrics.progress
        : undefined;

    return NextResponse.json(
      {
        predictionId,
        status,
        modelVersion: STABLE_DIFFUSION_MODEL_VERSION,
        output,
        error,
        createdAt: prediction?.created_at ?? undefined,
        progress,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error from Replicate API (get):", error);
    const msg = (error as Error).message || "Failed to fetch prediction.";
    return NextResponse.json({ error: friendlyReplicateError(msg) }, { status: 500 });
  }
}

