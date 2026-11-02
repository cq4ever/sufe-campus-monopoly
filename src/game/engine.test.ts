import { describe, it, expect } from "vitest";
import {
  createGame,
  reducer,
  rollDice,
  rent,
  assets,
  type State,
} from "./engine";
const start = () => createGame(["小财", "小富"], ["#f00", "#00f"]);
const land = (s: State, n: number) => {
  s = reducer(s, { type: "ROLL", value: n });
  while (s.phase === "moving") s = reducer(s, { type: "STEP" });
  return s;
};
describe("校园规则", () => {
  it("六面骰边界", () => {
    expect(rollDice(0)).toBe(1);
    expect(rollDice(0.999)).toBe(6);
  });
  it("逐格移动，经过起点仅奖励一次", () => {
    let s = start();
    s.players[0].position = 19;
    s = reducer(s, { type: "ROLL", value: 2 });
    s = reducer(s, { type: "STEP" });
    expect(s.players[0].position).toBe(0);
    expect(s.players[0].cash).toBe(1700);
    s = reducer(s, { type: "STEP" });
    expect(s.players[0].cash).toBe(1700);
  });
  it("可以买地，不能重复买地", () => {
    let s = land(start(), 1);
    s = reducer(s, { type: "BUY" });
    expect(s.owners[1]).toBe(0);
    expect(s.players[0].cash).toBe(1400);
    expect(reducer(s, { type: "BUY" })).toEqual(s);
    expect(assets(s, 0)).toBe(1500);
  });
  it("不够钱不能购买", () => {
    let s = start();
    s.players[0].cash = 10;
    s = land(s, 1);
    expect(reducer(s, { type: "BUY" }).owners[1]).toBeUndefined();
  });
  it("支付租金，同组集齐翻倍", () => {
    let s = start();
    s.owners = { 1: 1, 3: 1, 4: 1 };
    expect(rent(s, 1)).toBe(40);
    s = land(s, 1);
    expect(s.players[0].cash).toBe(1460);
    expect(s.players[1].cash).toBe(1540);
  });
  it("破产释放地产，最后存活者胜利", () => {
    let s = start();
    s.players[0].cash = 1;
    s.owners = { 1: 1, 3: 0 };
    s = land(s, 1);
    expect(s.players[0].out).toBe(true);
    expect(s.owners[3]).toBeUndefined();
    expect(s.phase).toBe("over");
    expect(s.winners).toEqual([1]);
  });
  it("现金达到5000立即获胜", () => {
    let s = start();
    s.players[0].cash = 4900;
    s.players[0].position = 19;
    s = land(s, 1);
    expect(s.phase).toBe("over");
    expect(s.winners).toEqual([0]);
  });
  it("30轮结束按资产选出并列赢家", () => {
    let s = start();
    s.round = 30;
    s.current = 1;
    s.phase = "done";
    s.owners = { 1: 0 };
    s = reducer(s, { type: "END" });
    expect(s.phase).toBe("over");
    expect(s.winners).toEqual([0]);
  });
  it("医院停一次回合", () => {
    let s = land(start(), 5);
    expect(s.players[0].skip).toBe(1);
    s = reducer(s, { type: "END" });
    s = land(s, 1);
    s = reducer(s, { type: "END" });
    s = reducer(s, { type: "ROLL", value: 3 });
    expect(s.players[0].skip).toBe(0);
    expect(s.players[0].position).toBe(5);
    expect(s.phase).toBe("done");
  });
  it("错误阶段操作无效", () => {
    const s = start();
    expect(reducer(s, { type: "END" })).toEqual(s);
    expect(reducer(s, { type: "STEP" })).toEqual(s);
  });
});
