#!/usr/bin/env python3
"""把导演台生成的镜头拼回完整成片。生成过的镜头用新的，没生成的用原片镜头补上。

用法：
  python3 assemble_director.py --clips 切割包/clips --renders 下载的输出目录 --source 原视频.mp4 --out final.mp4

--renders 里按文件名找 shot_NNN_*.mp4（导演台的输出名），同一镜头有多个版本时取最新的一个。
--source 用来取整段原声；不给就把每个原片镜头自带的声音接起来。
"""

import argparse
import glob
import json
import os
import shutil
import subprocess
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))


def pick_render(renders, tag):
    files = glob.glob(os.path.join(renders, "**", f"shot_{tag}_*.mp4"), recursive=True)
    if not files:
        return None
    with_audio = [f for f in files if f.endswith("-audio.mp4")]
    return max(with_audio or files, key=os.path.getmtime)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--clips", required=True, help="切割包里的 clips 目录")
    ap.add_argument("--renders", required=True, help="导演台输出目录（RunningHub 下载解压后的文件夹）")
    ap.add_argument("--source", help="原视频，用来取整段原声")
    ap.add_argument("--shots", default=os.path.join(HERE, "shot_list.json"))
    ap.add_argument("--size", default="1068x480", help="成片尺寸，默认和原片一致")
    ap.add_argument("--out", default="director_final.mp4")
    args = ap.parse_args()

    shots = json.load(open(args.shots, encoding="utf-8"))
    w, h = args.size.split("x")
    tmp = tempfile.mkdtemp(prefix="director_")
    pieces, used = [], 0
    for s in shots:
        tag = f"{s['shot']:03d}"
        src = pick_render(args.renders, tag)
        if src:
            used += 1
        else:
            src = os.path.join(args.clips, f"shot_{tag}.mp4")
            if not os.path.exists(src):
                raise SystemExit(f"找不到镜头 {tag}：既没有生成结果，也没有原片 {src}")
        dst = os.path.join(tmp, f"{tag}.mp4")
        # 统一尺寸、帧率，并精确裁到镜头原长，保证拼接后时间轴和原片一致
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-an",
                        "-vf", f"scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},fps=24,setsar=1",
                        "-frames:v", str(s["frames"]), "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", dst],
                       check=True)
        pieces.append(dst)

    lst = os.path.join(tmp, "list.txt")
    with open(lst, "w", encoding="utf-8") as f:
        f.writelines(f"file '{p}'\n" for p in pieces)
    picture = os.path.join(tmp, "picture.mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", picture],
                   check=True)

    if args.source:
        audio_in = ["-i", args.source]
    else:
        alst = os.path.join(tmp, "audio.txt")
        with open(alst, "w", encoding="utf-8") as f:
            for s in shots:
                clip = os.path.abspath(os.path.join(args.clips, "shot_%03d.mp4" % s["shot"]))
                f.write(f"file '{clip}'\n")
        audio_in = ["-f", "concat", "-safe", "0", "-i", alst]
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", picture, *audio_in, "-map", "0:v", "-map", "1:a",
                    "-c:v", "copy", "-af", "apad", "-c:a", "aac", "-b:a", "192k", "-shortest", args.out], check=True)
    shutil.rmtree(tmp, ignore_errors=True)   # 音轨比画面短时用静音补齐，成片长度以画面为准
    print(f"已用生成镜头 {used}/{len(shots)} 个，其余用原片补齐 → {args.out}")


if __name__ == "__main__":
    main()
