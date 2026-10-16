# 镜坊 · AI 影视工作台

一个全新 UI 的「AI 影视 / 短剧 / 漫剧」一站式工作台，按 **创意 → 剧本 → 画风 → 角色与场景资产 → 智能分镜 → 分镜配图 / 图生视频 / 配音 → 成片合成** 的流程组织。

## 快速开始

```bash
cd studio
npm install
npm run dev        # 同时启动后端 :8787 和前端 :5180，打开 http://localhost:5180
```

生产部署（后端同时托管构建好的前端，只需开放一个端口）：

```bash
npm run build
STUDIO_TOKEN=换成你的口令 npm start      # http://<服务器>:8787
```

## 架构：所有模型 API 请求都在后端

```
浏览器（镜坊 UI）  ──同源 /api──▶  镜坊后端 server/  ──▶  七七八AI（即梦 5.0 Pro）
                                                      ├─▶  fal（Qwen-Image / FLUX.1-schnell / Wan2.2-5B）
                                                      └─▶  Gemini（剧本 / 生图 / Veo / TTS）
```

- 前端只请求同域的 `/api`：开发时由 Vite 代理到后端，生产时后端直接托管前端页面，所以**不存在跨域问题**。前端代码里不包含任何模型 SDK 或第三方 API 地址。
- **API Key 只在服务端**：在网页「设置」里填写后，由后端用 AES-256-GCM 加密保存到 `.data/settings.json`。接口只返回 `••••末四位`，不会把明文回传给前端。也可以用环境变量 `GEMINI_API_KEY` / `FAL_KEY` / `LK888_API_KEY` 提供 Key。
- **任务记录**：生图、视频、配音都在后端异步执行。任务记录保存在 `.data/jobs.json`，生成结果保存在 `.data/results/`（默认保留 14 天）。服务重启时，未完成的任务会被标记为中断。
- **重复提交防护**：同一个请求还在排队或运行时，再次提交会直接返回已有任务，不会重复计费。
- **访问口令**：设置 `STUDIO_TOKEN` 后，所有 `/api` 请求都必须带口令。公开部署时务必设置，否则任何人都能消耗你的额度。
- 演示引擎完全在浏览器本地运行，不需要后端；后端未启动时，界面会提示并自动退回演示模式。

可配置的环境变量见 [`.env.example`](.env.example)。

### 后端接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/health` | 健康检查（无需口令） |
| GET / PUT | `/api/settings` | 读取 / 修改引擎、模型、Key（Key 只写不读） |
| POST | `/api/text` | 剧本、改编、资产提取、分镜、润色（同步返回 JSON） |
| POST | `/api/jobs` | 提交生图 / 视频 / 配音任务 |
| GET | `/api/jobs`、`/api/jobs/:id` | 任务记录与状态 |
| GET | `/api/jobs/:id/result` | 下载生成结果 |
| GET | `/api/public/refs/:name` | 临时公开参考图，供第三方平台拉取（随机地址、过期删除、无需口令；仅在设置 `PUBLIC_BASE_URL` 时使用） |

### 引擎

- **演示模式**（默认）：完全离线，在本地生成剧本和分镜，用 Canvas 渲染占位画面、推拉动效视频和配音占位音，不填 Key 也能跑完整条流程。

「设置」里可以给 **剧本 / 生图 / 视频 / 配音** 分别选择引擎：

| 能力 | 可选引擎 |
|---|---|
| 剧本 / 分镜 | Gemini（`gemini-2.5-flash`，JSON 输出）· 演示 |
| 生图 | **即梦 5.0 Pro**（七七八AI `doubao-seedream-5-0-pro-260628`）· **Qwen-Image**（`fal-ai/qwen-image`）· **FLUX.1-schnell**（`fal-ai/flux/schnell`）· Gemini Image（支持参考图）· 演示 |
| 视频 | **Wan2.2-5B**（`fal-ai/wan/v2.2-5b/text-to-video`、`/image-to-video`）· Veo 3.1 Fast · 演示 |
| 配音 | Gemini TTS · 演示 |

