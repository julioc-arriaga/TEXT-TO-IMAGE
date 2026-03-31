export const STABLE_DIFFUSION_MODEL_VERSION =
  "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf";

export const SUPPORTED_RESOLUTIONS = ["512x512", "1024x1024"] as const;

export const DEFAULT_SAMPLER = "DPMSolverMultistep";

// Common scheduler/sampling method values supported by this Replicate Stable Diffusion version.
// If a value is rejected by the model, the API will surface the error.
export const SCHEDULERS = [
  "DPMSolverMultistep",
  "K_Euler",
  "K_EulerAncestral",
  "Heun",
  "LMS",
  "DDIM",
] as const;

