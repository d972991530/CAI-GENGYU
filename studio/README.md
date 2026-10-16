# 镜坊 · AI 影视工作台

一个全新 UI 的「AI 影视 / 短剧 / 漫剧」一站式工作台，按 **创意 → 剧本 → 画风 → 角色与场景资产 → 智能分镜 → 分镜配图 / 图生视频 / 配音 → 成片合成** 的流程组织。

## 快速开始

```bash
cd studio
npm install
npm run dev        # http://localhost:5180
```

- **演示模式**（默认）：完全离线，本地「模型」生成剧本、分镜，用 Canvas 渲染占位画面、推拉动效视频和配音占位音，可以免 Key 跑完整条流程。

「设置」里可以给 **剧本 / 生图 / 视频 / 配音** 分别选择引擎，Key 只保存在本机浏览器：

| 能力 | 可选引擎 |
|---|---|
| 剧本 / 分镜 | Gemini（`gemini-2.5-flash`，JSON 输出）· 演示 |
| 生图 | **Qwen-Image**（`fal-ai/qwen-image`）· **FLUX.1-schnell**（`fal-ai/flux/schnell`）· Gemini Image（支持参考图）· 演示 |
| 视频 | **Wan2.2-5B**（`fal-ai/wan/v2.2-5b/text-to-video`、`/image-to-video`）· Veo 3.1 Fast · 演示 |
| 配音 | Gemini TTS · 演示 |

- **开源模型（fal）**：Qwen-Image、FLUX.1-schnell、Wan2.2-5B 这三个模型都是 Apache 2.0 许可，通过 fal 队列接口在云端运行。需要填写 fal API Key，并且账号里要有额度。
  - Qwen-Image / FLUX.1-schnell 是纯文生图模型，不读取参考图，角色一致性靠资产里的视觉提示词。
  - Wan2.2-5B 单镜 1–5 秒（24fps，17–121 帧），720p，支持 16:9 / 9:16 / 1:1。有分镜图时走图生视频，没有时走文生视频；超过 5 秒的镜头会被截短到 5 秒。
- **Gemini**：填写 Gemini API Key，或在 `studio/.env.local` 写入 `GEMINI_API_KEY=...`（这样会默认全部使用 Gemini）。

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
src/
  types.ts              数据模型：Project / Episode / Shot / Asset
  lib/db.ts             IndexedDB：工程 JSON + 媒体 Blob（图片 / 视频 / 音频）
  lib/render.ts         Canvas + MediaRecorder 整集合成
  services/ai.ts        Provider 接口 + 提示词
  services/gemini.ts    Gemini / Veo / TTS 实现
  services/demo.ts      离线演示实现
  store/store.ts        zustand 状态 + 有并发上限的生成任务队列
  store/actions.ts      各步骤的流程动作
  pages/                Home + Workspace 六个步骤页面
```

所有数据只存在浏览器本地（IndexedDB），不需要后端。
API Key 会在浏览器端直接调用 Gemini / fal，适合个人本地使用；如果要公开部署，建议加一层服务端代理来保管 Key。
