#!/usr/bin/env python3
"""把 H3 动作迁移工作流改造成「导演台」：每个切好的镜头一个分组，各自带素材上传口。

用法：python3 build_director_console.py
输入：h3_motion_transfer_improved.json（取模型链和节点模板）、shot_list.json（镜头表）
输出：h3_director_console.json（RunningHub / ComfyUI 界面格式，可直接导入）
"""

import copy
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "h3_motion_transfer_improved.json")
SHOTS = os.path.join(HERE, "shot_list.json")
OUT = os.path.join(HERE, "h3_director_console.json")

FPS = 24
MIN_FRAMES = 124            # H3 训练区间下限（约 5.2 秒），更短的镜头先生成 124 帧再裁回原长
CANVAS_W, CANVAS_H = 1536, 672   # 原片 1068×480 的比例，面积等于 H3 上限 768×1344
COLS = 6
GROUP_W, GROUP_H = 1760, 1010
SHOT_ORIGIN_Y = 900

# 原工作流里保留的共享节点（模型、采样器、全局提示词）
SHARED = {1, 2, 3, 4, 5, 10, 11, 14, 16, 20, 21, 25}


def align_frames(n):
    n = max(MIN_FRAMES, n)
    while n % 17 != 5:
        n += 1
    return n


class Graph:
    def __init__(self, src):
        self.src = src
        self.tpl = {n["id"]: n for n in src["nodes"]}
        self.nodes, self.links = [], []
        self.next_node = 1000
        self.next_link = 1000

    def add(self, node):
        self.nodes.append(node)
        return node

    def clone(self, tpl_id, **over):
        n = copy.deepcopy(self.tpl[tpl_id])
        n["id"] = self.next_node
        self.next_node += 1
        for i in n.get("inputs", []):
            i.pop("link", None)
        for o in n.get("outputs", []):
            o["links"] = None
        n.update(over)
        return self.add(n)

    def new(self, type_, inputs, outputs, widgets, pos, size, title=None, color=None):
        n = {"id": self.next_node, "type": type_, "pos": pos, "size": size, "flags": {}, "order": 0, "mode": 0,
             "inputs": inputs, "outputs": outputs, "properties": {"Node name for S&R": type_},
             "widgets_values": widgets}
        self.next_node += 1
        if title:
            n["title"] = title
        if color:
            n["color"], n["bgcolor"] = color
        return self.add(n)

    def link(self, a, a_slot, b, b_input_name):
        names = [i["name"] for i in b["inputs"]]
        b_slot = names.index(b_input_name)
        out = a["outputs"][a_slot]
        lid = self.next_link
        self.next_link += 1
        self.links.append([lid, a["id"], a_slot, b["id"], b_slot, out["type"]])
        out["links"] = (out.get("links") or []) + [lid]
        b["inputs"][b_slot]["link"] = lid


def widget_input(name, type_):
    return {"label": name, "name": name, "type": type_, "widget": {"name": name}}


