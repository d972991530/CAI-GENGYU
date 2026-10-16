#!/usr/bin/env python3
"""把 shots.json 编译成 MiniMax H3 的 ComfyUI API 工作流，批量渲染并拼成成片。

用法：
  python3 run_storyboard.py build                      # 只编译，输出 build/U01.json ... 可直接拖进 ComfyUI
  python3 run_storyboard.py render --units U01,U03     # 上传素材、排队渲染、下载到 renders/
  python3 run_storyboard.py assemble --pick U01=2      # 按镜头时长裁切、拼接、换上整首歌

只依赖 Python 标准库；render 需要能访问 ComfyUI，render/assemble 需要 ffmpeg。
"""

import argparse
import copy
import json
import os
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request
import uuid

HERE = os.path.dirname(os.path.abspath(__file__))
FPS = 24
MIN_FRAMES = 124   # 约 5.2 秒，H3 训练区间下限
MAX_FRAMES = 362   # 约 15.1 秒，训练区间上限


# ---------------------------------------------------------------- 时长换算

def align_frames(seconds):
    """H3 的帧数必须落在 17k+5 网格上，且在 124–362 之间。"""
    n = max(MIN_FRAMES, round(seconds * FPS))
    while n % 17 != 5:
        n += 1
    if n > MAX_FRAMES:
        raise ValueError(f"{seconds}s 超出 H3 单次生成上限（约 15 秒），请把这个单元拆开")
    return n


def fmt_sec(x):
    return f"{x:g}"


# ---------------------------------------------------------------- 配置与提示词

def load_config(path):
    with open(path, encoding="utf-8") as f:
        cfg = json.load(f)
    ids = [u["id"] for u in cfg["units"]]
    if len(ids) != len(set(ids)):
        raise ValueError("units 里有重复的 id")
    for u in cfg["units"]:
        for key in u.get("refs", []) + list(u.get("keyframes", {}).values()):
            if key not in cfg["references"]:
                raise ValueError(f"{u['id']} 引用了未登记的素材 {key}")
        if u["mode"] == "ref2va" and len(u.get("refs", [])) > 9:
            raise ValueError(f"{u['id']} 参考图超过 9 张（H3 上限）")
    return cfg


ASSUME_SONG = False   # build 时即使本地还没有歌，也按"有歌"编译出音乐节点


def music_mode(cfg, unit):
    """返回 'ref_audio' / 'anchor' / 'none'。"""
    mode = unit.get("music", cfg["sampling"].get("music_conditioning", "auto"))
    has_song = ASSUME_SONG or os.path.exists(os.path.join(HERE, cfg["project"]["song"]))
    if mode == "none" or not has_song:
        return "none"
    if mode == "auto":
        mode = "ref_audio" if unit["mode"] == "ref2va" else "anchor"
    if mode == "ref_audio" and (unit["mode"] != "ref2va" or not unit.get("refs")):
        return "none"   # Ref2VA 不允许只给音频参考
    if mode == "anchor" and unit["mode"] != "fl2va":
        return "none"
    return mode


def compose_prompt(cfg, unit, music):
    tags = {key: f"<Picture {i + 1}>" for i, key in enumerate(unit.get("refs", []))}

    def fill(text):
        def sub(m):
            key = m.group(1)
            if key not in tags:
                raise ValueError(f"{unit['id']} 的提示词用了 {{{key}}}，但它不在 refs 里")
            return tags[key]
        return re.sub(r"\{(\w+)\}", sub, text)

    lines = [fill(unit["header"]), "", "Timeline:"]
    for a, b, text in unit["timeline"]:
        lines.append(f"[{fmt_sec(a)}s-{fmt_sec(b)}s] {fill(text)}")
    lines += ["", fill(unit["camera"]), ""]
    audio = f"Audio: {unit['audio']}"
    if music == "ref_audio":
        audio += " <Audio 1> is the song for this section; land every move and every hard cut on its beat."
    elif music == "anchor":
        audio += " The soundtrack is fixed; movement accents land on its beats."
    lines += [audio, "", unit.get("constraints", cfg["constraints"])]
    return "\n".join(lines)


# ---------------------------------------------------------------- 图构建

def ref_name(cfg, key):
    rel = cfg["references"][key]
    return f"{cfg['project']['upload_subfolder_refs']}/{rel}"


