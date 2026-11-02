import { describe, it, expect, vi, afterEach } from "vitest";
import { validEvent, validQuiz, requestCard } from "./cards";
import { fallbackEvents } from "../data/fallbackEvents";
import { fallbackQuiz } from "../data/fallbackQuiz";
describe("卡片校验与兜底", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
  it("本地素材数量及结构完整", () => {
    expect(fallbackEvents.length).toBeGreaterThanOrEqual(30);
    expect(fallbackQuiz.length).toBeGreaterThanOrEqual(30);
    expect(fallbackEvents.every(validEvent)).toBe(true);
    expect(fallbackQuiz.every(validQuiz)).toBe(true);
  });
  it("拒绝越界金额、错误索引和错误选项数量", () => {
    expect(validEvent({ ...fallbackEvents[0], money: 201 })).toBe(false);
    expect(validEvent({ ...fallbackEvents[0], money: -201 })).toBe(false);
    expect(validQuiz({ ...fallbackQuiz[0], answer: 4 })).toBe(false);
    expect(validQuiz({ ...fallbackQuiz[0], options: ["a"] })).toBe(false);
  });
  it("请求失败返回题库", async () => {
    vi.stubGlobal("fetch", () => Promise.reject(Error("offline")));
    const c = await requestCard("quiz");
    expect(c.kind).toBe("quiz");
    expect(c.source).toBe("题库");
    expect(validQuiz(c.data)).toBe(true);
  });
  it("不信任无效的服务端响应", async () => {
    vi.stubGlobal("fetch", async () => ({
      ok: true,
      json: async () => ({ title: "伪造", money: 9999 }),
    }));
    expect((await requestCard("event")).source).toBe("题库");
  });
  it("有效AI响应保留来源", async () => {
    vi.stubGlobal("fetch", async () => ({
      ok: true,
      json: async () => ({ ...fallbackEvents[0], source: "AI 生成" }),
    }));
    expect((await requestCard("event")).source).toBe("AI 生成");
  });
  it("超时后自动回退", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      (_url: unknown, opts: RequestInit) =>
        new Promise((_resolve, reject) =>
          opts.signal?.addEventListener("abort", () => reject(Error("abort"))),
        ),
    );
    const result = requestCard("event");
    await vi.advanceTimersByTimeAsync(6500);
    expect((await result).source).toBe("题库");
  });
});
