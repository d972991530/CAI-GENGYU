"""计算漫画页面版式的元数据（不做像素级拼图）。

漫画分格的观感很大程度上来自"格子大小不均匀"——建立镜头/关键情绪格给大格，
过渡性的反应镜头给小格。这里维护几套预设网格模板（按每页格数分类），
从模板里挑一个和当前页格数匹配的，再把 beat_type 更重要的分镜分配到更大的
格子里。输出的是"格子在页面里的相对坐标"（0~1 的分数），不涉及具体像素或
图片文件——实际排版渲染（比如用 Pillow 拼图、往图上贴对话气泡）留给下游
工具去做，这里只保证"版式设计"这一层的决策是清晰、可解释、可复用的 JSON。
"""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from typing import Dict, List, Tuple

from parser.shot_splitter import Shot
from renderer.prompt_generator import PanelPrompt

BBox = Tuple[float, float, float, float]  # (x, y, w, h)，均为页面尺寸的分数

# 每套模板是一组矩形；下标顺序即默认阅读顺序（从左到右、从上到下）。
_LAYOUT_TEMPLATES: Dict[int, List[BBox]] = {
    1: [(0, 0, 1, 1)],
    2: [(0, 0, 1, 0.5), (0, 0.5, 1, 0.5)],
    3: [(0, 0, 1, 0.45), (0, 0.47, 0.48, 0.53), (0.52, 0.47, 0.48, 0.53)],
    4: [(0, 0, 1, 0.4), (0, 0.42, 0.5, 0.28), (0.5, 0.42, 0.5, 0.28), (0, 0.72, 1, 0.28)],
    5: [
        (0, 0, 0.6, 0.4), (0.62, 0, 0.38, 0.4),
        (0, 0.42, 0.33, 0.28), (0.335, 0.42, 0.33, 0.28),
        (0.67, 0.42, 0.33, 0.56),
    ],
    6: [
        (0, 0, 0.5, 0.33), (0.52, 0, 0.48, 0.33),
        (0, 0.35, 0.32, 0.3), (0.34, 0.35, 0.32, 0.3), (0.68, 0.35, 0.32, 0.3),
        (0, 0.67, 1, 0.33),
    ],
    8: [
        (0, 0, 0.5, 0.28), (0.52, 0, 0.48, 0.28),
        (0, 0.3, 0.25, 0.22), (0.26, 0.3, 0.25, 0.22), (0.52, 0.3, 0.25, 0.22), (0.78, 0.3, 0.22, 0.22),
        (0, 0.54, 0.5, 0.46), (0.52, 0.54, 0.48, 0.46),
    ],
}

_BEAT_PRIORITY = {"establishing": 3, "action": 2, "dialogue": 1}


@dataclass
class PanelLayout:
    panel_id: str
    shot_id: str
    bbox: BBox
    reading_order: int
    bubble_positions: List[dict] = field(default_factory=list)


@dataclass
class Page:
    page_number: int
    panels: List[PanelLayout] = field(default_factory=list)


def _closest_template(n: int) -> int:
    available = sorted(_LAYOUT_TEMPLATES)
    return min(available, key=lambda k: abs(k - n))


def _fallback_grid(n: int) -> List[BBox]:
    cols = 2 if n > 1 else 1
    rows = (n + cols - 1) // cols
    w, h = 1 / cols, 1 / rows
    return [(c * w, r * h, w, h) for r in range(rows) for c in range(cols)][:n]


def _bubble_position(index: int, total: int) -> dict:
    # 多条台词从下往上依次排列；气泡尾巴指向具体角色留给下游细化。
    y = 0.75 - index * (0.5 / max(total, 1))
    return {"x": 0.1, "y": round(max(y, 0.05), 2), "tail_direction": "down"}


def layout_pages(shots: List[Shot], panel_prompts: List[PanelPrompt], panels_per_page: int = 6) -> List[Page]:
    pages: List[Page] = []
    shot_by_id = {s.shot_id: s for s in shots}

    for page_start in range(0, len(panel_prompts), panels_per_page):
        chunk = panel_prompts[page_start : page_start + panels_per_page]
        template_size = _closest_template(len(chunk))
        template = _LAYOUT_TEMPLATES[template_size]
        boxes = template[: len(chunk)] if len(chunk) <= len(template) else _fallback_grid(len(chunk))

        # 把 beat_type 更重要的分镜优先安排到面积更大的格子里。
        priority_order = sorted(
            range(len(chunk)),
            key=lambda i: _BEAT_PRIORITY.get(shot_by_id[chunk[i].shot_id].beat_type, 0),
            reverse=True,
        )
        box_order_by_area = sorted(range(len(boxes)), key=lambda i: boxes[i][2] * boxes[i][3], reverse=True)
        assigned_box = {priority_order[i]: box_order_by_area[i] for i in range(len(chunk))}

        panels = []
        for i, panel_prompt in enumerate(chunk):
            bubbles = [_bubble_position(j, len(panel_prompt.bubbles)) for j in range(len(panel_prompt.bubbles))]
            panels.append(
                PanelLayout(
                    panel_id=f"p{page_start + i + 1}",
                    shot_id=panel_prompt.shot_id,
                    bbox=boxes[assigned_box[i]],
                    reading_order=i + 1,
                    bubble_positions=bubbles,
                )
            )
        pages.append(Page(page_number=len(pages) + 1, panels=panels))

    return pages


def to_json(pages: List[Page]) -> str:
    return json.dumps(
        [{"page_number": p.page_number, "panels": [asdict(pl) for pl in p.panels]} for p in pages],
        ensure_ascii=False,
        indent=2,
    )
