import { expect, it } from "vitest";
import { restoreProgress } from "./storage";
it("restores partial and completed progress", () => {
  expect(
    restoreProgress('{"answers":[0,2],"cursor":1,"started":true}'),
  ).toEqual({ answers: [0, 2], cursor: 1, started: true });
  expect(
    restoreProgress(
      JSON.stringify({ answers: Array(15).fill(3), cursor: 15, started: true }),
    ),
  ).toEqual({ answers: Array(15).fill(3), cursor: 15, started: true });
});
it.each([
  null,
  "{",
  "null",
  "{}",
  '{"answers":[4],"cursor":1,"started":true}',
  '{"answers":[0],"cursor":2,"started":true}',
  '{"answers":[],"cursor":0.5,"started":true}',
  '{"answers":[],"cursor":0,"started":"yes"}',
])("rejects malformed or inconsistent saves %s", (raw) => {
  expect(restoreProgress(raw)).toEqual({
    answers: [],
    cursor: 0,
    started: false,
  });
});
it("preserves answers when the user returns from question one to homepage", () => {
  expect(
    restoreProgress('{"answers":[0,2],"cursor":0,"started":false}'),
  ).toEqual({ answers: [0, 2], cursor: 0, started: false });
});
