"""把场景（Scene）切分为漫画分镜格（Shot）。

一个"场景"往往包含多次对话往返和若干动作描述，直接整段丢给出图模型只会
得到一张信息过载、构图混乱的图。分镜的核心工作是决定"在哪里切一刀":

- 场景开场先给一个建立镜头（establishing shot），交代地点/氛围。
- 强动作/强情绪的动作描述单独成格，倾向于给更有冲击力的取景（特写）。
- 每一次有效的对话交换（说话人切换）大致对应一格，避免一格塞两个人在说话；
  情绪强烈的台词（带情绪批注或感叹号）会升级为特写。
- 如果指定了 target_shots，会在"合并最不关键的格子"与"拆分冗长动作描述"之间
  取舍，尽量贴近目标格数，但不保证精确——叙事节奏比凑数字重要。
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import List, Optional

from .screenplay_parser import DialogueLine, Scene

FRAMING_WIDE = "WIDE (建立镜头/大全景)"
FRAMING_MEDIUM = "MEDIUM (中景)"
FRAMING_CLOSE_UP = "CLOSE-UP (特写)"
FRAMING_OTS = "OVER-THE-SHOULDER (过肩)"

_INTENSE_KEYWORDS = ("突然", "猛地", "尖叫", "怒吼", "！", "!", "冲", "扑", "撞", "砰")


@dataclass
class Shot:
    shot_id: str
    scene_index: int
    beat_type: str  # 'establishing' | 'action' | 'dialogue'
    description: str
    dialogue: List[DialogueLine] = field(default_factory=list)
    framing: str = FRAMING_MEDIUM


def _is_intense(text: str) -> bool:
    return any(kw in text for kw in _INTENSE_KEYWORDS)


def split_scene_into_shots(scene: Scene, target_shots: Optional[int] = None) -> List[Shot]:
    shots: List[Shot] = []
    counter = 0

    def next_id() -> str:
        nonlocal counter
        counter += 1
        return f"s{scene.index}-{counter}"

    elements = scene.elements
    start_idx = 0

    # 1. 建立镜头：用场景标题 + （如果紧跟着的第一个元素就是动作描述）交代环境。
    #    只吃掉"紧贴开头"的动作行，避免误吞后面才出现、且顺序更靠后的动作/对白。
    intro = scene.heading or ""
    if elements and isinstance(elements[0], str):
        intro = f"{intro} {elements[0]}".strip()
        start_idx = 1
    if intro:
        shots.append(
            Shot(shot_id=next_id(), scene_index=scene.index, beat_type="establishing", description=intro, framing=FRAMING_WIDE)
        )

    # 2. 按剧本原文顺序依次处理剩余元素，保持动作与对白的时间线不被打乱：
    #    - 强动作（突发/情绪化）立刻独立成格，取特写；
    #    - 普通动作行先攒着，等下一句台词（或下一处强动作）出现时，作为该格的
    #      背景描述一并带入——它本来就是用来铺垫紧接着发生的事的；
    #    - 对话按说话人切换分格，带情绪批注或强烈语气的台词升级为特写。
    leftover_action: List[str] = []
    last_speaker: Optional[str] = None
    for element in elements[start_idx:]:
        if isinstance(element, str):
            if _is_intense(element):
                if leftover_action:
                    shots.append(
                        Shot(shot_id=next_id(), scene_index=scene.index, beat_type="action",
                             description=" ".join(leftover_action), framing=FRAMING_MEDIUM)
                    )
                    leftover_action = []
                shots.append(
                    Shot(shot_id=next_id(), scene_index=scene.index, beat_type="action", description=element, framing=FRAMING_CLOSE_UP)
                )
            else:
                leftover_action.append(element)
            continue

        d = element  # DialogueLine
        if _is_intense(d.line) or d.parenthetical:
            framing = FRAMING_CLOSE_UP
        elif last_speaker and last_speaker != d.character:
            framing = FRAMING_OTS
        else:
            framing = FRAMING_MEDIUM

        desc = " ".join(leftover_action)
        leftover_action = []  # 只附着在紧跟着的下一格一次
        shots.append(
            Shot(shot_id=next_id(), scene_index=scene.index, beat_type="dialogue", description=desc, dialogue=[d], framing=framing)
        )
        last_speaker = d.character

    if leftover_action:
        if shots:
            shots[-1].description = (shots[-1].description + " " + " ".join(leftover_action)).strip()
        else:
            shots.append(
                Shot(shot_id=next_id(), scene_index=scene.index, beat_type="action", description=" ".join(leftover_action), framing=FRAMING_MEDIUM)
            )

    if not shots:
        return shots

    if target_shots and len(shots) > target_shots:
        shots = _merge_down(shots, target_shots)
    elif target_shots and len(shots) < target_shots:
        shots = _split_up(shots, target_shots)

    return shots


def _find_adjacent_pair(shots: List[Shot], predicate) -> Optional[int]:
    for i in range(len(shots) - 1):
        if predicate(shots[i], shots[i + 1]):
            return i
    return None


def _merge_down(shots: List[Shot], target: int) -> List[Shot]:
    """合并最不关键的相邻格子，直到贴近目标数，同时保留剧本原有的先后顺序。

    合并优先级（从最安全到最后手段）：
    1. 两个相邻的纯动作格——信息量最低，合并对叙事影响最小。
    2. 两个相邻、都不是"建立镜头"的格子——保留场景的第一印象格不动。
    3. 实在没得选，才合并任意相邻格（包括建立镜头）。
    """
    shots = list(shots)
    while len(shots) > target and len(shots) > 1:
        merge_idx = _find_adjacent_pair(shots, lambda a, b: a.beat_type == "action" and b.beat_type == "action")
        if merge_idx is None:
            merge_idx = _find_adjacent_pair(shots, lambda a, b: a.beat_type != "establishing" and b.beat_type != "establishing")
        if merge_idx is None:
            merge_idx = 0
        a, b = shots[merge_idx], shots.pop(merge_idx + 1)
        a.description = (a.description + " " + b.description).strip()
        a.dialogue = a.dialogue + b.dialogue
    return shots


def _split_sentences(text: str) -> List[str]:
    """按句末标点切句，同时把过短的片段并回下一句。

    这里主要是为了防着"EXT."/"INT."这类场景标题缩写——它们带的英文句号会被
    朴素的标点切分误判成一句独立的句子，切出一个只有"EXT."四个字的畸形分镜。
    片段短于阈值就说明它大概率不是完整句子，直接并入紧随其后的内容。
    """
    raw = [s for s in re.split(r"(?<=[。！？.!?])", text) if s.strip()]
    merged: List[str] = []
    for part in raw:
        if merged and len(merged[-1].strip()) < 6:
            merged[-1] = merged[-1] + part
        else:
            merged.append(part)
    return merged


def _split_up(shots: List[Shot], target: int) -> List[Shot]:
    """场景太短、格数不够时，把最长的（无台词）动作描述拆成两格补足节奏。"""
    shots = list(shots)
    guard = 0
    while len(shots) < target and guard < target * 2:
        guard += 1
        candidates = [i for i in range(len(shots)) if not shots[i].dialogue and shots[i].description]
        if not candidates:
            break
        idx = max(candidates, key=lambda i: len(shots[i].description))
        candidate = shots[idx]
        sentences = _split_sentences(candidate.description)
        if len(sentences) < 2:
            break
        mid = len(sentences) // 2
        first, second = "".join(sentences[:mid]).strip(), "".join(sentences[mid:]).strip()
        candidate.description = first
        new_shot = Shot(
            shot_id=f"{candidate.shot_id}b",
            scene_index=candidate.scene_index,
            beat_type=candidate.beat_type,
            description=second,
            framing=candidate.framing,
        )
        shots.insert(idx + 1, new_shot)
    return shots


if __name__ == "__main__":
    import json
    import sys
    from dataclasses import asdict

    from .screenplay_parser import parse_script

    src = sys.stdin.read() if len(sys.argv) < 2 else open(sys.argv[1], encoding="utf-8").read()
    all_shots = []
    for scene in parse_script(src):
        all_shots.extend(split_scene_into_shots(scene, target_shots=4))
    print(json.dumps([asdict(s) for s in all_shots], ensure_ascii=False, indent=2))