- **即梦 5.0 Pro（七七八AI）**：由后端调用 `https://api.lk888.ai/v1/media/generate` 创建任务，再轮询 `/v1/media/status`；以 `is_final` 判断是否结束，以 `state` 判断成功还是失败（失败时平台会自动退款）。
  - 支持多图融合：分镜配图会按顺序带上出镜角色的定妆图和场景图（最多 10 张，首张免费、第 2 张起按张计费），并在提示词里说明「图 1 = 某角色」。
  - 「设置」里可以切换 1K / 2K 分辨率档位（两档价格不同）和模型 ID；宽高比自动取项目画幅。任务完成后，平台返回的费用会记录在任务记录里。
  - 参考图默认以 data URI 内联发送。如果平台只接受公网 URL，请在服务器上设置 `PUBLIC_BASE_URL`（本服务的公网地址），后端会把参考图放到临时公开地址（默认 60 分钟后删除）供平台拉取。
- **开源模型（fal）**：Qwen-Image、FLUX.1-schnell、Wan2.2-5B 这三个模型都是 Apache 2.0 许可，由后端通过 fal 队列接口在云端运行。需要填写 fal API Key，并且账号里要有额度。
  - Qwen-Image / FLUX.1-schnell 是纯文生图模型，不读取参考图，角色一致性靠资产里的视觉提示词。
  - Wan2.2-5B 单镜 1–5 秒（24fps，17–121 帧），720p，支持 16:9 / 9:16 / 1:1。有分镜图时走图生视频，没有时走文生视频；超过 5 秒的镜头会被截短到 5 秒。

## 功能模块

| 步骤 | 功能 |
|---|---|
| 01 故事 | 创意成剧（一句话 → N 集剧本）、小说改编（粘贴 / 导入 TXT → 分集）、手动编写、逐集 AI 润色（钩子、冲突、口语化、卡点…） |
| 02 画风 | 8 种画风预设（国漫厚涂、日系、写实电影、3D、水墨、赛博、韩漫、黏土）+ 自定义追加描述、画幅 9:16 / 16:9 / 1:1、样张试生成 |
| 03 资产 | 从全部剧本中自动提取角色与场景，生成定妆图 / 场景概念图，支持上传替换、锁定设定、角色音色 |
| 04 分镜 | AI 一键分镜：景别、运镜、画面、说话人、台词、时长、出镜角色、场景；可排序、复制、插入、删除 |
| 05 制作 | 逐镜或批量：分镜配图（自动带入角色和场景参考图）、图生视频、配音；任务队列限制并发，失败可重试 |
| 06 成片 | 时间线预览（字幕 + 配音）、浏览器内实时合成整集 WebM（推拉动效 + 淡入淡出 + 字幕 + 配音音轨）、导出 SRT / 分镜脚本 Markdown / 工程 JSON |

## 技术结构

```
shared/                 前后端共享：类型、提示词
server/
  index.ts              HTTP 服务：/api 路由、访问口令、托管前端
  settings.ts           设置与 Key（加密存储，只写不读）
  crypto.ts             AES-256-GCM
  jobs.ts               任务队列：并发限制、去重、记录与结果持久化
  providers/gemini.ts   Gemini / Veo / TTS
  providers/fal.ts      fal 队列：Qwen-Image / FLUX.1-schnell / Wan2.2-5B
  providers/lk888.ts    七七八AI：即梦 5.0 Pro
  publicRefs.ts         临时公开参考图（可选）
src/
  services/api.ts       前端唯一的网络出口（同域 /api）
  services/ai.ts        按引擎组合：演示 → 本地，其它 → 后端
  services/demo.ts      离线演示实现
  lib/db.ts             IndexedDB：工程 JSON + 媒体 Blob
  lib/render.ts         Canvas + MediaRecorder 整集合成
  store/                zustand 状态、前端任务队列、流程动作
  pages/                Home + Workspace 六个步骤页面
```

工程数据（剧本、分镜、已生成的媒体）保存在浏览器的 IndexedDB 中；Key、任务记录和生成结果原件保存在后端的 `.data/` 目录中。
