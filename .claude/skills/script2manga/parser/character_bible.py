"""角色设定表（Character Bible）。

AI 逐格出图天然没有"记忆"——同一个角色在第 1 格和第 5 格可能长得完全不一样。
解决办法不是指望模型自己记住，而是我们自己维护一份角色外观描述，每次生成
某一格的 prompt 时都把同一段描述文字重新喂给模型，用文字层面的一致性去
逼近视觉上的一致性。

用法：
1. build_from_scenes() 从剧本里粗略提取角色名单和已知外观线索（尽力而为，
   多数情况下仍需要人工/Claude 补全外观描述——这一步产出的只是草稿）。
2. 补全后用 save() 落盘为 JSON，后续所有分镜生成都从 load() 读取，保证
   同一个项目里角色形象不漂移。
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List

from .screenplay_parser import Scene

_APPEARANCE_HINT_WORDS = (
    "穿着", "身穿", "身着", "留着", "戴着", "身材", "个子", "眼睛", "头发", "年约", "岁",
    "wearing", "dressed", "hair", "tall", "short", "eyes",
)


@dataclass
class CharacterEntry:
    name: str
    appearance: str = ""  # 人物一致性描述，供每格 prompt 复用
    role: str = ""  # 主角/配角/反派等，仅作提示，不强制
    notes: List[str] = field(default_factory=list)  # 从剧本里抓到的原始线索句，供人工参考


class CharacterBible:
    def __init__(self) -> None:
        self.characters: Dict[str, CharacterEntry] = {}

    @classmethod
    def build_from_scenes(cls, scenes: List[Scene]) -> "CharacterBible":
        bible = cls()
        for scene in scenes:
            for d in scene.dialogue:
                bible._ensure(d.character)
            for action in scene.action_lines:
                for name in bible.characters:
                    if name in action:
                        bible.characters[name].notes.append(action)
        for entry in bible.characters.values():
            hints = [n for n in entry.notes if any(w in n for w in _APPEARANCE_HINT_WORDS)]
            if hints and not entry.appearance:
                entry.appearance = " ".join(hints[:2])
        return bible

    def _ensure(self, name: str) -> CharacterEntry:
        if name not in self.characters:
            self.characters[name] = CharacterEntry(name=name)
        return self.characters[name]

    def describe(self, name: str) -> str:
        entry = self.characters.get(name)
        if not entry:
            return f"{name}（外观未定义，建议补充以保持多格间一致）"
        return entry.appearance or f"{name}（外观待定义，暂用默认形象）"

    def save(self, path: str) -> None:
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        data = {name: entry.__dict__ for name, entry in self.characters.items()}
        p.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    @classmethod
    def load(cls, path: str) -> "CharacterBible":
        bible = cls()
        data = json.loads(Path(path).read_text(encoding="utf-8"))
        for name, fields in data.items():
            bible.characters[name] = CharacterEntry(**fields)
        return bible


if __name__ == "__main__":
    import sys

    from .screenplay_parser import parse_script

    src = sys.stdin.read() if len(sys.argv) < 2 else open(sys.argv[1], encoding="utf-8").read()
    bible = CharacterBible.build_from_scenes(parse_script(src))
    print(json.dumps({n: e.__dict__ for n, e in bible.characters.items()}, ensure_ascii=False, indent=2))
