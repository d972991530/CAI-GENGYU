"""把一个分镜（Shot）+ 角色/场景设定 + 风格描述，拼装成最终可直接喂给出图
模型的自然语言 prompt。

本模块只产出文本（prompt + negative_prompt + 结构化的对话气泡信息），不调用
任何图片生成 API —— 实际出图交给调用方（Claude 当前会话里可用的图像工具，
或用户已有的 Gemini/Stable Diffusion 等集成）来做，这样这个 skill 才能在
任意图像后端下复用，而不是绑死某一个供应商。
"""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Dict, List, Optional

from parser.character_bible import CharacterBible
from parser.scene_bible import SceneBible
from parser.shot_splitter import Shot

NEGATIVE_PROMPT_DEFAULT = (
    "smooth vector art, 3D render, CGI, photorealistic, digital airbrush, "
    "clean geometric lines, glossy plastic look, watermark, text artifacts, extra limbs"
)

_STORYBOARD_TEMPLATE_FALLBACK = (
    "Hand-drawn manga/comic panel, {style}.\n\n"
    "Shot type: {framing}.\n"
    "Setting: {setting}.\n"
    "Characters present: {characters}.\n"
    "Action: {action}.\n"
    "{dialogue_instruction}\n"
    "Panel border visible, dynamic hand-drawn composition, traditional ink/pencil "
    "linework with visible texture — not smooth digital vector art, not 3D render, "
    "not photorealistic."
)


@dataclass
class BubbleSpec:
    character: str
    text: str
    emphasis: bool = False  # 台词是否情绪强烈（配合特写取景判断）


@dataclass
class PanelPrompt:
    shot_id: str
    panel_number: int
    prompt: str
    negative_prompt: str
    bubbles: List[BubbleSpec] = field(default_factory=list)
    caption: Optional[str] = None


def _load_template(template_path: Optional[str]) -> str:
    if template_path and Path(template_path).exists():
        return Path(template_path).read_text(encoding="utf-8")
    return _STORYBOARD_TEMPLATE_FALLBACK


def build_panel_prompt(
    shot: Shot,
    panel_number: int,
    character_bible: CharacterBible,
    scene_bible: SceneBible,
    style_descriptor: str,
    location: Optional[str] = None,
    template_path: Optional[str] = None,
) -> PanelPrompt:
    template = _load_template(template_path)

    speakers = [d.character for d in shot.dialogue]
    characters_desc = "; ".join(character_bible.describe(name) for name in speakers) or "无出场角色（空镜/环境镜头）"
    setting_desc = scene_bible.describe(location)

    bubbles = [
        BubbleSpec(
            character=d.character,
            text=d.line,
            emphasis=bool(d.parenthetical) or "!" in d.line or "！" in d.line,
        )
        for d in shot.dialogue
    ]
    dialogue_instruction = (
        "Include hand-lettered speech bubbles with the exact dialogue: "
        + "; ".join(f'{b.character}: "{b.text}"' for b in bubbles)
        + "."
        if bubbles
        else ""
    )

    prompt_text = template.format(
        style=style_descriptor,
        framing=shot.framing,
        setting=setting_desc,
        characters=characters_desc,
        action=shot.description or "（无额外动作描述，聚焦对白与表情）",
        dialogue_instruction=dialogue_instruction,
    ).strip()

    return PanelPrompt(
        shot_id=shot.shot_id,
        panel_number=panel_number,
        prompt=prompt_text,
        negative_prompt=NEGATIVE_PROMPT_DEFAULT,
        bubbles=bubbles,
        caption=None if bubbles else (shot.description or None),
    )


def build_all(
    shots: List[Shot],
    character_bible: CharacterBible,
    scene_bible: SceneBible,
    style_descriptor: str,
    location_by_scene: Optional[Dict[int, str]] = None,
    template_path: Optional[str] = None,
) -> List[PanelPrompt]:
    location_by_scene = location_by_scene or {}
    return [
        build_panel_prompt(
            shot,
            i + 1,
            character_bible,
            scene_bible,
            style_descriptor,
            location=location_by_scene.get(shot.scene_index),
            template_path=template_path,
        )
        for i, shot in enumerate(shots)
    ]


def to_json(panel_prompts: List[PanelPrompt]) -> str:
    return json.dumps([asdict(p) for p in panel_prompts], ensure_ascii=False, indent=2)
