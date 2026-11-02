import { afterEach, expect, it, vi } from "vitest";
import { requestAiResult } from "./aiClient";
import { getPreset } from "../data/types";
const payload = {
  code: "JNFP" as const,
  scores: { J: 8, N: 8, F: 8, P: 6, night: 2 },
  picks: Array(15).fill("选项"),
};
const good = {
  subtitle: "绿叶常驻嘉宾",
  roast: "你的日程表比食堂菜单还满。",
  tags: ["日程达人", "干饭积极", "社交满格"],
  share: "今天也要快乐出发",
};
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
it("uses presets without any fetch when AI disabled", async () => {
  vi.stubEnv("VITE_DISABLE_AI", "true");
  const network = vi.fn(() => {
    throw new Error("must not request");
  });
  vi.stubGlobal("fetch", network);
  expect(await requestAiResult(payload)).toEqual({
    ...getPreset("JNFP"),
    source: "classic",
  });
  expect(network).not.toHaveBeenCalled();
});
it.each(["network", "http", "fallback", "malformed", "json"])(
  "falls back on %s failure",
  async (kind) => {
    vi.stubEnv("VITE_DISABLE_AI", "false");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        if (kind === "network") throw new Error("offline");
        if (kind === "http") return new Response("", { status: 503 });
        if (kind === "json") return new Response("not json");
        return Response.json(
          kind === "fallback" ? { fallback: true } : { ...good, tags: ["one"] },
        );
      }),
    );
    expect(await requestAiResult(payload)).toEqual({
      ...getPreset("JNFP"),
      source: "classic",
    });
  },
);
it("times out even if fetch ignores abort", async () => {
  vi.useFakeTimers();
  vi.stubEnv("VITE_DISABLE_AI", "false");
  vi.stubGlobal("fetch", () => new Promise(() => {}));
  const pending = requestAiResult(payload);
  await vi.advanceTimersByTimeAsync(9000);
  expect(await pending).toEqual({ ...getPreset("JNFP"), source: "classic" });
  expect(vi.getTimerCount()).toBe(0);
});
it("times out while reading a stalled response body", async () => {
  vi.useFakeTimers();
  vi.stubEnv("VITE_DISABLE_AI", "false");
  vi.stubGlobal("fetch", async () => ({
    ok: true,
    json: () => new Promise(() => {}),
  }));
  const pending = requestAiResult(payload);
  await vi.advanceTimersByTimeAsync(9000);
  expect((await pending).source).toBe("classic");
});
it("posts to configured API base and accepts valid AI copy", async () => {
  vi.stubEnv("VITE_DISABLE_AI", "false");
  vi.stubEnv("VITE_API_BASE", "https://example.test/");
  const network = vi.fn(async () => Response.json(good));
  vi.stubGlobal("fetch", network);
  expect(await requestAiResult(payload)).toEqual({ ...good, source: "ai" });
  expect(network).toHaveBeenCalledWith(
    "https://example.test/api/result",
    expect.objectContaining({ method: "POST", body: JSON.stringify(payload) }),
  );
});
