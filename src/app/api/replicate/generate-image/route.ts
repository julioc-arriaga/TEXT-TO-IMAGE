import { NextResponse } from "next/server";
import Replicate from "replicate";
import {
  STABLE_DIFFUSION_MODEL_REF,
  STABLE_DIFFUSION_VERSION_ID,
} from "@/app/lib/text2image/constants";
import type { GenerateImageRequest } from "@/app/lib/text2image/types";
import {
  createReplicateClient,
  friendlyReplicateError,
} from "@/app/lib/replicate/auth";

export async function POST(request: Request) {
  let replicate: Replicate;
  try {
    replicate = createReplicateClient();
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 503 }
    );
  }

  let body: Partial<GenerateImageRequest>;
  try {
    body = (await request.json()) as Partial<GenerateImageRequest>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  const resolution = body?.resolution;
  const scheduler = body?.scheduler;
  const numInferenceSteps = body?.numInferenceSteps;
  const guidanceScale = body?.guidanceScale;
  const negativePrompt =
    typeof body?.negativePrompt === "string" && body.negativePrompt.trim()
      ? body.negativePrompt.trim()
      : undefined;
  const numOutputs =
    typeof body?.numOutputs === "number" && body.numOutputs > 0 ? body.numOutputs : 1;

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }
  if (typeof resolution !== "string") {
    return NextResponse.json({ error: "resolution is required." }, { status: 400 });
  }
  if (typeof scheduler !== "string") {
    return NextResponse.json({ error: "scheduler is required." }, { status: 400 });
  }
  if (typeof numInferenceSteps !== "number" || !Number.isFinite(numInferenceSteps)) {
    return NextResponse.json(
      { error: "numInferenceSteps must be a number." },
      { status: 400 }
    );
  }
  if (typeof guidanceScale !== "number" || !Number.isFinite(guidanceScale)) {
    return NextResponse.json(
      { error: "guidanceScale must be a number." },
      { status: 400 }
    );
  }

  try {
    const prediction = await replicate.predictions.create({
      version: STABLE_DIFFUSION_VERSION_ID,
      input: {
        prompt,
        negative_prompt: negativePrompt,
        image_dimensions: resolution,
        num_outputs: numOutputs,
        num_inference_steps: numInferenceSteps,
        guidance_scale: guidanceScale,
        scheduler,
      },
    });

    return NextResponse.json(
      {
        predictionId: prediction.id,
        status: prediction.status,
        modelVersion: STABLE_DIFFUSION_MODEL_REF,
        createdAt: Date.now(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error from Replicate API (create):", error);
    const msg = (error as Error).message || "Failed to create prediction.";
    return NextResponse.json(
      { error: friendlyReplicateError(msg) },
      { status: 500 }
    );
  }
}
