# script2manga

把文字剧本转换成手绘风格漫画分镜的 Claude Code 项目级技能（放在
`.claude/skills/script2manga/`，随仓库一起被 Claude Code 自动发现）。

给 Claude 使用的完整说明在 [`SKILL.md`](./SKILL.md)；这份 README 只写给
想直接读代码/复用模块的人类开发者。

## 这是什么

一条从"纯文字剧本"到"每一格漫画的出图 prompt + 版式坐标"的处理流水线：

```
剧本文本
  → screenplay_parser.py   (识别场景标题/动作描述/对白，保留原文顺序)
  → shot_splitter.py       (切分成漫画分镜格，标注建议景别)
  → character_bible.py / scene_bible.py   (人物与场景外观设定表，保证多格一致)
  → style_controller.py    (选一种手绘风格)
  → prompt_generator.py    (拼装最终出图 prompt + negative prompt + 对话气泡)
  → page_layout.py         (计算每页版式：格子位置、气泡位置，输出 JSON)
```

**没有 `image_generator.py`**：这个项目刻意只做到"生成 prompt"为止，不绑定
任何具体的图像生成 API。实际出图这一步由使用方（Claude 自身可用的图像工具，
或用户已有的 Gemini/Stable Diffusion 等出图管线）负责，`page_layout.py` 产出
的也只是版式*元数据*（每格的相对坐标、气泡建议位置），不做 Pillow 级别的像素
拼图——这样这套流水线才能在任何图像后端下复用。

## 本地跑一下

```bash
cd .claude/skills/script2manga
pip install pyyaml   # 唯一的第三方依赖，仅用来读 config.yaml
python3 -m parser.screenplay_parser examples/sample_script.md   # 单独看解析结果
python3 -m parser.shot_splitter examples/sample_script.md       # 单独看分镜结果
python3 -m renderer.style_controller prompt/manga_style.md      # 列出所有可用风格
```

完整流水线的调用方式见 `SKILL.md` 里的代码示例。

## 已知局限

- `screenplay_parser.py` 靠正则和启发式规则识别场景/对白，格式特别不规范的
  剧本（比如没有任何场景标题、对白也不带"角色："前缀）会退化成整段当动作行处理。
- `character_bible.py` / `scene_bible.py` 的自动抽取只是草稿，多数情况下需要
  人工（或 Claude 追问用户）补全外观描述才能真正保证多格视觉一致。
- `page_layout.py` 的分格模板（`_LAYOUT_TEMPLATES`）目前只覆盖 1/2/3/4/5/6/8
  格几种常见页面密度，格数不在这个集合里时会退化成规则网格。
