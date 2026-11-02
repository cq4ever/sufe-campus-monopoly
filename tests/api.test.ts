import { describe, it, expect, vi, afterEach } from "vitest";
import type { IncomingMessage, ServerResponse } from "node:http";
import handler from "../api/event";
import { validEvent, validQuiz } from "../src/lib/cards";
import { fallbackQuiz } from "../src/data/fallbackQuiz";
async function call(body: unknown, method = "POST") {
  let status = 200;
  let value: any;
  const headers: Record<string, string> = {};
  const res = {
    setHeader: (key: string, v: string) => {
      headers[key] = v;
    },
    set statusCode(v: number) {
      status = v;
    },
    end: (text: string) => {
      value = JSON.parse(text);
    },
  } as unknown as ServerResponse;
  await handler({ method, body } as IncomingMessage & { body?: unknown }, res);
  return { status, value, headers };
}
describe("Serverless AI endpoint", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
  it("限制方法和输入类型", async () => {
    expect((await call({}, "GET")).status).toBe(405);
    expect((await call({ type: "unknown" })).status).toBe(400);
    expect((await call("{bad")).status).toBe(400);
  });
  it("没有密钥直接返回合法题库", async () => {
    vi.stubEnv("LLM_API_KEY", "");
    const result = await call({ type: "event" });
    expect(result.status).toBe(200);
    expect(result.value.source).toBe("题库");
    expect(validEvent(result.value)).toBe(true);
  });
  it("校验AI输出并标注来源", async () => {
    vi.stubEnv("LLM_API_KEY", "test-key");
    vi.stubGlobal("fetch", async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(fallbackQuiz[0]) } }],
      }),
    }));
    const result = await call({ type: "quiz" });
    expect(result.value.source).toBe("AI 生成");
    expect(validQuiz(result.value)).toBe(true);
  });
  it("越界金额不能从模型进入游戏", async () => {
    vi.stubEnv("LLM_API_KEY", "test-key");
    vi.stubGlobal("fetch", async () => ({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: "事件",
                text: "测试",
                money: 201,
              }),
            },
          },
        ],
      }),
    }));
    const result = await call({ type: "event" });
    expect(result.value.source).toBe("题库");
    expect(validEvent(result.value)).toBe(true);
  });
  it("无效JSON使用兜底", async () => {
    vi.stubEnv("LLM_API_KEY", "test-key");
    vi.stubGlobal("fetch", async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "```不是JSON```" } }],
      }),
    }));
    expect((await call({ type: "quiz" })).value.source).toBe("题库");
  });
  it("模型请求在6秒时中止并兜底", async () => {
    vi.useFakeTimers();
    vi.stubEnv("LLM_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      (_url: unknown, opts: RequestInit) =>
        new Promise((_resolve, reject) =>
          opts.signal?.addEventListener("abort", () =>
            reject(Error("aborted")),
          ),
        ),
    );
    const result = call({ type: "event" });
    await vi.advanceTimersByTimeAsync(6000);
    expect((await result).value.source).toBe("题库");
  });
});
