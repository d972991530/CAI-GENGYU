#!/usr/bin/env python3
"""在「MiniMax H3 导演台全能工作流」（AIMixer MiniMaxH3Director 插件）基础上做镜头换人。

产出两样东西：
1. 工作流：把导演台节点切到 rv2v（参考素材改视频），清理故意报错的尾链，修正 LoRA。
2. 导演包（*.mmxpack.zip）：原视频 + 78 个已按切点分好的片段。在导演台工具栏「导入导演包」后，
   每个片段都有自己的图片 1–9 上传口，传入角色图即可替换该片段里的人物。

用法：
  python3 build_director_rv2v.py --workflow 原工作流.json --source 原视频.mp4 --out-dir 输出目录
"""

import argparse
import copy
import json
import os
import subprocess
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
FPS = 24
TASK_RV2V = "rv2v — 参考素材改视频(Reference Video Edit)"
OUT_W, OUT_H = 1280, 576            # 原片 1068×480（约 2.22:1），两边都是 32 的倍数
REF2V_LORA = "minimax_h3_ref2v_turbo_4step_v0.1_comfyui_bf16.safetensors"
FAIL_CHAIN_TITLES = ("尾链",)        # 出片后故意让任务报错的节点

GLOBAL_PROMPT = (
    "把 <Video 1> 里的人物替换成参考图中的角色：<Picture 1> 是画面中最主要的人物，"
    "有多张参考图时按从左到右的顺序对应 <Picture 1>、<Picture 2>、<Picture 3>……。"
    "每个角色的脸部五官、发型、体型和服装都以参考图为准。"
    "保持 <Video 1> 的动作、走位、人数、镜头运动、场景、光线和构图完全不变，"
    "不要添加或删除人物，不要出现文字和标志。"
)


def segment_prompt(shot):
    return GLOBAL_PROMPT


def build_timeline(shots, total_frames, src_w, src_h):
    video = {
        "fileName": "clip_1.mp4", "videoFile": "source_video/clip_1.mp4", "subfolder": "source_video",
        "type": "input", "frames": [], "frameMap": [], "deletedSourceRanges": [],
        "width": src_w, "height": src_h, "duration": round(total_frames / FPS, 3),
        "nativeFps": FPS, "nativeFrameCount": total_frames, "sourceFrameCount": total_frames,
        "storageWidth": OUT_W, "storageHeight": OUT_H,
    }
    segments = []
    for s in shots:
        segments.append({
            "id": f"shot_{s['shot']:03d}",
            "start": s["frame_in"],
            "length": s["frames"],
            "frameCount": s["frames"],
            "durationSec": s["seconds"],
            "prompt": segment_prompt(s),
            "negativePrompt": "",
            "taskType": "",
            "refs": [],
            "refAudios": [],
            "referenceVideo": {},
            "genImage": {"imageFile": ""},
            "continuityFromPrev": False,
            "refImageSize": "match",
        })
    return {
        "version": 5,
        "timelineMode": "video",
        "editMode": "segment",                 # 分段模式：每个片段用自己的参考图
        "frameRate": FPS,
        "totalFrames": total_frames,
        "width": OUT_W,
        "height": OUT_H,
        "refMaxSize": OUT_W,
        "global": {"taskType": TASK_RV2V, "prompt": GLOBAL_PROMPT, "refs": [], "refAudios": [],
                   "referenceVideo": {}, "continuousReference": False, "genImage": {"imageFile": ""}},
        "output": {"mode": "fixed", "width": OUT_W, "height": OUT_H, "longEdge": OUT_W, "multiple": 32,
                   "maxExportFrames": 0, "exportMode": "all",
                   "audioMode": "source",       # 用原片的声音
                   "refImageSize": "match",
                   "continuityEnabled": False,  # 镜头之间是硬切，不做段间运动衔接
                   "continuityOverlapFrames": 22, "continuityMode": "guide", "continuityRedraw": 0.1,
                   "continuityKeepTail": True, "exportSourceImages": False, "exportPreFaceRefine": False},
        "video": video,
        "videoClips": [dict(video, id="clip1")],
        "segments": segments,
        "gen": {"defaultFrameCount": 124},
        "runSelectEnabled": False,
        "runSelection": [],
    }


