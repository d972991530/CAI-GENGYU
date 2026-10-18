#!/usr/bin/env python3
"""换角预览台 · 本地生成与拼回原片（取代 RunningHub）

    python recast_local.py recast_job.json 原片.mp4 [--out 输出.mp4] [--mock] [--work 工作目录] [--only S009,S044]

流程：
  1. 按任务包里的时间码，直接从原片切出需要替换的镜头（帧精确，重新编码）
  2. 提交给本机 ComfyUI（任务包里的 API 格式工作流 + 节点映射），轮询并取回生成视频
     双人镜头：映射了“参考图 B / 点 B”就单轮完成，否则先换 A，再在结果上换 B
  3. 生成结果统一成原片的分辨率与帧率、对齐到原镜头时长（不足则冻结末帧补齐）
  4. 与未替换的镜头按原时间顺序拼接，并混入原片完整音轨 → 输出一条完整的成片

只依赖 Python 3 标准库与 ffmpeg / ffprobe。--mock 不调用 ComfyUI，用调色滤镜代替生成，
用来先验证切片与拼接链路。
"""
import argparse
import base64
import json
import math
import os
import random
import shutil
import subprocess
import sys
import time
import urllib.parse
import urllib.request
import uuid


def run(cmd):
    p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if p.returncode != 0:
        raise RuntimeError('命令失败：' + ' '.join(cmd) + '\n' + p.stderr[-2000:])
    return p.stdout


def probe(path):
    out = json.loads(run(['ffprobe', '-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', path]))
    v = next(s for s in out['streams'] if s['codec_type'] == 'video')
    num, den = (v.get('avg_frame_rate') or v.get('r_frame_rate') or '30/1').split('/')
    fps = float(num) / float(den) if float(den) else 30.0
    has_audio = any(s['codec_type'] == 'audio' for s in out['streams'])
    return {'w': int(v['width']), 'h': int(v['height']), 'fps': fps, 'duration': float(out['format']['duration']), 'audio': has_audio}


def fps_str(fps):
    for n, d in ((24000, 1001), (30000, 1001), (60000, 1001)):
        if abs(fps - n / d) < 0.01:
            return '%d/%d' % (n, d)
    return str(round(fps, 3))


VCODEC = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p']


def cut(film, start, dur, out, info):
    """从原片切一段（-ss 放在 -i 之后，逐帧解码到起点，保证帧精确）"""
    vf = 'scale=%d:%d,fps=%s' % (info['w'], info['h'], fps_str(info['fps']))
    run(['ffmpeg', '-y', '-v', 'error', '-i', film, '-ss', '%.4f' % start, '-t', '%.4f' % dur, '-an', '-vf', vf] + VCODEC + [out])


def normalize(src, dur, out, info):
    """生成结果 → 原片规格；时长不足冻结末帧补齐，超出截断"""
    W, H = info['w'], info['h']
    vf = ('scale=%d:%d:force_original_aspect_ratio=decrease,pad=%d:%d:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=%s,'
          'tpad=stop_mode=clone:stop_duration=%.3f' % (W, H, W, H, fps_str(info['fps']), dur))
    run(['ffmpeg', '-y', '-v', 'error', '-i', src, '-an', '-vf', vf, '-t', '%.4f' % dur] + VCODEC + [out])


