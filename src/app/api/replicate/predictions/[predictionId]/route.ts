import { NextResponse } from "next/server";
import Replicate from "replicate";
import { STABLE_DIFFUSION_MODEL_VERSION } from "@/app/lib/text2image/constants";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function GET(
  _request: Request,
  { params }: { params: { predictionId: string } }
) {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error(
      "The REPLICATE_API_TOKEN environment variable is not set. See README.md for instructions on how to set it."
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
    return NextResponse.json(
      { error: (error as Error).message || "Failed to fetch prediction." },
      { status: 500 }
    );
  }
}

