---
name: script2manga
description: 把纯文字剧本/故事片段转换成手绘风格漫画分镜的完整流程——解析场景与对白、切分漫画分镜格、维护角色与场景设定表以保证多格之间的视觉一致性，生成可直接喂给任意出图模型的手绘风格 prompt，并给出漫画页版式（每格位置、对话气泡摆放）的结构化元数据。当用户提到"把剧本/小说片段/故事做成漫画"、"生成分镜"、"手绘风格漫画"、"comic/manga adaptation"、"剧本转漫画"、"故事板/storyboard"之类的诉求时，即使没有点名这个 skill，也应该主动使用它来做剧本解析和分镜设计，而不是临时手写一次性的正则或直接把整段剧本丢给出图模型。
---

# script2manga

把文字剧本变成手绘风格漫画，核心难点不在"出图"，而在"出图之前"：怎么把一段
连续的文字切成一格格有节奏的画面、怎么让同一个角色在第 3 格和第 8 格看起来
是同一个人。这个 skill 只负责这部分——解析、分镜、一致性、prompt 生成、
版式设计，全部产出结构化文本/JSON。**它不调用任何图像生成 API**，实际出图
交给你（Claude）当前会话里可用的图像工具，或者用户已有的出图管线。

先读 `prompt/system_prompt.md`，把里面描述的"漫画分镜师"心态代入——尤其是
"一致性优先于单格美观"和"手绘感是硬性要求"这两条，是这个 skill 存在的意义。

## 目录结构

```
script2manga/
├── SKILL.md                      # 本文件
├── README.md                     # 面向人类开发者的项目说明
├── config.yaml                   # 默认参数（风格、目标格数、设定表路径…）
├── prompt/
│   ├── system_prompt.md          # 你的角色设定 / 工作心态
│   ├── storyboard_prompt.md      # 单格 prompt 的模板（{style}/{framing}/... 占位符）
│   └── manga_style.md            # 手绘风格库（## 标题 = 风格名，正文 = 描述词）
├── parser/
│   ├── screenplay_parser.py      # 剧本文本 -> Scene 列表（场景/动作/对白，保留原文顺序）
│   ├── shot_splitter.py          # Scene -> Shot 列表（漫画分镜格 + 建议景别）
│   ├── character_bible.py        # 角色外观设定表，保证多格间人物一致
│   └── scene_bible.py            # 场景/地点设定表，保证多格间环境一致
├── renderer/
│   ├── style_controller.py       # 加载 manga_style.md，按名字取风格描述词
│   ├── prompt_generator.py       # Shot + 设定表 + 风格 -> 最终 prompt / negative_prompt / 气泡文字
│   └── page_layout.py            # 分镜 -> 漫画页版式元数据（格子位置、气泡位置，JSON）
└── examples/
    └── sample_script.md          # 可直接跑一遍流程的示例剧本
```

## 完整流程

```python
import sys
sys.path.insert(0, "<script2manga 根目录的绝对路径>")  # 或者直接 cd 到这里再跑

import yaml
from parser.screenplay_parser import parse_script
from parser.shot_splitter import split_scene_into_shots
from parser.character_bible import CharacterBible
from parser.scene_bible import SceneBible
from renderer.style_controller import StyleController
from renderer.prompt_generator import build_all, to_json as prompts_to_json
from renderer.page_layout import layout_pages, to_json as layout_to_json

config = yaml.safe_load(open("config.yaml", encoding="utf-8"))

# 1. 解析剧本 -> 场景列表（自动识别 INT./EXT. 或"场景N：地点-时间"两种标题格式）
scenes = parse_script(open("<用户剧本路径>", encoding="utf-8").read())

# 2. 切分漫画分镜格（保留原文动作/对白的时间顺序，不会打乱因果关系）
shots, location_by_scene = [], {}
for scene in scenes:
    location_by_scene[scene.index] = scene.location
    shots.extend(split_scene_into_shots(scene, target_shots=config["target_shots_per_scene"]))

# 3. 构建角色/场景设定表（这一步是草稿，务必看一眼再往下走，见下方"关于设定表"）
character_bible = CharacterBible.build_from_scenes(scenes)
scene_bible = SceneBible.build_from_scenes(scenes)
character_bible.save(config["character_bible_path"])
scene_bible.save(config["scene_bible_path"])

# 4. 选风格、生成每一格的最终 prompt
style_ctrl = StyleController(config["manga_style_path"], default_style=config["default_style"])
panel_prompts = build_all(
    shots, character_bible, scene_bible, style_ctrl.get(),
    location_by_scene=location_by_scene, template_path=config["storyboard_prompt_path"],
)

# 5. 计算漫画页版式（格子相对坐标 + 对话气泡建议位置，纯 JSON，不涉及像素）
pages = layout_pages(shots, panel_prompts, panels_per_page=config["panels_per_page"])

open(config["output"]["prompts_path"], "w", encoding="utf-8").write(prompts_to_json(panel_prompts))
open(config["output"]["layout_path"], "w", encoding="utf-8").write(layout_to_json(pages))
```

跑完这一步，你手上有：每一格的最终出图 prompt（`panel_prompts.json`）+ 每一页
的版式坐标和气泡位置（`page_layout.json`）。接下来该做的是：**逐格调用你当前
可用的图像生成能力**，把 `prompt`/`negative_prompt` 喂进去拿到图片，再按
`page_layout.json` 里的 `bbox` 把图片摆到对应位置、按 `bubble_positions` 加
对话气泡文字——这一步page_layout 只给"设计图"，具体怎么合成最终页面图片
（要不要用 Pillow、要不要走前端渲染）留给你根据当前环境判断。

## 关于设定表（character_bible / scene_bible）：草稿，不是终稿

`CharacterBible.build_from_scenes()` 和 `SceneBible.build_from_scenes()` 只能
从剧本原文里抓"看起来像外观描述"的句子（关键词匹配"穿着"、"留着"、"戴着"等），
命中率有限——很多剧本压根不会写清楚角色长什么样。这是预期行为，不是 bug。

产出草稿之后，正确的做法是：把 `character_bible.json` / `scene_bible.json`
的内容展示给用户看一眼，问一句要不要补充外观细节（比如"李明大概什么年纪、
穿什么"），把回答写回对应的 `appearance`/`description` 字段再继续往下走。
跳过这一步直接生成 60 格漫画，大概率会得到 60 个长得不一样的"李明"。

## 风格与 prompt 模板都是可编辑的文本文件，不是代码

想加一种新的手绘风格：去 `prompt/manga_style.md` 加一个 `## 风格名` 小节，
写清楚线条/上色/构图特征即可，`style_controller.py` 会自动识别，不用碰代码。

想调整最终 prompt 的措辞结构：改 `prompt/storyboard_prompt.md`，保留
`{style}` `{framing}` `{setting}` `{characters}` `{action}` `{dialogue_instruction}`
这几个占位符即可，`prompt_generator.py` 会用 `str.format()` 填充它们。

## 快速试跑

`examples/sample_script.md` 是一份可以直接拿来跑通整条流程的中文示例剧本
（码头悬疑场景，混合了 INT./EXT. 标题、情绪批注对白、突发动作描述），用来验证
环境装好了 `pyyaml`、流程能跑通，比直接拿用户的真实剧本第一次试错更省时间。
