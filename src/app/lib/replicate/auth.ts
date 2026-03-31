import Replicate from "replicate";

/**
 * Read token at request time (not at module load).
 * Replit Secrets and other hosts inject env at process start; Next.js bundling
 * can also snapshot module-scope `process.env` incorrectly for API routes.
 */
export function getReplicateApiToken(): string | undefined {
  const raw =
    process.env.REPLICATE_API_TOKEN ??
    process.env.REPLICATE_TOKEN ??
    process.env.REPLICATE_KEY ??
    "";

  const trimmed = String(raw).trim();
  if (!trimmed) return undefined;

  // Users sometimes paste "Bearer r8_..." or quoted values from UIs.
  const withoutBearer = trimmed.replace(/^Bearer\s+/i, "");
  return withoutBearer.replace(/^["']|["']$/g, "").trim() || undefined;
}

export function createReplicateClient(): Replicate {
  const token = getReplicateApiToken();
  if (!token) {
    throw new Error(
      "Missing Replicate API token. Add REPLICATE_API_TOKEN in Replit Secrets (or .env locally), then restart the dev server."
    );
  }
  return new Replicate({ auth: token });
}

/** Map Replicate HTTP errors to actionable UI text */
export function friendlyReplicateError(message: string): string {
  if (/401|Unauthenticated|valid authentication token/i.test(message)) {
    return [
      "Replicate rejected the API token (401).",
      "In Replit: Secrets → add key REPLICATE_API_TOKEN (exact name) with token from replicate.com/account/api-tokens, save, then restart the Repl.",
      `Details: ${message}`,
    ].join(" ");
  }
  return message;
}