def main():
    src = json.load(open(SRC, encoding="utf-8"))
    shots = json.load(open(SHOTS, encoding="utf-8"))
    g = Graph(src)

    # ---------------------------------------------------------------- 共享区
    shared = {}
    for tid in sorted(SHARED):
        n = copy.deepcopy(g.tpl[tid])
        for i in n.get("inputs", []):
            i.pop("link", None)
        for o in n.get("outputs", []):
            o["links"] = None
        shared[tid] = g.add(n)

    for a, a_slot, b, name in [(4, 0, 14, "model"), (4, 0, 16, "model"), (16, 0, 21, "model"), (21, 0, 25, "model"),
                               (10, 0, 20, "string1"), (11, 0, 20, "string2")]:
        g.link(shared[a], a_slot, shared[b], name)

    shared[10]["title"] = "全局 · 动作迁移提示词"
    shared[11]["title"] = "全局 · 身份替换提示词"
    shared[10]["widgets_values"] = [
        "让 <Picture 1> 里的人物，从 <Picture 1> 这一帧开始，逐帧复现 <Video 1> 的动作：肢体轨迹、身体重心、手臂摆动、步伐、转头、"
        "动作幅度、停顿时机和镜头运动都与 <Video 1> 一致，并踩在 <Audio 1> 的节拍上。严格保持 <Video 1> 的时间轴，不要提前、延后、删减或新增动作。"]
    shared[11]["widgets_values"] = [
        "<Picture 1> 是这个镜头替换人物之后的第一帧：画面里每个人的脸部五官、发型、体型、服装、颜色和材质都以 <Picture 1> 为准，"
        "人物数量和站位也与 <Picture 1> 一致。<Video 1> 只提供动作和镜头运动，不要沿用 <Video 1> 里人物的长相和服装。"
        "背景、光照和构图沿用 <Picture 1>。"]

    # 共享区摆位
    layout = {1: (0, 300), 2: (290, 300), 4: (580, 300), 5: (870, 300), 16: (1160, 300), 21: (1450, 300),
              25: (1740, 300), 3: (2120, 300), 14: (2410, 300), 10: (0, 0), 11: (420, 0), 20: (840, 0)}
    for tid, (x, y) in layout.items():
        shared[tid]["pos"] = [x, y - 900]

    width = g.clone(9, title="全局 · 画面宽度", widgets_values=[CANVAS_W, "fixed"], pos=[1160, -900])
    height = g.clone(9, title="全局 · 画面高度", widgets_values=[CANVAS_H, "fixed"], pos=[1450, -900])

    g.new("Fast Groups Muter (rgthree)", [], [{"name": "OPT_CONNECTION", "type": "*", "links": None}], [],
          [2700, -900], [420, 1400], title="镜头开关面板（打开要生成的镜头）")
    g.nodes[-1]["properties"] = {"matchColors": "", "matchTitle": "^镜头", "showNav": True, "sort": "position",
                                 "customSortAlphabet": "", "toggleRestriction": "default"}

    note = ("H3 导演台 · 镜头人物替换\n\n"
            "每个「镜头 NNN」分组对应切割包里的一个镜头，默认全部关闭。\n\n"
            "单个镜头的用法：\n"
            "1. 原片镜头：上传切割包 clips/ 里同编号的 shot_NNN.mp4。\n"
            "2. 主参考图（必填）：把切割包 first_frames/shot_NNN.png 用图像编辑模型把人物换成你的角色，背景不动，上传到这里。"
            "它就是 <Picture 1>，决定这个镜头里每个人的长相和服装。\n"
            "3. 额外参考 2、3（可选，默认没接线）：特写镜头想让脸更准时，上传角色定妆照，再把它连到 H3 节点的 ref_images.ref_image_1 / ref_image_2，"
            "并在镜头提示词里用 <Picture 2> / <Picture 3> 指明是谁。\n"
            "4. 镜头提示词：补充这个镜头的人物对应关系，比如「左边是 A，右边是 B」。\n"
            "5. 在右侧「镜头开关面板」打开这个镜头，运行。可以一次开多个，按顺序逐个生成。\n\n"
            "说明：\n"
            "· 不足 124 帧（约 5.2 秒）的镜头会先按 124 帧生成，再自动裁回原镜头长度；长度已经按镜头算好，不用改。\n"
            "· 输出在 output/director/shot_NNN，配的是原镜头的声音。没生成的镜头，拼接脚本会用原片补上。\n"
            "· 全局画面 1536×672 是原片比例，想更快可以把宽高一起改成 1024×448。\n"
            "· 替换用的角色需是虚构人物或已获得本人授权的人物。")
    g.new("Note", [], [], [note], [-700, -900], [640, 760], title="使用说明", color=("#432", "#653"))

    groups = [
        {"id": 1, "title": "全局设置：模型 · 采样 · 提示词 · 画面尺寸", "bounding": [-40, -1000, 2700, 760],
         "color": "#3f789e", "font_size": 28, "flags": {}},
    ]

    # ---------------------------------------------------------------- 每个镜头
    for k, s in enumerate(shots):
        num = s["shot"]
        tag = f"{num:03d}"
        n_frames = s["frames"]
        gen_len = align_frames(n_frames)
        x0 = (k % COLS) * (GROUP_W + 60)
        y0 = SHOT_ORIGIN_Y + (k // COLS) * (GROUP_H + 80)

        vid = g.clone(22, pos=[x0 + 10, y0 + 50], size=[255, 520], title="原片镜头（上传 shot_" + tag + ".mp4）")
        vid["widgets_values"] = dict(vid["widgets_values"], video=f"shot_{tag}.mp4", force_rate=FPS, frame_load_cap=0,
                                     videopreview={"hidden": False, "paused": False, "params": {}})
        for i in vid["inputs"]:
            i.pop("link", None)

        main_img = g.clone(8, pos=[x0 + 280, y0 + 50], size=[300, 360], title="主参考图 <Picture 1>（必填：替换后的首帧）",
                           widgets_values=[f"shot_{tag}_main.png", "image"])
        extra = [g.clone(8, pos=[x0 + 595 + j * 315, y0 + 50], size=[300, 360],
                         title=f"额外参考 {j + 2}（可选，用时连到 H3 的 ref_image_{j + 1}）",
                         widgets_values=[f"shot_{tag}_ref{j + 2}.png", "image"]) for j in range(2)]

        prompt = g.clone(10, pos=[x0 + 1230, y0 + 50], size=[500, 360], title="镜头提示词",
                         widgets_values=[f"【镜头 {tag} · {s['seconds']:.2f} 秒 · 原片 {s['tc_in']}】"
                                         "在这里补充本镜头的人物对应关系，例如：<Picture 1> 左边的人是……，右边的人是……；"
                                         "特写主体是……。没有补充也可以直接运行。"])

        resize = g.clone(26, pos=[x0 + 10, y0 + 600], size=[270, 330], title="原片按全局画幅裁切")
        resize["widgets_values"] = [CANVAS_W, CANVAS_H, "lanczos", "crop", "0, 0, 0", "center", 32, "cpu"]
        join = g.clone(20, pos=[x0 + 295, y0 + 600], size=[270, 80], title="全局 + 镜头提示词")
        h3 = g.clone(28, pos=[x0 + 580, y0 + 600], size=[400, 370], title=f"H3 Ref2VA · 镜头 {tag}")
        h3["widgets_values"] = ["", CANVAS_W, CANVAS_H, gen_len, "match"]
        noise = g.clone(6, pos=[x0 + 995, y0 + 600], size=[270, 82], widgets_values=[100000 + num, "fixed"],
                        title="种子（固定，重跑结果一致）")
        guider = g.clone(29, pos=[x0 + 995, y0 + 700], size=[200, 46])
        sampler = g.clone(30, pos=[x0 + 995, y0 + 770], size=[240, 106])
        decode = g.clone(32, pos=[x0 + 1250, y0 + 600], size=[200, 46])
        trim = g.new("ImageFromBatch",
                     [{"label": "image", "name": "image", "type": "IMAGE"}, widget_input("batch_index", "INT"),
                      widget_input("length", "INT")],
                     [{"label": "IMAGE", "name": "IMAGE", "type": "IMAGE", "links": None}],
                     [0, n_frames], [x0 + 1250, y0 + 680], [220, 82], title=f"裁回原长 {n_frames} 帧")
        out = g.clone(33, pos=[x0 + 1490, y0 + 600], size=[260, 380], title="输出")
        out["widgets_values"] = dict(out["widgets_values"], frame_rate=FPS, filename_prefix=f"director/shot_{tag}",
                                     videopreview={"hidden": False, "paused": False, "params": {}})
        for i in out["inputs"]:
            i.pop("link", None)

        g.link(vid, 0, resize, "image")
        g.link(width, 0, resize, "width")
        g.link(height, 0, resize, "height")
        g.link(shared[20], 0, join, "string1")
        g.link(prompt, 0, join, "string2")
        g.link(shared[5], 0, h3, "clip")
        g.link(shared[1], 0, h3, "vae")
        g.link(shared[2], 0, h3, "audio_vae")
        g.link(main_img, 0, h3, "ref_images.ref_image_0")
        g.link(resize, 0, h3, "ref_videos.ref_video_0")
        g.link(vid, 2, h3, "ref_video_audios.ref_video_audio_0")
        g.link(join, 0, h3, "prompt")
        g.link(width, 0, h3, "width")
        g.link(height, 0, h3, "height")
        g.link(shared[25], 0, guider, "model")
        g.link(h3, 0, guider, "conditioning")
        g.link(noise, 0, sampler, "noise")
        g.link(guider, 0, sampler, "guider")
        g.link(shared[3], 0, sampler, "sampler")
        g.link(shared[14], 0, sampler, "sigmas")
        g.link(h3, 1, sampler, "latent_image")
        g.link(sampler, 0, decode, "samples")
        g.link(shared[1], 0, decode, "vae")
        g.link(decode, 0, trim, "image")
        g.link(trim, 0, out, "images")
        g.link(vid, 2, out, "audio")

        # 镜头分组默认关闭（mode 2 = 静音），在开关面板里打开
        for n in (vid, main_img, *extra, prompt, resize, join, h3, noise, guider, sampler, decode, trim, out):
            n["mode"] = 2
        groups.append({"id": len(groups) + 1, "title": f"镜头 {tag} · {s['tc_in']} · {s['seconds']:.2f}s · {n_frames} 帧",
                       "bounding": [x0 - 20, y0 - 30, GROUP_W, GROUP_H], "color": "#4a7c4a", "font_size": 26, "flags": {}})

    for order, n in enumerate(g.nodes):
        n["order"] = order
    wf = {"id": "00000000-0000-0000-0000-000000000000", "revision": 0,
          "last_node_id": g.next_node - 1, "last_link_id": g.next_link - 1,
          "nodes": g.nodes, "links": g.links, "groups": groups, "config": {},
          "extra": {"ds": {"scale": 0.35, "offset": [800, 1100]}, "VHS_KeepIntermediate": True,
                    "VHS_MetadataImage": True, "frontendVersion": src.get("extra", {}).get("frontendVersion", "1.23.0")},
          "version": 0.4}

    # 自检：每条连线两端都存在，且与节点记录一致
    by_id = {n["id"]: n for n in g.nodes}
    for lid, a, a_slot, b, b_slot, _ in g.links:
        assert lid in (by_id[a]["outputs"][a_slot]["links"] or []), lid
        assert by_id[b]["inputs"][b_slot].get("link") == lid, lid
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(wf, f, ensure_ascii=False, indent=1)
    print(f"{len(shots)} 个镜头，{len(g.nodes)} 个节点，{len(g.links)} 条连线 → {OUT}")


if __name__ == "__main__":
    main()
