import type { PersonalityCode, ResultCopy } from "../data/types";
import type { Scores } from "../quiz/score";
export interface ResultPayload {
  code: PersonalityCode;
  scores: Scores;
  picks: string[];
}
export interface ResultText extends ResultCopy {
  source: "classic" | "ai";
}
export function validateResultCopy(value: unknown): value is ResultCopy {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  const text = (s: unknown, max: number) =>
    typeof s === "string" && s.trim().length > 0 && [...s].length <= max;
  return (
    text(v.subtitle, 14) &&
    text(v.roast, 60) &&
    text(v.share, 20) &&
    Array.isArray(v.tags) &&
    v.tags.length === 3 &&
    v.tags.every((t) => text(t, 6))
  );
}
export function copyFields(value: ResultCopy): ResultCopy {
  return {
    subtitle: value.subtitle,
    roast: value.roast,
    tags: [...value.tags],
    share: value.share,
  };
}
