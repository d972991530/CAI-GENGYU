/* 导出：CMX3600 EDL、FCPXML 1.9（达芬奇/FCP）、ffmpeg 渲染脚本（sh / bat）。
 * ctx = { items(已 layout), media[], title, fps, width, height } */
(function (g) {
  'use strict';
  const SC = (g.SC = g.SC || {});

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /** 把剪辑表量化到帧：记录时间按累计取整，避免逐段四舍五入累积漂移 */
  function frames(ctx) {
    const fps = ctx.fps || 25;
    const out = [];
    let rec = 0;
    for (const it of ctx.items) {
      const len = it.type === 'gap' ? it.dur : it.srcOut - it.srcIn;
      const r0 = Math.round(rec * fps);
      rec += len;
      const r1 = Math.round(rec * fps);
      if (r1 <= r0) continue;
      const e = { it, recIn: r0, recOut: r1, n: r1 - r0 };
      if (it.type === 'clip') { e.srcIn = Math.round(it.srcIn * fps); e.srcOut = e.srcIn + e.n; }
      out.push(e);
    }
    return out;
  }

  SC.exportEDL = function (ctx) {
    const fps = ctx.fps || 25;
    const tc = (f) => SC.toTC(f / fps, fps);
    const L = ['TITLE: ' + (ctx.title || 'Director Desk'), 'FCM: NON-DROP FRAME', ''];
    let ev = 0;
    for (const e of frames(ctx)) {
      if (e.it.type !== 'clip') continue;
      ev++;
      L.push(String(ev).padStart(3, '0') + '  AX       AA/V  C        ' + tc(e.srcIn) + ' ' + tc(e.srcOut) + ' ' + tc(e.recIn) + ' ' + tc(e.recOut));
      L.push('* FROM CLIP NAME: ' + e.it.name);
      if (e.it.seg) L.push('* COMMENT: ' + e.it.seg);
      L.push('');
    }
    return L.join('\r\n');
  };

  SC.exportFCPXML = function (ctx) {
    const fps = ctx.fps || 25;
    const r = (f) => f + '/' + fps + 's';
    const fr = frames(ctx);
    const mediaById = new Map(ctx.media.map((m) => [m.id, m]));
    const used = Array.from(new Set(fr.filter((e) => e.it.type === 'clip').map((e) => e.it.mediaId)));
    const aid = new Map(used.map((id, i) => [id, 'a' + (i + 1)]));
    const total = fr.length ? fr[fr.length - 1].recOut : 0;
    const X = [];
    X.push('<?xml version="1.0" encoding="UTF-8"?>', '<!DOCTYPE fcpxml>', '<fcpxml version="1.9">', '  <resources>');
    X.push('    <format id="r1" name="FFVideoFormat' + ctx.height + 'p' + fps + '" frameDuration="1/' + fps + 's" width="' + ctx.width + '" height="' + ctx.height + '"/>');
    for (const id of used) {
      const m = mediaById.get(id) || { name: id, duration: 0 };
      X.push('    <asset id="' + aid.get(id) + '" name="' + esc(m.name) + '" start="0s" duration="' + r(Math.round((m.duration || 0) * fps)) + '" hasVideo="1" hasAudio="' + (m.audio === null ? 0 : 1) + '" format="r1">');
      X.push('      <media-rep kind="original-media" src="file:///' + esc(encodeURI(m.name)) + '"/>');
      X.push('    </asset>');
    }
    X.push('  </resources>', '  <library>', '    <event name="' + esc(ctx.title || 'Director Desk') + '">', '      <project name="' + esc(ctx.title || 'Director Desk') + '">');
    X.push('        <sequence format="r1" duration="' + r(total) + '" tcStart="0s" tcFormat="NDF">', '          <spine>');
    for (const e of fr) {
      if (e.it.type === 'gap') X.push('            <gap name="' + esc(e.it.seg ? '缺素材 ' + e.it.seg : 'Gap') + '" offset="' + r(e.recIn) + '" start="0s" duration="' + r(e.n) + '"/>');
      else X.push('            <asset-clip ref="' + aid.get(e.it.mediaId) + '" name="' + esc((e.it.seg ? e.it.seg + ' ' : '') + e.it.name) + '" offset="' + r(e.recIn) + '" start="' + r(e.srcIn) + '" duration="' + r(e.n) + '" format="r1" tcFormat="NDF"/>');
    }
    X.push('          </spine>', '        </sequence>', '      </project>', '    </event>', '  </library>', '</fcpxml>');
    return X.join('\n');
  };

  /** ffmpeg 渲染脚本：逐段切出统一规格的中间文件，再无损拼接。放到素材目录运行。 */
  SC.exportFFmpeg = function (ctx, flavor) {
    const fps = ctx.fps || 25, W = ctx.width, H = ctx.height;
    const vf = 'scale=' + W + ':' + H + ':force_original_aspect_ratio=decrease,pad=' + W + ':' + H + ':(ow-iw)/2:(oh-ih)/2,setsar=1,fps=' + fps + ',format=yuv420p';
    const enc = '-c:v libx264 -preset fast -crf 18 -c:a aac -b:a 192k -ar 48000 -ac 2';
    const fr = frames(ctx);
    const out = (ctx.title || 'output').replace(/[\\/:*?"<>|\s]+/g, '_') + '.mp4';
    const sec = (f) => (f / fps).toFixed(3);
    const parts = [];
    if (flavor === 'bat') {
      const L = ['@echo off', 'chcp 65001 >nul', 'rem 导演工作台导出：把本文件放到素材所在目录，双击运行（需已安装 ffmpeg 并加入 PATH）', 'setlocal', 'if not exist _dd_parts mkdir _dd_parts', 'type nul > _dd_parts\\list.txt', ''];
      fr.forEach((e, i) => {
        const p = String(i + 1).padStart(4, '0') + '.mp4';
        parts.push(p);
        if (e.it.type === 'gap') L.push('ffmpeg -y -v error -f lavfi -i color=c=black:s=' + W + 'x' + H + ':r=' + fps + ' -f lavfi -i anullsrc=r=48000:cl=stereo -t ' + sec(e.n) + ' -vf format=yuv420p ' + enc + ' -shortest "_dd_parts\\' + p + '" || goto :err');
        else L.push('call :cut "' + e.it.name + '" ' + sec(e.srcIn) + ' ' + sec(e.n) + ' "_dd_parts\\' + p + '" || goto :err');
        L.push('echo file \'' + p + '\'>> _dd_parts\\list.txt');
      });
      L.push('ffmpeg -y -v error -f concat -safe 0 -i _dd_parts\\list.txt -c copy "' + out + '" || goto :err', 'echo 完成：' + out, 'goto :eof', '', ':cut');
      L.push('set HASA=', 'for /f %%a in (\'ffprobe -v error -select_streams a -show_entries stream^=index -of csv^=p^=0 %1\') do set HASA=1');
      L.push('if defined HASA (', '  ffmpeg -y -v error -ss %2 -i %1 -t %3 -vf "' + vf + '" ' + enc + ' %4', ') else (', '  ffmpeg -y -v error -ss %2 -i %1 -f lavfi -i anullsrc=r=48000:cl=stereo -t %3 -map 0:v:0 -map 1:a:0 -vf "' + vf + '" ' + enc + ' -shortest %4', ')', 'exit /b %errorlevel%', '', ':err', 'echo 渲染失败', 'exit /b 1');
      return L.join('\r\n');
    }
    const q = (s) => "'" + String(s).replace(/'/g, "'\\''") + "'";
    const L = ['#!/usr/bin/env bash', '# 导演工作台导出：把本脚本放到素材所在目录运行（需要 ffmpeg / ffprobe）', 'set -euo pipefail', 'cd "$(dirname "$0")"', 'mkdir -p _dd_parts && : > _dd_parts/list.txt', 'VF=' + q(vf), 'ENC=(' + enc + ')', '',
      'cut() { # 源文件 入点 时长 输出',
      '  if [ -n "$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$1")" ]; then',
      '    ffmpeg -y -v error -ss "$2" -i "$1" -t "$3" -vf "$VF" "${ENC[@]}" "$4"',
      '  else',
      '    ffmpeg -y -v error -ss "$2" -i "$1" -f lavfi -i anullsrc=r=48000:cl=stereo -t "$3" -map 0:v:0 -map 1:a:0 -vf "$VF" "${ENC[@]}" -shortest "$4"',
      '  fi', '}',
      'gap() { # 时长 输出',
      '  ffmpeg -y -v error -f lavfi -i color=c=black:s=' + W + 'x' + H + ':r=' + fps + ' -f lavfi -i anullsrc=r=48000:cl=stereo -t "$1" -vf format=yuv420p "${ENC[@]}" -shortest "$2"', '}', ''];
    fr.forEach((e, i) => {
      const p = String(i + 1).padStart(4, '0') + '.mp4';
      L.push(e.it.type === 'gap' ? 'gap ' + sec(e.n) + ' _dd_parts/' + p + (e.it.seg ? '   # 缺素材 ' + e.it.seg : '') : 'cut ' + q(e.it.name) + ' ' + sec(e.srcIn) + ' ' + sec(e.n) + ' _dd_parts/' + p + (e.it.seg ? '   # ' + e.it.seg : ''));
      L.push("echo \"file '" + p + "'\" >> _dd_parts/list.txt");
    });
    L.push('ffmpeg -y -v error -f concat -safe 0 -i _dd_parts/list.txt -c copy ' + q(out), 'echo "完成：' + out + '"');
    return L.join('\n') + '\n';
  };
})(typeof window !== 'undefined' ? window : globalThis);
