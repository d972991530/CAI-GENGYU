"""场景/地点设定表（Scene Bible）。

与 CharacterBible 同理：同一个"码头"场景如果在不同分镜里风格漂移（一会儿是
白天一会儿是夜晚、一会儿有栏杆一会儿没有），读者会出戏。这里把每个独立的
场景标题（location）沉淀成一段可复用的环境描述，供 prompt_generator 在
每一格里原样引用。
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional

from .screenplay_parser import Scene


@dataclass
class SceneEntry:
    location: str
    description: str = ""
    time_of_day: str = ""
    notes: List[str] = field(default_factory=list)


class SceneBible:
    def __init__(self) -> None:
        self.locations: Dict[str, SceneEntry] = {}

    @classmethod
    def build_from_scenes(cls, scenes: List[Scene]) -> "SceneBible":
        bible = cls()
        for scene in scenes:
            key = scene.location or scene.heading or f"场景{scene.index}"
            entry = bible.locations.setdefault(key, SceneEntry(location=key, time_of_day=scene.time_of_day or ""))
            entry.notes.extend(scene.action_lines[:2])
        for entry in bible.locations.values():
            if entry.notes and not entry.description:
                entry.description = entry.notes[0]
        return bible

    def describe(self, location: Optional[str]) -> str:
        if not location:
            return "场景环境待定义"
        entry = self.locations.get(location)
        if not entry:
            return f"{location}（环境细节未定义，建议补充以保持多格间一致）"
        desc = entry.description or f"{location}（环境待定义）"
        return f"{desc}，{entry.time_of_day}" if entry.time_of_day else desc

    def save(self, path: str) -> None:
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        data = {loc: entry.__dict__ for loc, entry in self.locations.items()}
        p.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    @classmethod
    def load(cls, path: str) -> "SceneBible":
        bible = cls()
        data = json.loads(Path(path).read_text(encoding="utf-8"))
        for loc, fields in data.items():
            bible.locations[loc] = SceneEntry(**fields)
        return bible


if __name__ == "__main__":
    import sys

    from .screenplay_parser import parse_script

    src = sys.stdin.read() if len(sys.argv) < 2 else open(sys.argv[1], encoding="utf-8").read()
    bible = SceneBible.build_from_scenes(parse_script(src))
    print(json.dumps({l: e.__dict__ for l, e in bible.locations.items()}, ensure_ascii=False, indent=2))
