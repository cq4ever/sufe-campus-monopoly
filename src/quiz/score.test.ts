import { describe, expect, it } from "vitest";
import { scoreQuiz } from "./score";
import { questions } from "../data/questions";
import { personalityTypes } from "../data/types";

describe("scoreQuiz", () => {
  it("scores all A as JNFP and all D as TKYS", () => {
    expect(scoreQuiz(Array(15).fill(0))).toEqual({
      code: "JNFP",
      scores: { J: 8, N: 8, F: 8, P: 6, night: 2 },
      radar: { J: 100, N: 100, F: 100, P: 100, night: 50 },
    });
    expect(scoreQuiz(Array(15).fill(3))).toEqual({
      code: "TKYS",
      scores: { J: -8, N: -8, F: -8, P: -6, night: 2 },
      radar: { J: 0, N: 0, F: 0, P: 0, night: 50 },
    });
  });
  it("breaks each dimension tie using its first question sign", () => {
    expect(scoreQuiz([0, 0, 3, 3, 0, 0, 3, 3, 0, 0, 3, 3, 0, 2, 2]).code).toBe(
      "JNFP",
    );
    expect(scoreQuiz([3, 3, 0, 0, 3, 3, 0, 0, 3, 3, 0, 0, 3, 1, 1]).code).toBe(
      "TKYS",
    );
  });
  it("counts night markers per selected question, not per option", () => {
    expect(
      scoreQuiz([0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1]).radar.night,
    ).toBe(0);
    expect(
      scoreQuiz([2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1]).radar.night,
    ).toBe(25);
    expect(
      scoreQuiz([2, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 2]).radar.night,
    ).toBe(100);
  });
  it("keeps all radar values between 0 and 100 over varied answers", () => {
    for (let i = 0; i < 1024; i++) {
      const answers = Array.from(
        { length: 15 },
        (_, q) => (i >> ((q % 5) * 2)) & 3,
      );
      for (const value of Object.values(scoreQuiz(answers).radar)) {
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
  });
  it("has exactly 16 unique types, each reachable by a constructed answer set", () => {
    expect(questions).toHaveLength(15);
    expect(personalityTypes).toHaveLength(16);
    const codes = new Set(personalityTypes.map((t) => t.code));
    expect(codes.size).toBe(16);
    const reached = new Set<string>();
    for (let mask = 0; mask < 16; mask++) {
      const picks = [
        ...Array(4).fill(mask & 8 ? 0 : 3),
        ...Array(4).fill(mask & 4 ? 0 : 3),
        ...Array(4).fill(mask & 2 ? 0 : 3),
        ...Array(3).fill(mask & 1 ? 0 : 3),
      ];
      reached.add(scoreQuiz(picks).code);
    }
    expect(reached).toEqual(codes);
    for (const type of personalityTypes) {
      expect(type.tags).toHaveLength(3);
      expect(type.tags.every((t) => [...t].length <= 6)).toBe(true);
    }
  });
  it.each([
    [],
    Array(14).fill(0),
    Array(16).fill(0),
    [...Array(14).fill(0), 4],
    [...Array(14).fill(0), -1],
    [...Array(14).fill(0), 0.5],
  ])("rejects invalid answers %#", (answers) => {
    expect(() => scoreQuiz(answers)).toThrow();
  });
});
