export const STORAGE_KEY = "sufe-personality-v1";
export interface Progress {
  answers: number[];
  cursor: number;
  started: boolean;
}
export function emptyProgress(): Progress {
  return { answers: [], cursor: 0, started: false };
}
export function restoreProgress(raw: string | null): Progress {
  try {
    const p: unknown = JSON.parse(raw ?? "null");
    if (!p || typeof p !== "object") return emptyProgress();
    const { answers, cursor, started } = p as Progress;
    if (
      !Array.isArray(answers) ||
      answers.length > 15 ||
      answers.some((a) => !Number.isInteger(a) || a < 0 || a > 3) ||
      !Number.isInteger(cursor) ||
      cursor < 0 ||
      cursor > answers.length ||
      typeof started !== "boolean" ||
      (!started && cursor !== 0)
    )
      return emptyProgress();
    return { answers, cursor, started };
  } catch {
    return emptyProgress();
  }
}
