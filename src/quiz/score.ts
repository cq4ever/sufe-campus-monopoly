import { questions, type Dimension } from "../data/questions";
import type { PersonalityCode } from "../data/types";
export type Scores = Record<Dimension | "night", number>;
export interface QuizResult {
  code: PersonalityCode;
  scores: Scores;
  radar: Scores;
}
const dimensions: Dimension[] = ["J", "N", "F", "P"];
const negatives: Record<Dimension, string> = { J: "T", N: "K", F: "Y", P: "S" };
const maxima: Record<Dimension, number> = { J: 8, N: 8, F: 8, P: 6 };
export function scoreQuiz(answers: number[]): QuizResult {
  if (
    answers.length !== questions.length ||
    Array.from(answers).some((a) => !Number.isInteger(a) || a < 0 || a > 3)
  )
    throw new RangeError("Expected 15 option indices (0–3)");
  const scores: Scores = { J: 0, N: 0, F: 0, P: 0, night: 0 };
  const first: Partial<Record<Dimension, number>> = {};
  questions.forEach((q, i) => {
    const option = q.options[answers[i]];
    scores[q.dimension] += option.value;
    first[q.dimension] ??= option.value;
    if (option.night) scores.night++;
  });
  const code = dimensions
    .map((d) => ((scores[d] || first[d]!) > 0 ? d : negatives[d]))
    .join("") as PersonalityCode;
  const radar: Scores = {
    J: 0,
    N: 0,
    F: 0,
    P: 0,
    night: (scores.night / 4) * 100,
  };
  for (const d of dimensions)
    radar[d] = Math.round(((scores[d] + maxima[d]) / (2 * maxima[d])) * 100);
  return { code, scores, radar };
}