def music_name(cfg, unit):
    return f"{cfg['project']['upload_subfolder_music']}/{unit['id']}.wav"


def apply_common(g, cfg, unit, unet_key, seed, take):
    m, s, p = cfg["models"], cfg["sampling"], cfg["project"]
    g["1"]["inputs"]["unet_name"] = m[unet_key]
    g["2"]["inputs"]["clip_name"] = m["text_encoder"]
    g["3"]["inputs"]["vae_name"] = m["video_vae"]
    g["4"]["inputs"]["vae_name"] = m["audio_vae"]
    g["5"]["inputs"]["shift_video"] = s["shift_video"]
    g["5"]["inputs"]["shift_audio"] = s["shift_audio"]
    g["30"]["inputs"]["noise_seed"] = seed
    g["31"]["inputs"]["sampler_name"] = s["sampler"]
    g["32"]["inputs"]["scheduler"] = s["scheduler"]
    g["32"]["inputs"]["steps"] = s["steps"]
    g["42"]["inputs"]["fps"] = float(p["fps"])
    g["43"]["inputs"]["filename_prefix"] = f"{p['output_prefix']}/{unit['id']}_t{take}"


def build_ref2va(cfg, unit, take):
    with open(os.path.join(HERE, "templates", "h3_ref2va_api.json"), encoding="utf-8") as f:
        g = json.load(f)
    music = music_mode(cfg, unit)
    for nid in [k for k, n in g.items() if n["class_type"] in ("LoadImage", "LoadAudio")]:
        del g[nid]
    node = g["20"]["inputs"]
    for k in [k for k in node if k.startswith(("ref_images.", "ref_audios.", "ref_videos."))]:
        del node[k]
    for i, key in enumerate(unit["refs"]):
        nid = str(100 + i)
        g[nid] = {"class_type": "LoadImage", "_meta": {"title": f"REF <Picture {i + 1}> {key}"},
                  "inputs": {"image": ref_name(cfg, key)}}
        node[f"ref_images.ref_image_{i}"] = [nid, 0]
    if music == "ref_audio":
        g["120"] = {"class_type": "LoadAudio", "_meta": {"title": "REF <Audio 1> 音乐切片"},
                    "inputs": {"audio": music_name(cfg, unit)}}
        node["ref_audios.ref_audio_0"] = ["120", 0]
    node["prompt"] = compose_prompt(cfg, unit, music)
    node["width"] = cfg["project"]["width"]
    node["height"] = cfg["project"]["height"]
    node["length"] = align_frames(unit["end"] - unit["start"])
    node["ref_image_size"] = cfg["sampling"]["ref_image_size"]
    apply_common(g, cfg, unit, "ref2va_unet", unit["seed"] + take - 1, take)
    return g


def build_fl2va(cfg, unit, take):
    with open(os.path.join(HERE, "templates", "h3_fl2va_api.json"), encoding="utf-8") as f:
        g = json.load(f)
    s = cfg["sampling"]
    music = music_mode(cfg, unit)
    keyframes = unit.get("keyframes", {})
    node = g["20"]["inputs"]

    for slot, nid in (("first", "10"), ("last", "11")):
        if slot in keyframes:
            g[nid]["inputs"]["image"] = ref_name(cfg, keyframes[slot])
        else:
            del g[nid]
            del node[f"{slot}_frame"]

    if music == "anchor":
        g["21"]["inputs"]["audio"] = music_name(cfg, unit)
    else:
        del g["21"], g["22"]
        g["33"]["inputs"]["conditioning"] = ["20", 0]

    if s.get("turbo"):
        g["6"]["inputs"]["lora_name"] = cfg["models"]["turbo_lora"]
    else:
        del g["6"]
        g["5"]["inputs"]["model"] = ["1", 0]

    node["prompt"] = compose_prompt(cfg, unit, music)
    node["width"] = cfg["project"]["width"]
    node["height"] = cfg["project"]["height"]
    node["length"] = align_frames(unit["end"] - unit["start"])
    apply_common(g, cfg, unit, "fl2va_unet", unit["seed"] + take - 1, take)
    if s.get("turbo"):
        g["32"]["inputs"]["steps"] = s["turbo_steps"]
    return g


