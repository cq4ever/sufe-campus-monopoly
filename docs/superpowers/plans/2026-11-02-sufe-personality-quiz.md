# 上财人格测试 Implementation Plan

> 执行：superpowers:executing-plans；用户已确认在当前会话完成全部实施和 PR，无需再次确认。

**Goal:** 用可恢复的 15 题人格测试替换大富翁，并保留 Pages 和 Vercel 部署。
**Architecture:** 本地纯函数计分，数据与文案集中管理，预设结果立即显示，AI 异步增强。API 和前端共用文案结构校验。
**Tech Stack:** Vite / React / TypeScript / CSS / Vitest / html-to-image / qrcode。
**Spec:** ../specs/2026-11-02-sufe-personality-quiz-design.md，以及用户原提示的逐题及逐类型内容。

## Global Constraints

- 只提交 feat/sufe-personality-quiz，不推 main，不合并 PR。
- 不新增 UI/图表库；不暴露 LLM Key；不编造同类百分比。
- 保留 deploy-pages.yml 构建变量和 /sufe-campus-monopoly/ base。

## Review Focus

- 损坏/不可用 localStorage 安全恢复，不阻断答题。
- 返回上一题修改后，结果和 AI 请求使用最新答案，旧响应不得覆盖。
- 图片导出等待二维码和字体，失败允许重试。
- CORS 域名严格匹配、预检不消耗限流；无效输入不调用模型。
- AI 8 秒超时、前端超时包括读取响应体，并清理定时器。

## Task 1: 题库、计分和存档

Files: src/data/questions.ts, types.ts, copy.ts; src/quiz/score.ts, storage.ts; src/quiz/*.test.ts。
Interfaces: scoreQuiz(answers: number[]) → {code,scores,radar}; questions 15 条；personalityTypes 16 条。

- [x] 写测试：A→JNFP、D→TKYS、各维度零分首题正负、雷达范围、夜猫 0/25/100、全部16类型可达、非法答案、损坏存档。
- [x] npm test -- src/quiz：观察缺失实现导致失败。
- [x] 实现题库、16 类预设、纯计分与校验存档；通过上述测试。

## Task 2: AI 客户端和 API

Files: src/lib/resultCopy.ts, aiClient.ts, *.test.ts; api/result.ts; tests/api.test.ts。
Interfaces: validateResultCopy(value) 类型守卫；requestAiResult(payload) → 文案与 source；API handler POST /api/result。

- [x] 写禁用零请求、失败/超时/非法响应兜底、成功、长度、IP限流、CORS、默认模型及请求格式测试。
- [x] 运行并确认缺失实现失败，再实现 shared validator、客户端和 Node handler。
- [x] 运行全部 Vitest，观察通过。

## Task 3: 页面与图片

Files: src/App.tsx, components/Radar.tsx, ResultCard.tsx; src/main.tsx, style.css; src/data/copy.ts。

- [x] 首页/单题/进度/上一题/结果/重测，恢复与持久化；预设立即展示、异步 AI 取消旧响应。
- [x] 3:4 卡、SVG 雷达、qrcode、字体就绪后的图片导出、微信与普通下载分支、无障碍弹层。
- [x] 删除旧 game、board、cards、api/event.ts 及旧测试。
- [x] npm test 与 npm run build，能用浏览器时检查375px流程和导出。

## Task 4: 部署与交付

Files: README.md, .env.example, vercel.json, index.html, package*.json。

- [x] 文档说明两种部署、配置变量、隐私与娱乐说明；保留 Pages 工作流。
- [x] npm test、npm run build、Pages 模式 build；检查前端产物不含密钥配置。
- [x] 全分支审查，修复重要问题；commit、push 功能分支，创建 PR 并报告链接及测试结果。
