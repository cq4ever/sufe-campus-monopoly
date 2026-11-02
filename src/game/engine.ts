import { board } from "../data/board";
export type Player = {
  id: number;
  name: string;
  color: string;
  cash: number;
  position: number;
  skip: number;
  out: boolean;
};
export type State = {
  version: 1;
  players: Player[];
  owners: Record<number, number>;
  current: number;
  round: number;
  phase: "ready" | "moving" | "property" | "event" | "quiz" | "done" | "over";
  dice: number;
  remaining: number;
  log: string[];
  winners: number[];
};
export type Action =
  | { type: "NEW"; state: State }
  | { type: "ROLL"; value: number }
  | { type: "STEP" }
  | { type: "BUY" }
  | { type: "END" }
  | { type: "RESOLVE"; money: number };
export const rollDice = (random: number) =>
  Math.min(6, Math.max(1, Math.floor(random * 6) + 1));
export function createGame(names: string[], colors: string[]): State {
  return {
    version: 1,
    players: names.map((name, id) => ({
      id,
      name: name.trim().slice(0, 12) || `同学${id + 1}`,
      color: colors[id],
      cash: 1500,
      position: 0,
      skip: 0,
      out: false,
    })),
    owners: {},
    current: 0,
    round: 1,
    phase: "ready",
    dice: 0,
    remaining: 0,
    log: ["欢迎来到上财，新学期的财富之旅开始了！"],
    winners: [],
  };
}
export const assets = (s: State, id: number) =>
  s.players[id].cash +
  board.reduce((sum, t) => sum + (s.owners[t.id] === id ? t.price || 0 : 0), 0);
export function rent(s: State, id: number) {
  const t = board[id];
  const owner = s.owners[id];
  return (
    (t.price || 0) *
    0.2 *
    (owner !== undefined &&
    board
      .filter((x) => x.group === t.group)
      .every((x) => s.owners[x.id] === owner)
      ? 2
      : 1)
  );
}
function note(s: State, msg: string) {
  s.log = [msg, ...s.log].slice(0, 30);
}
function check(s: State) {
  for (const p of s.players)
    if (p.cash < 0 && !p.out) {
      p.out = true;
      for (const key of Object.keys(s.owners))
        if (s.owners[+key] === p.id) delete s.owners[+key];
      note(s, `${p.name} 资金不足，遗憾出局。`);
    }
  const alive = s.players.filter((p) => !p.out);
  const rich = alive.find((p) => p.cash >= 5000);
  if (alive.length === 1 || rich || s.round > 30) {
    s.phase = "over";
    const max = Math.max(...alive.map((p) => assets(s, p.id)));
    s.winners = rich
      ? [rich.id]
      : alive.filter((p) => assets(s, p.id) === max).map((p) => p.id);
  }
}
export function reducer(state: State, action: Action): State {
  if (action.type === "NEW") return action.state;
  if (state.phase === "over") return state;
  const s: State = {
    ...state,
    players: state.players.map((p) => ({ ...p })),
    owners: { ...state.owners },
    log: [...state.log],
  };
  const p = s.players[s.current];
  switch (action.type) {
    case "ROLL":
      if (
        s.phase !== "ready" ||
        !Number.isInteger(action.value) ||
        action.value < 1 ||
        action.value > 6
      )
        return state;
      if (p.skip) {
        p.skip--;
        s.phase = "done";
        note(s, `${p.name} 在校医院休息，本回合暂停。`);
        break;
      }
      s.dice = action.value;
      s.remaining = action.value;
      s.phase = "moving";
      note(s, `${p.name} 掷出 ${action.value} 点。`);
      break;
    case "STEP":
      if (s.phase !== "moving") return state;
      p.position = (p.position + 1) % 20;
      s.remaining--;
      if (p.position === 0) {
        p.cash += 200;
        note(s, `${p.name} 经过校门，领取 ¥200。`);
      }
      check(s);
      if (s.winners.length > 0) break;
      if (s.remaining > 0) break;
      {
        const t = board[p.position];
        s.phase = "done";
        if (t.type === "property") {
          const owner = s.owners[t.id];
          if (owner === undefined) s.phase = "property";
          else if (owner !== p.id) {
            const fee = rent(s, t.id);
            p.cash -= fee;
            s.players[owner].cash += fee;
            note(s, `${p.name} 向 ${s.players[owner].name} 支付租金 ¥${fee}。`);
          }
        } else if (t.type === "event" || t.type === "quiz") s.phase = t.type;
        else if (t.id === 5) {
          p.skip = 1;
          note(s, `${p.name} 抵达校医院，下回合休息。`);
        } else if (t.id === 15) {
          p.cash += 100;
          note(s, `${p.name} 完成晨跑，奖励 ¥100。`);
        } else note(s, `${p.name} 抵达${t.name}。`);
      }
      break;
    case "BUY": {
      const t = board[p.position];
      if (
        s.phase !== "property" ||
        !t.price ||
        s.owners[t.id] !== undefined ||
        p.cash < t.price
      )
        return state;
      p.cash -= t.price;
      s.owners[t.id] = p.id;
      s.phase = "done";
      note(s, `${p.name} 购入${t.name}，花费 ¥${t.price}。`);
      break;
    }
    case "RESOLVE":
      if (
        !["event", "quiz"].includes(s.phase) ||
        !Number.isInteger(action.money) ||
        action.money < -200 ||
        action.money > 200
      )
        return state;
      if (s.phase === "quiz" && ![150, -50].includes(action.money))
        return state;
      p.cash += action.money;
      s.phase = "done";
      note(
        s,
        `${p.name} ${action.money >= 0 ? "获得" : "支出"} ¥${Math.abs(action.money)}。`,
      );
      break;
    case "END":
      if (!["done", "property"].includes(s.phase)) return state;
      {
        let next = s.current;
        do {
          next = (next + 1) % s.players.length;
          if (next === 0) s.round++;
        } while (s.players[next].out);
        s.current = next;
        s.phase = "ready";
        s.dice = 0;
      }
      break;
  }
  check(s);
  return s;
}