# ----------------------------------------------------------------- ComfyUI
class Comfy:
    def __init__(self, url):
        self.url = url.rstrip('/')
        self.client = str(uuid.uuid4())

    def _req(self, path, data=None, headers=None):
        req = urllib.request.Request(self.url + path, data=data, headers=headers or {})
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.read()

    def upload(self, path):
        """上传到 ComfyUI 的 input 目录（图片与视频都走 /upload/image）"""
        boundary = '----recast' + uuid.uuid4().hex
        name = os.path.basename(path)
        with open(path, 'rb') as f:
            content = f.read()
        body = b''
        for k, v in (('type', 'input'), ('overwrite', 'true')):
            body += ('--%s\r\nContent-Disposition: form-data; name="%s"\r\n\r\n%s\r\n' % (boundary, k, v)).encode()
        body += ('--%s\r\nContent-Disposition: form-data; name="image"; filename="%s"\r\nContent-Type: application/octet-stream\r\n\r\n' % (boundary, name)).encode()
        body += content + ('\r\n--%s--\r\n' % boundary).encode()
        res = json.loads(self._req('/upload/image', body, {'Content-Type': 'multipart/form-data; boundary=' + boundary}))
        return (res.get('subfolder') + '/' if res.get('subfolder') else '') + res['name']

    def run_workflow(self, wf, timeout=3600):
        res = json.loads(self._req('/prompt', json.dumps({'prompt': wf, 'client_id': self.client}).encode(), {'Content-Type': 'application/json'}))
        if res.get('node_errors'):
            raise RuntimeError('工作流节点错误：' + json.dumps(res['node_errors'], ensure_ascii=False)[:1500])
        pid = res['prompt_id']
        t0 = time.time()
        while time.time() - t0 < timeout:
            time.sleep(3)
            hist = json.loads(self._req('/history/' + pid))
            if pid not in hist:
                continue
            h = hist[pid]
            st = h.get('status', {})
            if st.get('status_str') == 'error':
                raise RuntimeError('ComfyUI 执行出错：' + json.dumps(st.get('messages', []), ensure_ascii=False)[:1500])
            files = []
            for node_out in h.get('outputs', {}).values():
                for key in ('gifs', 'videos', 'images'):
                    for f in node_out.get(key, []) or []:
                        files.append(f)
            vids = [f for f in files if os.path.splitext(f.get('filename', ''))[1].lower() in ('.mp4', '.webm', '.mov', '.mkv', '.gif')]
            if vids or files:
                return (vids or files)[-1]
        raise RuntimeError('等待 ComfyUI 超时')

    def download(self, f, out):
        q = urllib.parse.urlencode({'filename': f['filename'], 'subfolder': f.get('subfolder', ''), 'type': f.get('type', 'output')})
        with open(out, 'wb') as fp:
            fp.write(self._req('/view?' + q))


def fill(wf, nodes, key, value):
    m = nodes.get(key) or {}
    nid, field = (m.get('nodeId') or '').strip(), (m.get('field') or '').strip()
    if not nid or not field or value is None:
        return
    if nid not in wf:
        raise RuntimeError('工作流里没有节点 %s（%s）' % (nid, key))
    wf[nid].setdefault('inputs', {})[field] = value


def pts_json(pts):
    return json.dumps([{'x': int(p[0]), 'y': int(p[1])} for p in pts])


def generate_shot(comfy, job, shot, src, workdir, img_paths):
    """返回生成视频路径。双人：节点映射里有 B 就单轮，否则两轮"""
    c = job['comfy']
    nodes = c.get('nodes') or {}
    dual = bool((nodes.get('refB') or {}).get('nodeId') and (nodes.get('ptsB') or {}).get('nodeId'))
    roles = [r for r in ('A', 'B') if r in shot['roles']]
    passes = [roles] if dual or len(roles) == 1 else [[r] for r in roles]
    cur = src
    for k, rs in enumerate(passes):
        wf = json.loads(json.dumps(c['workflow']))
        fill(wf, nodes, 'video', comfy.upload(cur))
        first = shot['roles'][rs[0]]
        if first.get('image') and first['image'] in img_paths:
            fill(wf, nodes, 'refA', comfy.upload(img_paths[first['image']]))
        fill(wf, nodes, 'ptsA', pts_json(first['points']))
        fill(wf, nodes, 'negA', pts_json(first.get('neg') or []))
        fill(wf, nodes, 'segA', first.get('seg'))
        if len(rs) == 2:
            sb = shot['roles'][rs[1]]
            if sb.get('image') and sb['image'] in img_paths:
                fill(wf, nodes, 'refB', comfy.upload(img_paths[sb['image']]))
            fill(wf, nodes, 'ptsB', pts_json(sb['points']))
            fill(wf, nodes, 'negB', pts_json(sb.get('neg') or []))
        fill(wf, nodes, 'prompt', shot['prompt'])
        fill(wf, nodes, 'frameCap', int(math.ceil((shot['end'] - shot['start']) * float(c.get('fps') or 16))))
        fill(wf, nodes, 'seed', random.randint(1, 2 ** 31 - 1))
        print('    提交 ComfyUI：%s 第 %d/%d 轮（%s）' % (shot['id'], k + 1, len(passes), '+'.join(rs)), flush=True)
        f = comfy.run_workflow(wf)
        out = os.path.join(workdir, '%s_gen%d%s' % (shot['id'], k + 1, os.path.splitext(f['filename'])[1] or '.mp4'))
        comfy.download(f, out)
        cur = out
    return cur


def mock_generate(src, out):
    """不调用模型：用色相旋转 + 描边模拟“已替换”，只为验证切片与拼接"""
    run(['ffmpeg', '-y', '-v', 'error', '-i', src, '-vf', 'hue=h=140:s=1.4,eq=contrast=1.15', '-an'] + VCODEC + [out])
    return out


