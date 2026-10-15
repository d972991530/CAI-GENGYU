"""手绘风格控制器：解析 prompt/manga_style.md 里的风格库，供 prompt_generator 使用。

manga_style.md 用二级标题（##）划分风格小节，标题下的正文就是这个风格对应的
出图描述词。新增一种风格只需要在 manga_style.md 里加一节，不需要碰这里的代码。
"""
from __future__ import annotations

import re
from pathlib import Path
from typing import Dict, List, Optional

_SECTION_RE = re.compile(r"^##\s+(.+?)\s*$", re.MULTILINE)


def load_styles(md_path: str) -> Dict[str, str]:
    text = Path(md_path).read_text(encoding="utf-8")
    matches = list(_SECTION_RE.finditer(text))
    styles: Dict[str, str] = {}
    for i, m in enumerate(matches):
        name = m.group(1).strip()
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        styles[name] = text[start:end].strip()
    return styles


class StyleController:
    def __init__(self, md_path: str, default_style: Optional[str] = None):
        self.styles = load_styles(md_path)
        self.default_style = default_style or (next(iter(self.styles), None))

    def list_styles(self) -> List[str]:
        return list(self.styles.keys())

    def get(self, style_name: Optional[str] = None) -> str:
        name = style_name or self.default_style
        if name not in self.styles:
            available = ", ".join(self.styles) or "(无可用风格，请检查 manga_style.md)"
            raise KeyError(f"未知风格 '{name}'，可用风格：{available}")
        return self.styles[name]


if __name__ == "__main__":
    import sys

    path = sys.argv[1] if len(sys.argv) > 1 else "prompt/manga_style.md"
    ctrl = StyleController(path)
    for name in ctrl.list_styles():
        print(f"=== {name} ===\n{ctrl.get(name)}\n")
