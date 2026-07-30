"""解析文字剧本为结构化场景数据。

兼容两类输入：
1. 标准工业格式剧本（INT./EXT. 场景标题，全大写角色提示行，动作描述）。
2. 松散的中文叙事体剧本（"场景 1：地点 - 时间"标题 + "角色：（情绪）台词"式对话）。

不依赖任何第三方库，只用正则和启发式规则——剧本格式千差万别，与其硬编码
一种"正确"格式，不如把它当成信号检测问题：先找场景边界，再在场景内部
区分"对话行"和"动作/旁白行"。这些启发式规则不追求 100% 准确，格式特别
特殊的剧本仍然需要人工核对 parse_script() 的输出。
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import List, Optional, Tuple, Union


@dataclass
class DialogueLine:
    character: str
    line: str
    parenthetical: Optional[str] = None  # 如 "（愤怒地）"


@dataclass
class Scene:
    index: int
    heading: Optional[str]  # 原始场景标题，如 "INT. 码头仓库 - 夜"
    location: Optional[str]
    time_of_day: Optional[str]
    # 按剧本原文顺序保存的元素：str = 动作/旁白行，DialogueLine = 一句台词。
    # 特意不拆成两个独立列表——动作和对白在原文里穿插出现，谁先谁后直接决定
    # shot_splitter 该怎么分格；拆开存会丢失这个时间线信息。
    elements: List[Union[str, DialogueLine]] = field(default_factory=list)
    raw_text: str = ""

    @property
    def action_lines(self) -> List[str]:
        return [e for e in self.elements if isinstance(e, str)]

    @property
    def dialogue(self) -> List[DialogueLine]:
        return [e for e in self.elements if isinstance(e, DialogueLine)]


_SCENE_HEADING_RE = re.compile(
    r"^\s*(INT\.?|EXT\.?|内景|外景|场景\s*\d*\s*[:：]?)\s*(.*)$", re.IGNORECASE
)
# "李明：你还好吗？" / "李明:（愤怒）你还好吗？" / "LIMING: Are you OK?"
_DIALOGUE_RE = re.compile(
    r"^\s*([\w一-鿿·]{1,12})\s*[:：]\s*(?:[（(]([^)）]*)[)）]\s*)?(.+)$"
)
# 独立成行的全大写角色提示（好莱坞格式：CHARACTER\n  dialogue...）
_ALLCAPS_CUE_RE = re.compile(r"^\s*([A-Z][A-Z0-9 .'\-]{1,20})\s*$")


def _split_location_time(rest: str) -> Tuple[Optional[str], Optional[str]]:
    parts = re.split(r"\s*-\s*|\s*，\s*|\s*,\s*", rest, maxsplit=1)
    location = parts[0].strip() if parts and parts[0].strip() else None
    time_of_day = parts[1].strip() if len(parts) > 1 and parts[1].strip() else None
    return location, time_of_day


def parse_script(text: str) -> List[Scene]:
    """把整份剧本文本切分为若干 Scene。"""
    lines = [l.rstrip() for l in text.splitlines()]
    scenes: List[Scene] = []
    current: Optional[Scene] = None
    pending_cue: Optional[str] = None  # 上一行是"全大写角色提示"，等待下一行台词

    def start_scene(heading: Optional[str], location: Optional[str], time_of_day: Optional[str]) -> None:
        nonlocal current
        current = Scene(index=len(scenes) + 1, heading=heading, location=location, time_of_day=time_of_day)
        scenes.append(current)

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            pending_cue = None
            continue

        # 跳过 Markdown 标题/分割线等排版噪音（用户常把剧本粘贴进 .md 文件）。
        if line.startswith("#") or set(line) <= {"-", "="}:
            pending_cue = None
            continue

        heading_match = _SCENE_HEADING_RE.match(line)
        if heading_match and (heading_match.group(2) or heading_match.group(1).upper().startswith(("INT", "EXT"))):
            location, time_of_day = _split_location_time(heading_match.group(2))
            start_scene(line, location, time_of_day)
            pending_cue = None
            continue

        if current is None:
            start_scene(None, None, None)

        dialogue_match = _DIALOGUE_RE.match(line)
        if dialogue_match:
            character, parenthetical, spoken = dialogue_match.groups()
            current.elements.append(
                DialogueLine(character=character.strip(), line=spoken.strip(), parenthetical=parenthetical)
            )
            current.raw_text += raw_line + "\n"
            pending_cue = None
            continue

        cue_match = _ALLCAPS_CUE_RE.match(line)
        if cue_match and len(line.split()) <= 4:
            pending_cue = cue_match.group(1).strip()
            current.raw_text += raw_line + "\n"
            continue

        if pending_cue:
            paren = None
            spoken = line
            paren_match = re.match(r"^[（(]([^)）]*)[)）]\s*(.*)$", line)
            if paren_match:
                paren, spoken = paren_match.groups()
            current.elements.append(DialogueLine(character=pending_cue, line=spoken.strip(), parenthetical=paren))
            current.raw_text += raw_line + "\n"
            pending_cue = None
            continue

        current.elements.append(line)
        current.raw_text += raw_line + "\n"

    return [s for s in scenes if s.elements or s.heading]


if __name__ == "__main__":
    import json
    import sys
    from dataclasses import asdict

    src = sys.stdin.read() if len(sys.argv) < 2 else open(sys.argv[1], encoding="utf-8").read()
    parsed = parse_script(src)
    print(json.dumps([asdict(s) for s in parsed], ensure_ascii=False, indent=2))
