# 上财人格测试

手机网页娱乐小测试：15 道上财校园日常题、16 种人格、可分享的 3:4 结果卡。Vite + React + TypeScript，纯 CSS、自绘 SVG 雷达图。运行依赖仅 React、React DOM、html-to-image、qrcode。非官方校园项目，结果仅供娱乐。

## 本地运行

使用 Node.js 20+：

```bash
npm ci
npm run dev
```

打开 Vite 输出地址。答案与当前进度保存在当前浏览器、当前域名的 localStorage，刷新可继续；存档损坏会安全重置，存储不可用时仍可答题。重新测试会清空本次答案。返回上题后修改答案，会清除后续答案，以新的选择继续。

Vite 开发服务器只运行前端，不提供 `/api/result`；接口不存在时自动展示经典版。纯本地无请求运行：

```bash
VITE_DISABLE_AI=true npm run dev
```

同时运行前端与 Vercel Serverless Function：

```bash
cp .env.example .env.local
# 只在本地文件中填写服务端变量，切勿提交密钥
npx vercel dev
```

Vercel CLI 需要登录并关联项目，使用其输出的地址访问。

```bash
npm test
npm run build
npm run dev
```

## 环境变量

`.env.local` 已被忽略；也可在 Vercel Settings → Environment Variables 设置。修改 `VITE_` 变量后需要重新构建。

| 变量              | 用途与默认值                                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| `LLM_API_KEY`     | **仅服务端**。OpenAI 兼容服务密钥；不配置时 API 返回 `{fallback:true}`                                                |
| `LLM_BASE_URL`    | **仅服务端**，默认 `https://api.deepseek.com`；填 API 根地址，不带 `/chat/completions`，其他服务如有 `/v1` 需自行包含 |
| `LLM_MODEL`       | **仅服务端**，默认 `deepseek-chat`                                                                                    |
| `VITE_API_BASE`   | 公开配置。默认空字符串，即同源 `/api/result`；前后端分离时填 API 域名，可带路径前缀                                   |
| `VITE_SITE_URL`   | 公开配置。二维码的完整网站地址；缺省使用当前页面 URL。服务端也读取其 origin 作为 CORS 允许来源                        |
| `VITE_DISABLE_AI` | 公开配置。仅字符串 `true` 完全跳过 AI 请求；默认启用 AI 并允许失败兜底                                                |

**绝不能用任何 `VITE_` 变量存储 Key。** `LLM_*` 只由 `api/result.ts` 读取，不进入浏览器代码。本站不用外部字体、图片或分析统计脚本。测试不收集姓名、学号；启用 AI 时会向配置的服务发送人格代号、维度分数和 15 个选项文字；经典版不发送答题请求。二维码生成和图片导出都在本地完成。

## GitHub Pages

地址：https://cq4ever.github.io/sufe-campus-monopoly/

仓库 Settings → Pages → Source 选择 **GitHub Actions**。保留的 `.github/workflows/deploy-pages.yml` 在推送 `main` 后依次运行 `npm ci`、测试、构建和 Pages 部署；也支持手动运行。功能分支 PR 不会直接部署线上。

构建使用 `GITHUB_PAGES=true`（资源 base 为 `/sufe-campus-monopoly/`）和 `VITE_DISABLE_AI=true`（完全不请求 API，显示经典版）。Pages 只提供静态文件，无需密钥或后端。验证方式：

```bash
GITHUB_PAGES=true VITE_DISABLE_AI=true npm run build
GITHUB_PAGES=true npm exec vite preview -- --host 0.0.0.0
# 打开 http://localhost:4173/sufe-campus-monopoly/
```

二维码未配置时使用当前地址，包含正确的 Pages 子路径。自定义 `VITE_SITE_URL` 时也要包含 `/sufe-campus-monopoly/`。

## Vercel

