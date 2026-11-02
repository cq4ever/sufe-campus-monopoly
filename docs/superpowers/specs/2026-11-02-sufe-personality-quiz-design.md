# 上财人格测试 MVP

用户已于本会话确认设计并授权实现、测试、提交、推送及创建 PR；禁止合并或推送 main。

将校园大富翁替换为 Vite + React + TypeScript 手机网页测试。采用纯 CSS，仅新增 html-to-image、qrcode 运行依赖，测试继续用 Vitest。

首页 → 15 题逐题答题 → 结果；答案和进度在 localStorage 恢复，支持上题和重测。题库、16 类型及界面文案集中到 src/data。题目与人格名称、roast、share 使用原提示逐字内容；未提供的每类三个标签按含义补写，subtitle 兜底为空。

本地纯函数计分：J/N/F 各 4 题、P 3 题，选项 +2/+1/-1/-2，零分取该维度首题正负。雷达归一化 0–100；夜猫按四道标记题所选命中数 /4×100。仅绘图将最小值提升至 5。

结果卡为竖版 3:4，奶油底色、珊瑚橙和深蓝，包含名称、代号、副标题、SVG 雷达、吐槽、标签、分享语、二维码、AI/经典角标、仅供娱乐。统计位置隐藏，绝不显示假数字。等待字体与二维码完成后 toPng，弹层长按保存；非微信可下载。

选择即时预设卡 + 异步 AI 更新，避免等待接口；不采用服务端决定人格或 AI 失败阻断结果的方案。api/result.ts 调用 OpenAI 兼容服务，默认 DeepSeek；8 秒超时，严格 JSON 与长度校验，每 IP 每分钟 5 次，CORS 只允许 Pages 来源和配置的本站域名。Key 仅服务端。

保留 deploy-pages.yml 以及 Pages base 和禁用 AI 构建。Vercel 默认根路径，Serverless API；更新 vercel.json、环境示例、README。分支 feat/sufe-personality-quiz 从最新 main 创建，验证通过后 push 并开 PR 到 main，不合并。
