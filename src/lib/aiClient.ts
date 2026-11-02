import { getPreset } from "../data/types";
import {
  copyFields,
  validateResultCopy,
  type ResultPayload,
  type ResultText,
} from "./resultCopy";
import { withTimeout } from "./timeout";
export async function requestAiResult(
  payload: ResultPayload,
  signal?: AbortSignal,
): Promise<ResultText> {
  const fallback: ResultText = {
    ...getPreset(payload.code),
    source: "classic",
  };
  if (import.meta.env.VITE_DISABLE_AI === "true") return fallback;
  try {
    return await withTimeout(
      async (signal) => {
        const base = (import.meta.env.VITE_API_BASE ?? "").replace(/\/+$/, "");
        const response = await fetch(`${base}/api/result`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal,
        });
        if (!response.ok) return fallback;
        const value: unknown = await response.json();
        if (
          !validateResultCopy(value) ||
          (value as { fallback?: unknown }).fallback
        )
          return fallback;
        return { ...copyFields(value), source: "ai" as const };
      },
      9000,
      signal,
    );
  } catch {
    return fallback;
  }
}
