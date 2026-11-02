import type { IncomingMessage, ServerResponse } from "node:http";
import { board } from "../src/data/board";
import { fallbackEvents } from "../src/data/fallbackEvents";
import { fallbackQuiz } from "../src/data/fallbackQuiz";
import { validEvent, validQuiz } from "../src/lib/cards";
type Request = IncomingMessage & { body?: unknown };
export default async function handler(req: Request, res: ServerResponse) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  const send = (status: number, data: unknown) => {
    res.statusCode = status;
    res.end(JSON.stringify(data));
  };
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(405, { error: "请使用 POST" });
  }
  let body = req.body;
  try {
    if (typeof body === "string") body = JSON.parse(body);
  } catch {
    return send(400, { error: "JSON 格式错误" });
  }
  const kind = (body as { type?: unknown } | undefined)?.type;
  if (kind !== "event" && kind !== "quiz")
    return send(400, { error: "type 只能是 event 或 quiz" });
  const pool = kind === "event" ? fallbackEvents : fallbackQuiz;
  const fallback = () =>
    send(200, {
      ...pool[Math.floor(Math.random() * pool.length)],
      source: "题库",
    });
  if (!process.env.LLM_API_KEY) return fallback();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const base = (
      process.env.LLM_BASE_URL || "https://api.openai.com/v1"
    ).replace(/\/$/, "");
    const schema =
      kind === "event"
        ? '生成校园随机事件，结构 {"title":"短标题","text":"事件描述","money":整数}，money 必须在 -200 到 200 之间。'
        : '生成一道大一财经常识单选题，结构 {"question":"问题","options":["选项1","选项2","选项3","选项4"],"answer":0,"explain":"解析"}，answer 是0到3的正确选项索引。确保答案唯一且事实准确。';
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.LLM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || "gpt-4o-mini",
        temperature: 0.8,
        max_tokens: 600,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `你为《上财校园大富翁》生成健康友善的虚构游戏内容。只输出一个 JSON 对象，不要代码围栏。禁止生成真实师生姓名、个人信息、歧视、违法或其他不当内容；不得捏造学校政策。地点仅限上海财经大学这些地点：${board
              .filter((t) => !["event", "quiz"].includes(t.type))
              .map((t) => t.name)
              .join("、")}。文字简洁，单项不超过600字。${schema}`,
          },
          { role: "user", content: "请生成一张新卡片。" },
        ],
      }),
    });
    if (!response.ok) return fallback();
    const result = await response.json();
    const content = result?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return fallback();
    const card: unknown = JSON.parse(content);
    if (kind === "event" ? validEvent(card) : validQuiz(card))
      return send(200, { ...(card as object), source: "AI 生成" });
    return fallback();
  } catch {
    return fallback();
  } finally {
    clearTimeout(timer);
  }
}
