import { describe, it, expect, vi, afterEach } from "vitest";
import { validEvent, validQuiz, requestCard } from "./cards";
import { fallbackEvents } from "../data/fallbackEvents";
import { fallbackQuiz } from "../data/fallbackQuiz";
describe("卡片校验与兜底", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
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
  it.each(["event", "quiz"] as const)(
    "禁用 AI 时 %s 直接随机抽取题库且不发请求",
    async (kind) => {
      vi.stubEnv("VITE_DISABLE_AI", "true");
      const fetch = vi.fn();
      vi.stubGlobal("fetch", fetch);
      const random = vi.spyOn(Math, "random").mockReturnValue(0);
      const first = await requestCard(kind);
      const pool = kind === "event" ? fallbackEvents : fallbackQuiz;
      expect(first).toEqual({ kind, data: pool[0], source: "题库" });
      random.mockReturnValue(0.999999);
      expect(await requestCard(kind)).toEqual({
        kind,
        data: pool[pool.length - 1],
        source: "题库",
      });
      expect(fetch).not.toHaveBeenCalled();
    },
  );
  it.each([undefined, "false", "TRUE"])(
    "开关为 %s 时仍请求 AI",
    async (value) => {
      vi.stubEnv("VITE_DISABLE_AI", value);
      const fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ...fallbackEvents[0], source: "AI 生成" }),
      });
      vi.stubGlobal("fetch", fetch);
      expect((await requestCard("event")).source).toBe("AI 生成");
      expect(fetch).toHaveBeenCalledWith("/api/event", expect.any(Object));
    },
  );
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
  it.each(["event", "quiz"] as const)(
    "%s 在 6000ms 超时后自动回退",
    async (kind) => {
      vi.useFakeTimers();
      vi.stubGlobal(
        "fetch",
        (_url: unknown, opts: RequestInit) =>
          new Promise((_resolve, reject) =>
            opts.signal?.addEventListener("abort", () =>
              reject(Error("abort")),
            ),
          ),
      );
      const settled = vi.fn();
      const result = requestCard(kind).then((card) => {
        settled();
        return card;
      });
      await vi.advanceTimersByTimeAsync(5999);
      expect(settled).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(settled).toHaveBeenCalledOnce();
      expect((await result).source).toBe("题库");
    },
  );
});
