import { describe, it, expect } from "vitest";
import { restoreSave } from "./storage";
import { createGame, reducer } from "./engine";
const make = () => createGame(["甲", "乙"], ["#df785e", "#558a77"]);
describe("存档恢复", () => {
  it("恢复有效存档", () => {
    const s = make();
    expect(restoreSave(JSON.stringify(s))).toEqual(s);
  });
  it("拒绝破损JSON及空存档", () => {
    expect(restoreSave("{")).toBeNull();
    expect(restoreSave(null)).toBeNull();
  });
  it("拒绝与棋格不一致的购买状态，避免页面崩溃", () => {
    const s = make();
    s.phase = "property";
    expect(restoreSave(JSON.stringify(s))).toBeNull();
  });
  it("拒绝不存在的胜者索引", () => {
    const s = make();
    s.phase = "over";
    s.winners = [999];
    expect(restoreSave(JSON.stringify(s))).toBeNull();
  });
  it("拒绝不存在的当前玩家与无效移动点数", () => {
    const s = make();
    s.current = 99;
    expect(restoreSave(JSON.stringify(s))).toBeNull();
    s.current = 0;
    s.phase = "moving";
    s.remaining = 0;
    expect(restoreSave(JSON.stringify(s))).toBeNull();
  });
  it("有效移动中存档可以继续", () => {
    const s = make();
    s.phase = "moving";
    s.remaining = 3;
    s.dice = 4;
    expect(restoreSave(JSON.stringify(s))).toEqual(s);
  });
  it("多人局当前玩家破产后仍可恢复并结束回合", () => {
    let s = createGame(["甲", "乙", "丙"], ["#df785e", "#558a77", "#788cbd"]);
    s.players[0].cash = 1;
    s.owners[1] = 1;
    s = reducer(s, { type: "ROLL", value: 1 });
    s = reducer(s, { type: "STEP" });
    expect(s.phase).toBe("done");
    expect(s.players[0].out).toBe(true);
    expect(restoreSave(JSON.stringify(s))).toEqual(s);
  });
});
