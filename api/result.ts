import type { IncomingMessage, ServerResponse } from "node:http";
import { questions } from "../src/data/questions";
import { systemPrompt } from "../src/data/ai";
import { scoreQuiz } from "../src/quiz/score";
import {
  copyFields,
  validateResultCopy,
  type ResultPayload,
} from "../src/lib/resultCopy";
import { withTimeout } from "../src/lib/timeout";
export { validateResultCopy } from "../src/lib/resultCopy";
type Request = IncomingMessage & { body?: unknown };
const buckets = new Map<string, { count: number; expires: number }>();
function allowedOrigins(): Set<string> {
  const origins = new Set(["https://cq4ever.github.io"]);
  for (const value of [
    process.env.VITE_SITE_URL,
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
    process.env.VERCEL_PROJECT_PRODUCTION_URL &&
      `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
  ]) {
    if (!value) continue;
    try {
      const url = new URL(value);
      if (["http:", "https:"].includes(url.protocol)) origins.add(url.origin);
    } catch {
      /* Ignore invalid configuration. */
    }
  }
  return origins;
}
function validPayload(value: unknown): value is ResultPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as ResultPayload;
  if (
    !Array.isArray(v.picks) ||
    v.picks.length !== 15 ||
    !v.scores ||
    typeof v.scores !== "object"
  )
    return false;
  const answers = v.picks.map((pick, i) =>
    questions[i].options.findIndex((o) => o.text === pick),
  );
  if (answers.includes(-1)) return false;
  const actual = scoreQuiz(answers);
  return (
    v.code === actual.code &&
    (["J", "N", "F", "P", "night"] as const).every(
      (key) => v.scores[key] === actual.scores[key],
    )
  );
}
export default async function handler(req: Request, res: ServerResponse) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Vary", "Origin");
  const send = (status: number, data?: unknown) => {
    res.statusCode = status;
    res.end(data === undefined ? undefined : JSON.stringify(data));
  };
  const origin = req.headers.origin;
  if (origin && !allowedOrigins().has(origin))
    return send(403, { fallback: true });
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return send(204);
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return send(405, { fallback: true });
  }
  let body = req.body;
  try {
    if (typeof body === "string") body = JSON.parse(body);
  } catch {
    return send(400, { fallback: true });
  }
  if (!validPayload(body)) return send(400, { fallback: true });
  const payload: ResultPayload = {
    code: body.code,
    scores: {
      J: body.scores.J,
      N: body.scores.N,
      F: body.scores.F,
      P: body.scores.P,
      night: body.scores.night,
    },
    picks: [...body.picks],
  };
  const now = Date.now();
  for (const [key, bucket] of buckets)
    if (bucket.expires <= now) buckets.delete(key);
  // Vercel supplies this header; outside Vercel use the socket, not a spoofable forwarding header.
  const forwarded = process.env.VERCEL
    ? req.headers["x-forwarded-for"]
    : undefined;
  const ip =
    (typeof forwarded === "string"
      ? forwarded.split(",")[0].trim()
      : undefined) ||
    req.socket.remoteAddress ||
    "unknown";
  const bucket = buckets.get(ip) ?? { count: 0, expires: now + 60000 };
  buckets.set(ip, bucket);
  if (bucket.count >= 5) {
    res.setHeader(
      "Retry-After",
      String(Math.ceil((bucket.expires - now) / 1000)),
    );
    return send(429, { fallback: true });
  }
  bucket.count++;
  const fallback = () => send(200, { fallback: true });
  if (!process.env.LLM_API_KEY) return fallback();
  try {
    const copy = await withTimeout(async (signal) => {
      const base = (
        process.env.LLM_BASE_URL || "https://api.deepseek.com"
      ).replace(/\/+$/, "");
      const response = await fetch(`${base}/chat/completions`, {
        method: "POST",
        signal,
        headers: {
          Authorization: `Bearer ${process.env.LLM_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.LLM_MODEL || "deepseek-chat",
          temperature: 0.9,
          response_format: { type: "json_object" },
          max_tokens: 500,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(payload) },
          ],
        }),
      });
      if (!response.ok) throw new Error("Provider unavailable");
      const result = await response.json();
      const content: unknown = result?.choices?.[0]?.message?.content;
      if (typeof content !== "string") throw new Error("Missing content");
      const value: unknown = JSON.parse(content);
      if (!validateResultCopy(value)) throw new Error("Invalid copy");
      return copyFields(value);
    }, 8000);
    return send(200, copy);
  } catch {
    return fallback();
  }
}
