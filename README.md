<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## 镜坊 · AI 影视工作台（新）

`studio/` 目录是一个全新的一站式 AI 影视 / 短剧工作台：创意 → 剧本 → 画风 → 角色与场景 → 智能分镜 → 配图 / 视频 / 配音 → 成片。前端只访问同域 `/api`，所有模型调用（Gemini、fal、七七八AI）和 API Key 都在 `studio/server/` 后端。详见 [studio/README.md](studio/README.md)。

# K-Cinema（根目录应用）

## 架构：Gemini 请求全部在后端

```
浏览器 ──同源 /api──▶ server/index.ts ──▶ Gemini（文本 / 生图 / Veo 视频）
```

- 前端（`services/geminiService.ts`）只请求同域的 `/api`，不包含 Gemini SDK、接口地址或 API Key，因此**没有跨域问题**，Key 也不会被打包进前端 JS。
- `GEMINI_API_KEY` 只由后端读取（`.env.local`、`.env` 或环境变量）。
- 视频预演耗时较长，后端以异步任务执行，前端轮询 `/api/previs/:id`。
- 可选 `APP_TOKEN`：设置后所有 `/api` 请求都需要访问口令，前端会弹窗让你输入。
- 可选 `GEMINI_BASE_URL`：走自建中转或代理时使用。

## 本地运行

**前置条件：** Node.js 22+

1. 安装依赖：`npm install`
2. 在 `.env.local` 中写入 `GEMINI_API_KEY=你的Key`（只给后端用）
3. 开发：`npm run dev`（同时启动后端 :8788 和前端 :3000，打开 http://localhost:3000）
4. 生产：`npm run build && npm start`（后端在 :8788 同时托管前端页面）
