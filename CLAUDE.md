# 项目说明（Claude）

## 默认技能：AI 影片分镜头提示词

本项目中，凡是制作 **AI 影片 / AI 视频的分镜头提示词**（剧本拆镜、镜头脚本、Seedance / 即梦等视频模型提示词、结果修订），一律默认使用
`.claude/skills/seedance-live-action-film-director` 技能（Seedance 2.5 古代实拍电影导演），即使用户没有点名。

- 按技能流程执行：先理解剧本块并与导演讨论构想与信息清单表，确认后再输出八模块（【CONTEXT】…【约束】）中文提示词。
- 只有当用户明确要的是**手绘漫画分镜 / 漫画页**时，才改用 `.claude/skills/script2manga`。

## 分镜动态预览

分镜确认后，若需要"看看镜头效果"，用 `.claude/skills/storyboard-previewer` 把分镜写成 JSON 填进 `tools/storyboard-previewer/index.html`，生成可播放的预览页（数据格式见 `tools/storyboard-previewer/SCHEMA.md`）。页面本身也能直接导入任何剧本（.pdf / .docx / .txt / .md / .fountain，含竖屏短剧的「△」「旁白」格式）按场次生成预览，支持 9:16 竖屏和上传角色资产（定妆照/立绘按人物名匹配）；发布为 Artifact 时声明 `capabilities: {sample: {}}`，页面里的「Claude 拆镜」才可用。

## 桌面版与安卓版

`apps/storyboard-app` 把预览台打包成 Windows 安装包（Electron）和安卓 APK（Capacitor），构建由 `.github/workflows/storyboard-app.yml` 在 GitHub Actions 上完成。应用里的「Claude 拆镜」通过 `src/claude-bridge.js` 用用户自己的 API 密钥调用 Claude API。只需修改 `tools/storyboard-previewer/index.html`，应用会随之更新；改动页面时保留 `window.sbpNative`、`window.SBP_VENDOR` 两处挂钩以及 build-web.mjs 依赖的 Google Fonts 与 JSZip 标签。
