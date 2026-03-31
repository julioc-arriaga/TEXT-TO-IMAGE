import { NextResponse } from "next/server";
import Replicate from "replicate";
import {
  STABLE_DIFFUSION_MODEL_VERSION,
} from "@/app/lib/text2image/constants";
import type { GenerateImageRequest } from "@/app/lib/text2image/types";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: Request) {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error(
      "The REPLICATE_API_TOKEN environment variable is not set. See README.md for instructions on how to set it."
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
    const prediction = await (replicate as any).predictions.create({
      version: STABLE_DIFFUSION_MODEL_VERSION,
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
        modelVersion: STABLE_DIFFUSION_MODEL_VERSION,
        createdAt: Date.now(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error from Replicate API (create):", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to create prediction." },
      { status: 500 }
    );
  }
}