def build_pack(shots, source, out_zip, timeline):
    widgets = {"task_type": TASK_RV2V, "steps": 8, "sampler": "euler", "scheduler": "beta",
               "shift_video": 12, "shift_audio": 3, "cfg": 1}
    pack_meta = {"format": "minimax-h3-director-pack", "formatVersion": 1, "taskType": TASK_RV2V,
                 "widgets": widgets, "output": dict(timeline["output"], frameRate=FPS),
                 "note": "STAGE 78 镜头换人 · 由 K-Cinema build_director_rv2v.py 生成"}
    with zipfile.ZipFile(out_zip, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("pack.json", json.dumps(pack_meta, ensure_ascii=False, indent=1))
        z.writestr("timeline.json", json.dumps(timeline, ensure_ascii=False, indent=1))
        z.writestr("shared_params/shared_params.json",
                   json.dumps({"prompt": GLOBAL_PROMPT, "refs": [], "refAudios": [], "refVideos": []},
                              ensure_ascii=False, indent=1))
        for seg in timeline["segments"]:
            g = {k: seg[k] for k in ("id", "prompt", "negativePrompt", "durationSec", "frameCount", "length",
                                     "start", "taskType", "refs", "refAudios", "continuityFromPrev",
                                     "refImageSize")}
            z.writestr(f"asset_groups/{seg['id'][-3:]}/group.json", json.dumps(g, ensure_ascii=False, indent=1))
        z.write(source, "source_video/clip_1.mp4", compress_type=zipfile.ZIP_STORED)


def node_title(n):
    return n.get("title") or ""


def build_workflow(src_path, out_path, timeline_preview):
    wf = json.load(open(src_path, encoding="utf-8"))
    remove = {n["id"] for n in wf["nodes"] if node_title(n).startswith(FAIL_CHAIN_TITLES)}
    wf["nodes"] = [n for n in wf["nodes"] if n["id"] not in remove]
    dead = {l[0] for l in wf["links"] if l[1] in remove or l[3] in remove}
    wf["links"] = [l for l in wf["links"] if l[0] not in dead]
    for n in wf["nodes"]:
        for i in n.get("inputs", []):
            if i.get("link") in dead:
                i["link"] = None
        for o in n.get("outputs", []):
            if o.get("links"):
                o["links"] = [x for x in o["links"] if x not in dead]
        wv = n.get("widgets_values")
        if isinstance(wv, dict) and isinstance(wv.get("videopreview"), dict):
            wv["videopreview"] = {"paused": False, "hidden": False, "params": {}}   # 去掉个人存储地址

        if n["type"] == "LoraLoaderModelOnly" and "fl2v" in str(wv[0]):
            # 原工作流把 FL2V 的加速 LoRA 挂在 Ref2VA 模型上，换成 Ref2V 对应的版本
            n["widgets_values"] = [REF2V_LORA, 1]
        if n["type"] == "VHS_VideoCombine" and "故意失败" in node_title(n):
            n["title"] = "正式下载区｜无水印 MP4"
            wv["filename_prefix"] = "director_rv2v/stage"
        if n["type"] == "MiniMaxH3Director":
            v = n["widgets_values"]
            v[0] = TASK_RV2V
            v[1] = GLOBAL_PROMPT
            v[6], v[7], v[8], v[9] = float(FPS), OUT_W, OUT_H, OUT_W
            v[10] = timeline_preview["totalFrames"]
            # 节点里不放源视频（路径要靠导演包导入生成），只预置 rv2v 的输出设置
            empty = copy.deepcopy(timeline_preview)
            empty.update(segments=[], videoClips=[], totalFrames=124,
                         video={"fileName": "", "videoFile": "", "subfolder": "", "type": "input",
                                "frames": [], "frameMap": []})
            v[11] = json.dumps(empty, ensure_ascii=False)

    nid = max(n["id"] for n in wf["nodes"]) + 1
    wf["nodes"].append({
        "id": nid, "type": "MarkdownNote", "pos": [-320, -700], "size": [1120, 420], "flags": {}, "order": 0,
        "mode": 0, "inputs": [], "outputs": [], "properties": {}, "title": "镜头换人 · 使用步骤",
        "color": "#432", "bgcolor": "#653",
        "widgets_values": [
            "## 镜头换人（rv2v · 78 个镜头）\n\n"
            "1. 在导演台节点工具栏点 **导入导演包**，选择 `stage_78shots.mmxpack.zip`。"
            "导入后原视频和 78 个片段（与镜头切割包的编号一致）都已就位，**不要再在节点里重新上传视频**，"
            "否则分段会被重置成一段。\n"
            "2. 在时间轴上点选某个片段，往它的 **图片 1–9** 上传角色图：图片 1 是画面里最主要的人，"
            "多人时按从左到右的顺序继续往后传。不传图的片段等同于只做画面重绘（v2v）。\n"
            "3. 片段提示词已预置，可以按镜头补充谁对应谁。\n"
            "4. 打开 **选择运行**，只勾选已经传好图的片段；没勾选的片段导出时会用原片画面补齐。\n"
            "5. 声音用原片原声，段间衔接已关闭（镜头之间本来就是硬切）。\n\n"
            "替换用的角色需是虚构人物或已获得本人授权的人物。"
        ],
    })
    wf["last_node_id"] = nid
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(wf, f, ensure_ascii=False, indent=1)
    return sorted(remove)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--workflow", required=True, help="原「MiniMax H3 导演台全能工作流」JSON")
    ap.add_argument("--source", required=True, help="原视频（与镜头切割包同一个文件）")
    ap.add_argument("--shots", default=os.path.join(HERE, "shot_list.json"))
    ap.add_argument("--out-dir", default=HERE)
    args = ap.parse_args()

    shots = json.load(open(args.shots, encoding="utf-8"))
    probe = json.loads(subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v", "-count_frames", "-show_entries",
         "stream=width,height,nb_read_frames", "-of", "json", args.source],
        capture_output=True, text=True, check=True).stdout)["streams"][0]
    total = int(probe["nb_read_frames"])
    expected = shots[-1]["frame_out"] + 1
    if total != expected:
        raise SystemExit(f"原视频有 {total} 帧，镜头表覆盖 {expected} 帧，不是同一个视频？")

    timeline = build_timeline(shots, total, int(probe["width"]), int(probe["height"]))
    os.makedirs(args.out_dir, exist_ok=True)
    wf_out = os.path.join(args.out_dir, "h3_director_rv2v_78shots.json")
    removed = build_workflow(args.workflow, wf_out, timeline)
    pack_out = os.path.join(args.out_dir, "stage_78shots.mmxpack.zip")
    build_pack(shots, args.source, pack_out, timeline)
    print(f"工作流 → {wf_out}（删除节点 {removed}）")
    print(f"导演包 → {pack_out}（{len(shots)} 个片段，{total} 帧）")


if __name__ == "__main__":
    main()
