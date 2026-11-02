import { board } from "../data/board";
import type { State } from "./engine";
export function restoreSave(raw: string | null): State | null {
  try {
    const s = JSON.parse(raw || "null");
    if (
      s?.version !== 1 ||
      !Array.isArray(s.players) ||
      s.players.length < 2 ||
      s.players.length > 4 ||
      !s.players.every(
        (p: State["players"][number], i: number) =>
          p &&
          p.id === i &&
          typeof p.name === "string" &&
          /^#[0-9a-f]{6}$/i.test(p.color) &&
          Number.isSafeInteger(p.cash) &&
          Number.isInteger(p.position) &&
          p.position >= 0 &&
          p.position < 20 &&
          typeof p.out === "boolean" &&
          [0, 1].includes(p.skip),
      ) ||
      ![
        "ready",
        "moving",
        "property",
        "event",
        "quiz",
        "done",
        "over",
      ].includes(s.phase) ||
      !Number.isInteger(s.current) ||
      !s.players[s.current] ||
      !Array.isArray(s.log) ||
      !s.log.every((x: unknown) => typeof x === "string") ||
      !s.owners ||
      typeof s.owners !== "object" ||
      Array.isArray(s.owners) ||
      !Array.isArray(s.winners) ||
      !Number.isInteger(s.remaining) ||
      s.remaining < 0 ||
      s.remaining > 6 ||
      !Number.isInteger(s.round) ||
      s.round < 1 ||
      s.round > 31 ||
      !Number.isInteger(s.dice) ||
      s.dice < 0 ||
      s.dice > 6 ||
      Object.entries(s.owners).some(
        ([k, v]) =>
          board[+k]?.type !== "property" ||
          !Number.isInteger(v) ||
          !s.players[v as number] ||
          s.players[v as number].out,
      )
    )
      return null;
    const p = s.players[s.current];
    if (
      s.winners.some(
        (id: number) =>
          !Number.isInteger(id) || !s.players[id] || s.players[id].out,
      )
    )
      return null;
    if (s.phase === "over" ? s.winners.length === 0 : s.winners.length > 0)
      return null;
    if (
      s.phase !== "over" &&
      ((p.out && s.phase !== "done") ||
        s.players.filter((p: State["players"][number]) => !p.out).length < 2)
    )
      return null;
    if (
      s.phase === "property" &&
      (board[p.position].type !== "property" ||
        s.owners[p.position] !== undefined)
    )
      return null;
    if (
      (s.phase === "quiz" || s.phase === "event") &&
      board[p.position].type !== s.phase
    )
      return null;
    if (
      s.phase === "moving" &&
      (s.remaining < 1 || s.dice < 1 || s.remaining > s.dice)
    )
      return null;
    if (s.phase !== "moving" && s.phase !== "over" && s.remaining !== 0)
      return null;
    return s;
  } catch {
    return null;
  }
}
