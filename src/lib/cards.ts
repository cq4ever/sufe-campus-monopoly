import { fallbackEvents, type CampusEvent } from "../data/fallbackEvents";
import { fallbackQuiz, type Quiz } from "../data/fallbackQuiz";
export type Card =
  | { kind: "event"; data: CampusEvent; source: "AI 生成" | "题库" }
  | { kind: "quiz"; data: Quiz; source: "AI 生成" | "题库" };
const str = (v: unknown) =>
  typeof v === "string" && v.trim().length > 0 && v.length <= 600;
export function validEvent(v: unknown): v is CampusEvent {
  if (!v || typeof v !== "object") return false;
  const x = v as CampusEvent;
  return (
    str(x.title) &&
    str(x.text) &&
    Number.isInteger(x.money) &&
    x.money >= -200 &&
    x.money <= 200
  );
}
export function validQuiz(v: unknown): v is Quiz {
  if (!v || typeof v !== "object") return false;
  const x = v as Quiz;
  return (
    str(x.question) &&
    Array.isArray(x.options) &&
    x.options.length === 4 &&
    x.options.every(str) &&
    Number.isInteger(x.answer) &&
    x.answer >= 0 &&
    x.answer <= 3 &&
    str(x.explain)
  );
}
export function localCard(kind: "event" | "quiz"): Card {
  return kind === "event"
    ? {
        kind,
        data: fallbackEvents[Math.floor(Math.random() * fallbackEvents.length)],
        source: "题库",
      }
    : {
        kind,
        data: fallbackQuiz[Math.floor(Math.random() * fallbackQuiz.length)],
        source: "题库",
      };
}
export async function requestCard(kind: "event" | "quiz"): Promise<Card> {
  if (import.meta.env.VITE_DISABLE_AI === "true") return localCard(kind);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: kind }),
      signal: controller.signal,
    });
    if (!response.ok) throw Error("HTTP");
    const data = await response.json();
    const source = data.source === "AI 生成" ? "AI 生成" : "题库";
    if (kind === "event" && validEvent(data)) return { kind, data, source };
    if (kind === "quiz" && validQuiz(data)) return { kind, data, source };
    throw Error("invalid");
  } catch {
    return localCard(kind);
  } finally {
    clearTimeout(timer);
  }
}