1. Import Git Repository，选择本仓库，Framework Preset 为 Vite。
2. Build Command：`npm run build`；Output Directory：`dist`。
3. 不设置 `GITHUB_PAGES`，资源 base 为 `/`；不设置 `VITE_DISABLE_AI=true`。
4. 可选配置上述 `LLM_*`。设置 `VITE_SITE_URL=https://你的站点域名/`，供二维码和 CORS 使用；同源部署 `VITE_API_BASE` 留空。
5. Deploy。`api/result.ts` 自动成为 `/api/result` Node Serverless Function；`vercel.json` 将函数最大时长设为 10 秒，代码中模型请求 8 秒超时。

未配置 Key 或供应商不可用时仍可完成测试。跨域请求只允许 `https://cq4ever.github.io`、`VITE_SITE_URL` 的精确 origin，以及 Vercel 提供的本站预览/生产域名；不使用通配符。自定义域名应正确设置 `VITE_SITE_URL`。预检允许 POST 和 Content-Type；不计入限流。

同一 IP 每 60 秒最多 5 次有效 POST，超限返回 429 和 `{fallback:true}`。使用内存 Map，冷启动或多实例之间不共享，因此只是 MVP 的简单限流，不是全局持久配额。

## 计分与文案

`src/quiz/score.ts` 是纯函数：选项依次 +2、+1、−1、−2，每题只影响一个维度。J/T（卷/躺）、N/K（社牛/社恐）、F/Y（干饭/养生）、P/S（计划/随缘），正分取前者，负分取后者；零分由本维度第一题所选选项的正负决定。

J/N/F 满分为 8，P 满分为 6，雷达值为 `round((总分+满分)/(2×满分)×100)`。夜猫标记位于第 1、4、10、15 题，所选标记数除以 4 再乘 100。雷达绘图最低 5，文字仍显示真实 0–100 值。

```text
POST /api/result
{code, scores: {J, N, F, P, night}, picks: [15 个选项文字]}
```

`scores.night` 是原始命中数 0–4，其他维度是原始总分；归一化雷达值不会作为总分提交。服务端核对选项与分数/类型一致，再调用模型，AI 只写文案，不能决定类型。服务端与客户端共用结构/长度校验，长度按 Unicode 字符计；服务端校验函数也从 `api/result.ts` 单独导出。

结果页立即显示本地预设，AI 合法响应后更新为「AI 定制」。错误、非法 JSON/字段、超时、限流、`fallback` 均保留「经典版」。客户端 9 秒总超时，覆盖读取响应体；离开结果页取消请求并忽略旧响应。

## 保存与分享

手机结果卡按正常字号自适应排版，不缩放整张卡片；小字至少 12px，雷达标题和扫码说明使用横排。页面和卡片均解释四字母代码的中文含义；保存时使用独立的 600×800 画布，导出比例仍为 3:4。

结果卡包含名称、代号、可选副标题、5 项雷达、吐槽、3 个标签、分享语和网站二维码。没有真实统计前，同类比例位置隐藏，不展示任何数字。

「保存图片」等待 `document.fonts.ready` 与二维码图像就绪，再由 html-to-image 导出 1200×1600 PNG。弹层提示「长按图片保存或分享」；微信浏览器仅提供长按，其他浏览器同时提供下载。导出失败可重试，也可截图。各手机浏览器的长按菜单由系统决定。

## 修改题目与文案

- `src/data/questions.ts`：15 道题、选项分值与夜猫标记
- `src/data/types.ts`：恰好 16 种人格、名称、预设 roast/tags/share，兜底 subtitle 为空
- `src/data/copy.ts`：集中管理界面与雷达标签文案
- `src/data/ai.ts`：AI system prompt 的语气、地点白名单和内容限制
- `src/quiz/`：计分和存档校验；`src/lib/`：文案校验、AI 客户端、总超时
- `src/components/`：SVG 雷达、3:4 结果卡、二维码与图片弹层
- `api/result.ts`：服务端调用、校验、CORS、限流

Vitest 覆盖全 A/全 D、维度平局、夜猫、雷达范围、全部 16 类型可达且唯一、存档校验、AI 禁用/失败/超时/合法响应、JSON 字段长度、API 输入、限流与 CORS，以及雷达零值的可见绘图。
