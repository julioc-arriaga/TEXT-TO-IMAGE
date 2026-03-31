export type Resolution = (typeof import("./constants").SUPPORTED_RESOLUTIONS)[number];

export type Scheduler = (typeof import("./constants").SCHEDULERS)[number];

export type GenerateImageRequest = {
  prompt: string;
  negativePrompt?: string;
  resolution: Resolution;
  scheduler: Scheduler;
  numInferenceSteps: number;
  guidanceScale: number;
  numOutputs?: number;
};

export type GenerateImageResponse = {
  predictionId: string;
  status: string;
  modelVersion: string;
  createdAt: number;
};

export type PredictionStatusResponse = {
  predictionId: string;
  status: string;
  modelVersion: string;
  output?: string[];
  error?: string;
  createdAt?: number;
  // Optional progress value if the SDK surfaces it.
  progress?: number;
};

export type HistoryImage = {
  resolution: string;
  url: string;
};

export type HistoryItem = {
  id: string;
  prompt: string;
  negativePrompt?: string;
  resolution: string;
  scheduler: string;
  numInferenceSteps: number;
  guidanceScale: number;
  modelVersion: string;
  createdAt: number;
  images: HistoryImage[];
};

