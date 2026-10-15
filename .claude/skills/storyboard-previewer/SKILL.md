---
name: storyboard-previewer
description: 把已确认的 AI 影片分镜（通常来自 seedance-live-action-film-director 的信息清单表或八模块提示词）做成可播放的分镜动态预览页：简化人偶按时间轴演出每一镜的走位、景别、运镜、灯光与特效，附俯视走位图、越轴检查、分镜表和【CAMERA】导出。当用户说"预览分镜""分镜动画/动态分镜""把分镜做成可以看的预览""看看镜头效果""animatic"时使用。
---

# 分镜动态预览台

模板在仓库 `tools/storyboard-previewer/index.html`，数据格式见同目录 `SCHEMA.md`。

## 两种用法

- **用户自己导入剧本**：发布后的页面里有「剧本 → 分镜」区，任何剧本粘贴或打开文件即可按场次生成预览；在 claude.ai 中打开时还能点「Claude 拆镜」由页面直接调用 Claude（发布时须声明 `capabilities: {sample: {}}`）。用户只要工具本身时，直接发布模板即可。
- **在对话里由 Claude 拆镜**：按下面的流程把确认过的分镜写成 JSON 填入模板。

## 流程

1. **先有确认过的分镜。** 若还没有，按 `seedance-live-action-film-director` 的流程与导演讨论出信息清单表；预览不替代那次讨论。
2. **把分镜写成 JSON。** 严格按 `SCHEMA.md`：
   - 每一镜对应清单表的一行：`dur`、`lens`、`size`、`angle`、`info`（一镜一信息）、`q`（留下的问题）、`action`、`audio`。
   - 运镜默认 `handheld`，写清 `hh` 强度与 `settle` 落定时刻；`static`/稳定运镜只用于导演确认过的镜头。
   - 攻击按"意图—动作—结果—反应"拆镜：动作镜短，结果与反应镜长；用 `fx` 标出接触瞬间。
   - 手、刀、眼睛、烛火等因果物与转折用 `view: "insert"`；局势用全景，必要时用 `view: "plan"` 高机位俯视。
   - 为每个实景镜头填 `plan.cam` 与 `plan.actors`，让页面检查越轴；同一场人物的左右关系保持一致。
   - 视觉线 `meta.line` / `shot.line` 与剧本标记一致（A 影戏线、B 现实线、C 回忆线）。
3. **生成页面。** 复制模板，只替换 `<script type="application/json" id="storyboard-data">` 里的 JSON（保持合法 JSON，不加注释），其余代码不改。用 Artifact 工具发布，并声明 `capabilities: {sample: {}}`（或把文件交给用户本地打开，本地只能用快速拆镜）。
4. **交付后**，告诉导演可以在页面「分镜数据」里直接改数值重演，在「提示词导出」里复制信息清单表与【CAMERA】骨架；正式八模块仍按导演技能完整写出。

## 注意

- 预览是走位与节奏的示意，人偶不代表最终造型、表演和画面质感。
- 不在页面里写影片名、导演或摄影师姓名。