def build_unit(cfg, unit, take=1):
    if unit["mode"] == "ref2va":
        return build_ref2va(cfg, unit, take)
    if unit["mode"] == "fl2va":
        return build_fl2va(cfg, unit, take)
    raise ValueError(f"{unit['id']} 的 mode 只能是 ref2va 或 fl2va")


def check_graph(g):
    """所有连线都要指向图里存在的节点。"""
    for nid, n in g.items():
        for k, v in n["inputs"].items():
            if isinstance(v, list) and len(v) == 2 and isinstance(v[0], str) and v[0] not in g:
                raise ValueError(f"节点 {nid}.{k} 连到了不存在的节点 {v[0]}")


# ---------------------------------------------------------------- ComfyUI 接口

def http_json(url, data=None):
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"} if body else {})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def upload(base, local_path, remote_name):
    subfolder, filename = os.path.split(remote_name)
    boundary = uuid.uuid4().hex
    with open(local_path, "rb") as f:
        payload = f.read()
    parts = []
    for name, value in (("subfolder", subfolder), ("type", "input"), ("overwrite", "true")):
        parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n".encode())
    parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"image\"; filename=\"{filename}\"\r\n"
                 f"Content-Type: application/octet-stream\r\n\r\n".encode() + payload + b"\r\n")
    parts.append(f"--{boundary}--\r\n".encode())
    req = urllib.request.Request(f"{base}/upload/image", data=b"".join(parts),
                                 headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    with urllib.request.urlopen(req, timeout=300) as r:
        r.read()


def slice_music(cfg, unit, out_path):
    seconds = align_frames(unit["end"] - unit["start"]) / FPS
    song = os.path.join(HERE, cfg["project"]["song"])
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(unit["start"]), "-t", f"{seconds:.3f}",
                    "-i", song, "-ac", "2", "-ar", "48000", out_path], check=True)


def wait_for(base, prompt_id, poll=5):
    while True:
        hist = http_json(f"{base}/history/{prompt_id}")
        if prompt_id in hist:
            entry = hist[prompt_id]
            status = entry.get("status", {})
            if status.get("status_str") == "error":
                raise RuntimeError(f"ComfyUI 报错：{json.dumps(status.get('messages', []), ensure_ascii=False)[:800]}")
            return entry["outputs"]
        time.sleep(poll)


def find_video(outputs):
    for out in outputs.values():
        for items in out.values():
            if isinstance(items, list):
                for it in items:
                    if isinstance(it, dict) and str(it.get("filename", "")).endswith((".mp4", ".webm", ".mkv")):
                        return it
    raise RuntimeError("没有在输出里找到视频文件")


# ---------------------------------------------------------------- 子命令

def select_units(cfg, arg):
    if not arg:
        return cfg["units"]
    wanted = set(arg.split(","))
    units = [u for u in cfg["units"] if u["id"] in wanted]
    missing = wanted - {u["id"] for u in units}
    if missing:
        raise SystemExit(f"找不到单元：{', '.join(sorted(missing))}")
    return units


def cmd_build(cfg, args):
    global ASSUME_SONG
    ASSUME_SONG = not args.no_song
    out_dir = os.path.join(HERE, "build")
    os.makedirs(out_dir, exist_ok=True)
    total = 0.0
    for u in select_units(cfg, args.units):
        g = build_unit(cfg, u)
        check_graph(g)
        with open(os.path.join(out_dir, f"{u['id']}.json"), "w", encoding="utf-8") as f:
            json.dump(g, f, ensure_ascii=False, indent=2)
        frames = align_frames(u["end"] - u["start"])
        total += frames / FPS
        print(f"{u['id']:5} {u['mode']:6} 镜{u['shots'][0]:>2}-{u['shots'][-1]:<2} "
              f"成片 {u['end'] - u['start']:>4g}s  生成 {frames}f ({frames / FPS:.2f}s)  音乐 {music_mode(cfg, u)}")
    print(f"共需生成约 {total:.1f} 秒素材，已写入 {out_dir}")