def main():
    ap = argparse.ArgumentParser(description='换角预览台：本地 ComfyUI 生成并按原帧位置拼回原片')
    ap.add_argument('job')
    ap.add_argument('film')
    ap.add_argument('--out')
    ap.add_argument('--work')
    ap.add_argument('--mock', action='store_true', help='不调用 ComfyUI，用调色代替生成，验证切片与拼接')
    ap.add_argument('--only', help='只处理这些镜头，例如 S009,S044（其余用原片）')
    ap.add_argument('--keep', action='store_true', help='保留中间文件')
    a = ap.parse_args()
    for tool in ('ffmpeg', 'ffprobe'):
        if not shutil.which(tool):
            sys.exit('找不到 %s，请先安装并加入 PATH' % tool)

    job = json.load(open(a.job, encoding='utf-8'))
    if job.get('format') != 'recast-local-job':
        sys.exit('不是换角预览台导出的任务包')
    info = probe(a.film)
    if job.get('film') and abs(job['film'].get('duration', info['duration']) - info['duration']) > 0.5:
        print('警告：任务包记录的原片时长 %.2fs 与当前文件 %.2fs 不一致' % (job['film']['duration'], info['duration']))
    base = os.path.splitext(os.path.basename(a.film))[0]
    out = a.out or os.path.join(os.path.dirname(os.path.abspath(a.film)), base + '_替换版.mp4')
    work = a.work or os.path.join(os.path.dirname(os.path.abspath(out)), '_recast_work')
    os.makedirs(work, exist_ok=True)
    only = set(x.strip() for x in a.only.split(',')) if a.only else None

    # 参考图落盘
    img_paths = {}
    for key, im in (job.get('images') or {}).items():
        p = os.path.join(work, im['filename'])
        with open(p, 'wb') as f:
            f.write(base64.b64decode(im['b64']))
        img_paths[key] = p

    comfy = None
    if not a.mock:
        if not (job.get('comfy') or {}).get('workflow'):
            sys.exit('任务包里没有工作流（在换角预览台导出任务包时载入 ComfyUI 的 API 格式工作流 JSON），或用 --mock 先试拼接')
        comfy = Comfy(job['comfy']['url'])
        try:
            comfy._req('/system_stats')
        except Exception as e:
            sys.exit('连不上 ComfyUI（%s）：%s' % (job['comfy']['url'], e))

    shots = sorted(job['shots'], key=lambda s: s['start'])
    segments, t = [], 0.0
    todo = [s for s in shots if not s.get('keep') and s.get('roles') and (only is None or s['id'] in only)]
    print('原片 %s · %dx%d · %.3ffps · %.2fs；待生成 %d 个镜头' % (a.film, info['w'], info['h'], info['fps'], info['duration'], len(todo)), flush=True)
    idx = 0

    def add_original(start, end, tag):
        nonlocal idx
        if end - start < 0.5 / info['fps']:
            return
        idx += 1
        p = os.path.join(work, 'seg%04d_%s.mp4' % (idx, tag))
        cut(a.film, start, end - start, p, info)
        segments.append(p)

    for s in shots:
        if s['start'] > t + 1e-3:
            add_original(t, s['start'], 'gap')
        dur = s['end'] - s['start']
        if s in todo:
            src = os.path.join(work, s['id'] + '_src.mp4')
            cut(a.film, s['start'], dur, src, info)
            print('  %s  %.2f–%.2fs  %s' % (s['id'], s['start'], s['end'], s.get('lang') or ''), flush=True)
            gen = mock_generate(src, os.path.join(work, s['id'] + '_mock.mp4')) if a.mock else generate_shot(comfy, job, s, src, work, img_paths)
            idx += 1
            p = os.path.join(work, 'seg%04d_%s_gen.mp4' % (idx, s['id']))
            normalize(gen, dur, p, info)
            segments.append(p)
        else:
            add_original(s['start'], s['end'], s['id'])
        t = s['end']
    if info['duration'] > t + 1e-3:
        add_original(t, info['duration'], 'tail')

    lst = os.path.join(work, 'concat.txt')
    with open(lst, 'w', encoding='utf-8') as f:
        for p in segments:
            f.write("file '%s'\n" % os.path.abspath(p).replace("'", "'\\''"))
    video = os.path.join(work, 'video_only.mp4')
    run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', video])
    if info['audio']:
        run(['ffmpeg', '-y', '-v', 'error', '-i', video, '-i', a.film, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', out])
    else:
        shutil.copy(video, out)
    res = probe(out)
    print('完成：%s（%.2fs，原片 %.2fs）' % (out, res['duration'], info['duration']))
    if not a.keep:
        shutil.rmtree(work, ignore_errors=True)


if __name__ == '__main__':
    main()
