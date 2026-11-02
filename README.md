# 上财校园大富翁

移动优先、同屏轮流玩的校园棋盘小游戏。Vite + React + TypeScript、纯 CSS，游戏规则由纯函数 `useReducer` 驱动，localStorage 自动保存。无需 API Key 也可以完整游玩。

## 本地运行

```bash
npm i
npm run dev
```

打开终端显示的地址。`npm run dev` 只运行静态前端，访问 `/api/event` 失败会自动使用本地题库。手机可以访问同一局域网内电脑的 IP 和 Vite 端口。

完整测试前端与 Serverless Function：

```bash
cp .env.example .env.local
# 填入服务端变量（可选，不填使用题库）
npx vercel dev
```

Vercel CLI 可能需要先登录并关联项目。Vite 页面与 API 均通过 `vercel dev` 输出的地址访问。

```bash
npm run build
npm test
```

## 环境变量

只在 `.env.local` 或 Vercel 项目设置中配置：

| 变量           | 说明                                                                                     |
| -------------- | ---------------------------------------------------------------------------------------- |
| `LLM_API_KEY`  | OpenAI 兼容服务的密钥；不配置即返回本地题库                                              |
| `LLM_BASE_URL` | 默认 `https://api.openai.com/v1`，填写包含 `/v1` 的 API 根地址，不含 `/chat/completions` |
| `LLM_MODEL`    | 默认 `gpt-4o-mini`，按供应商填写                                                         |

**绝不使用 `VITE_` 保存密钥，也不要提交 `.env.local`。** 前端仅请求同源 `/api/event`，没有任何密钥或服务端配置。服务端 6 秒超时，前端 6.5 秒超时；错误、非 JSON、结构不符、数值越界均切换至本地内容。卡片标注「AI 生成」或「题库」。无外部字体、图片或 UI 库依赖。

## 部署到 Vercel

1. 将此仓库推送到 GitHub，Vercel 中选择 Add New Project 并导入。
2. Framework Preset 选择 Vite。Build Command 为 `npm run build`，Output Directory 为 `dist`。
3. 在 Settings → Environment Variables 配置上述三个变量（可不配置）。
4. Deploy。`api/event.ts` 会自动部署为 Node Serverless Function，无需独立后端。
5. 修改环境变量后重新部署。访问域名确认页面可开局；未设置密钥时 API 返回题库卡片属于正常行为。

也可在本目录使用 `npx vercel` 预览部署，`npx vercel --prod` 正式部署。

## 规则说明

- 2–4 人，每人现金 ¥1500。每回合掷一颗六面骰，逐格移动；经过或停留起点只奖励一次 ¥200。
- 无主地产可购买或跳过；停在他人地产付价格 20% 的租金，同色组 3 处全部集齐翻倍。
- 校园事件范围 −¥200 至 +¥200。财经题答对 +¥150，答错 −¥50，答题后显示解析并确认结算。
- 校医院下一个自己的回合休息一次；主体育馆休息；武东田径场 +¥100。
- 不设抵押、出售和拍卖，现金小于 0 立即出局，地产回归无主；现金为 0 可继续。
- 只剩一人、任何玩家现金达到 ¥5000，或完成 30 轮时结束。一轮是按座位顺序所有未出局玩家各完成一次回合（包括医院休息）。
- 30 轮按现金 + 地产原价选出胜者，允许并列。排名先列存活者，再列出局者，各组内按资产排序。
- 存档仅保存在当前浏览器与域名，刷新后继续；清除浏览器数据会删除存档。浏览器禁用存储时可玩，但无法保存；事件/题目未结算时刷新会重新抽卡，不重复结算。

## 目录

- `src/data/board.ts`：20 格棋盘及片区颜色
- `src/data/fallbackEvents.ts`：32 条校园事件
- `src/data/fallbackQuiz.ts`：32 道大一财经题
- `src/game/engine.ts`：纯 reducer、动作类型、租金与资产计算
- `src/game/storage.ts`：存档结构与状态一致性校验，损坏存档安全回退
- `src/game/engine.test.ts`：骰子、移动、购地、租金、破产、医院、胜利和回合边界测试
- `src/lib/cards.ts`：前后端共享结构校验及前端兜底请求
- `api/event.ts`：服务端 AI 请求、校验和兜底
- `tests/api.test.ts`：Serverless 输入、模型输出与超时验证
- `src/main.tsx`、`src/style.css`：设置、棋盘、操作台、卡片与结算

本项目是非官方校园主题娱乐游戏，不涉及真实金钱或学校政策。