def cmd_render(cfg, args):
    base = args.url or cfg["project"]["comfy_url"]
    refs_dir = os.path.join(HERE, cfg["project"]["refs_dir"])
    tmp_dir = os.path.join(HERE, "build", "music")
    out_dir = os.path.join(HERE, "renders")
    os.makedirs(tmp_dir, exist_ok=True)
    os.makedirs(out_dir, exist_ok=True)
    client_id = uuid.uuid4().hex

    for u in select_units(cfg, args.units):
        keys = u.get("refs", []) + list(u.get("keyframes", {}).values())
        for key in keys:
            local = os.path.join(refs_dir, cfg["references"][key])
            if not os.path.exists(local):
                raise SystemExit(f"{u['id']} 缺少素材：{local}")
            upload(base, local, ref_name(cfg, key))
        if music_mode(cfg, u) != "none":
            wav = os.path.join(tmp_dir, f"{u['id']}.wav")
            slice_music(cfg, u, wav)
            upload(base, wav, music_name(cfg, u))

        for take in range(1, (args.takes or u.get("takes", 1)) + 1):
            dest = os.path.join(out_dir, f"{u['id']}_t{take}.mp4")
            if os.path.exists(dest) and not args.force:
                print(f"{u['id']} 第 {take} 条已存在，跳过（--force 可重渲）")
                continue
            g = build_unit(cfg, u, take)
            check_graph(g)
            res = http_json(f"{base}/prompt", {"prompt": g, "client_id": client_id})
            if res.get("node_errors"):
                raise SystemExit(f"{u['id']} 工作流校验失败：{json.dumps(res['node_errors'], ensure_ascii=False)[:800]}")
            print(f"{u['id']} 第 {take} 条已排队 {res['prompt_id']}")
            video = find_video(wait_for(base, res["prompt_id"]))
            q = urllib.parse.urlencode({"filename": video["filename"], "subfolder": video.get("subfolder", ""),
                                        "type": video.get("type", "output")})
            urllib.request.urlretrieve(f"{base}/view?{q}", dest)
            print(f"  → {dest}")


def cmd_assemble(cfg, args):
    picks = dict(p.split("=") for p in args.pick.split(",")) if args.pick else {}
    render_dir = os.path.join(HERE, "renders")
    work = os.path.join(HERE, "build", "trim")
    os.makedirs(work, exist_ok=True)
    p = cfg["project"]
    pieces = []
    for u in cfg["units"]:
        take = picks.get(u["id"], "1")
        src = os.path.join(render_dir, f"{u['id']}_t{take}.mp4")
        if not os.path.exists(src):
            raise SystemExit(f"缺少 {src}，先运行 render")
        dur = u["end"] - u["start"]
        dst = os.path.join(work, f"{u['id']}.mp4")
        # 生成长度按 17k+5 向上取整过，这里裁回分镜时长；统一编码，方便无损拼接
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-t", f"{dur:.3f}", "-an",
                        "-vf", f"fps={p['fps']},scale={p['width']}:{p['height']}:flags=lanczos,setsar=1",
                        "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p", dst], check=True)
        pieces.append(dst)

    lst = os.path.join(work, "concat.txt")
    with open(lst, "w", encoding="utf-8") as f:
        f.writelines(f"file '{x}'\n" for x in pieces)
    silent = os.path.join(work, "picture.mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", silent], check=True)

    os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
    final = os.path.join(HERE, "out", f"{p['output_prefix']}_final.mp4")
    song = os.path.join(HERE, p["song"])
    if os.path.exists(song):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", silent, "-i", song, "-map", "0:v", "-map", "1:a",
                        "-c:v", "copy", "-c:a", "aac", "-b:a", "320k", "-shortest", final], check=True)
    else:
        os.replace(silent, final)
        print("没有找到整首歌，成片不带音乐")
    print(f"成片：{final}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--config", default=os.path.join(HERE, "shots.json"))
    sub = ap.add_subparsers(dest="cmd", required=True)
    b = sub.add_parser("build")
    b.add_argument("--units")
    b.add_argument("--no-song", action="store_true", help="编译时不加音乐条件节点")
    r = sub.add_parser("render")
    r.add_argument("--units")
    r.add_argument("--takes", type=int)
    r.add_argument("--url")
    r.add_argument("--force", action="store_true")
    a = sub.add_parser("assemble")
    a.add_argument("--pick", help="每个单元选第几条，例如 U01=2,U07=1，默认都选 1")
    args = ap.parse_args()

    cfg = load_config(args.config)
    {"build": cmd_build, "render": cmd_render, "assemble": cmd_assemble}[args.cmd](cfg, args)


if __name__ == "__main__":
    sys.exit(main())
