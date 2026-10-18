/* 导演工作台主程序：状态、面板渲染、参数台、素材导入与分析、求解、手动编辑、工程存取、导出。 */
(function () {
  'use strict';
  const SC = window.SC;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const h = (tag, attrs, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'style') el.style.cssText = v;
      else if (k in el && k !== 'list') { try { el[k] = v; } catch (e) { el.setAttribute(k, v); } }
      else el.setAttribute(k, v);
    }
    for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return el;
  };
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem('dd.' + k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('dd.' + k, JSON.stringify(v)); } catch (e) { /* 隐私模式等 */ } },
  };

  /* ------------------------------------------------------------------ 状态 */
  const S = {
    title: '我的影片',
    scriptText: '',
    script: null,
    media: [],
    overrides: {},
    params: Object.assign(SC.deepClone(SC.DEFAULT_PARAMS), store.get('params') || {}),
    result: null,
    items: [],
    report: null,
    shotsById: new Map(),
    manual: false,
    sel: -1,
    selSeg: null,
    playhead: 0,
    undo: [],
    redo: [],
    task: null,
  };

  /* ------------------------------------------------------------------ 日志 / 进度 */
  function log(msg, cls) {
    const box = $('#log');
    const line = h('div', { class: cls || '' }, new Date().toTimeString().slice(0, 8) + '  ' + msg);
    box.append(line);
    box.scrollTop = box.scrollHeight;
  }
  function progress(name, f) {
    $('#taskName').textContent = name;
    $('#bar').style.width = f == null ? '0' : Math.round(f * 100) + '%';
    $('#pct').textContent = f == null ? '' : Math.round(f * 100) + '%';
  }

  /* ------------------------------------------------------------------ 剧本 */
  function applyScript(text, quiet) {
    text = String(text || '').trim();
    if (!text) {
      S.script = null; S.scriptText = '';
      store.set('script', '');
      if (!quiet) log('已清空剧本 → 非线性编排模式');
      return true;
    }
    const sc = SC.parseScript(text);
    if (!sc.segments.length) throw new Error('没有识别到任何段落。' + (sc.warnings[0] || ''));
    S.script = sc; S.scriptText = text;
    if (sc.title && sc.title !== '未命名剧本') S.title = sc.title;
    store.set('script', text);
    if (!quiet) {
      log('剧本已载入：' + sc.title + ' · ' + sc.segments.length + ' 段 · ' + sc.lines.length + ' 条线 · ' + sc.chains.length + ' 条伏笔 · 总长 ' + SC.fmtTime(sc.duration), 'ok');
      sc.warnings.slice(0, 5).forEach((w) => log(w, 'err'));
    }
    return true;
  }

  function openScriptDialog() {
    $('#scriptText').value = S.scriptText || '';
    $('#scriptMsg').textContent = '';
    $('#scriptDlg').showModal();
  }
  $('#scriptSample').onclick = () => { $('#scriptText').value = SC.SAMPLE_SCRIPT; };
  $('#scriptClear').onclick = () => { $('#scriptText').value = ''; };
  $('#scriptFile').onclick = () => $('#fileScript').click();
  $('#fileScript').onchange = async (e) => {
    const f = e.target.files[0];
    if (f) $('#scriptText').value = await f.text();
    e.target.value = '';
  };
  $('#scriptApply').onclick = () => {
    try {
      applyScript($('#scriptText').value);
      $('#scriptDlg').close();
      S.manual = false;
      solve();
    } catch (err) { $('#scriptMsg').textContent = '解析失败：' + err.message; }
  };
  $('#scriptText').addEventListener('input', () => {
    try {
      const sc = SC.parseScript($('#scriptText').value);
      $('#scriptMsg').textContent = sc.segments.length ? '识别 ' + sc.segments.length + ' 段 · ' + sc.lines.length + ' 线 · ' + sc.acts.length + ' 幕 · ' + sc.chains.length + ' 伏笔' + (sc.warnings.length ? ' · ' + sc.warnings.length + ' 行无法识别：' + sc.warnings[0] : '') : '尚未识别到段落';
    } catch (err) { $('#scriptMsg').textContent = err.message; }
  });

  /* ------------------------------------------------------------------ 素材导入 */
  const VIDEO_EXT = /\.(mp4|mov|m4v|mkv|webm|avi|mts|m2ts|ogv)$/i;
  async function importFiles(files) {
    files = Array.from(files);
    const sidecars = files.filter((f) => /\.(txt|srt|json)$/i.test(f.name));
    const videos = files.filter((f) => VIDEO_EXT.test(f.name) || (f.type || '').startsWith('video/'));
    const added = [];
    for (const f of videos) {
      let m = S.media.find((x) => x.name === f.name);
      if (m && m.url) { log('已存在，跳过：' + f.name); continue; }
      if (m) { m.file = f; m.url = URL.createObjectURL(f); log('已重新关联：' + f.name, 'ok'); continue; }
      m = { id: SC.uid('m'), name: f.name, file: f, url: URL.createObjectURL(f), duration: 0, note: '', line: null, shots: [], status: 'new' };
      S.media.push(m);
      added.push(m);
    }
    for (const f of sidecars) {
      const base = SC.baseName(f.name);
      const m = S.media.find((x) => SC.baseName(x.name) === base);
      if (!m) { log('描述文件没有对应素材：' + f.name, 'err'); continue; }
      let txt = await f.text();
      if (/\.srt$/i.test(f.name)) txt = txt.replace(/^\d+\s*$/gm, '').replace(/^[\d:,.\s\->]+$/gm, '').replace(/\n{2,}/g, '\n').trim();
      if (/\.json$/i.test(f.name)) {
        try {
          const j = JSON.parse(txt);
          if (j.lang) m.lang = j.lang; // 镜头语言标注（景别 / 角度 / 运动 / 方向）
          txt = j.prompt || j.description || j.desc || j.text || (j.lang ? '' : txt);
        } catch (e) { /* 原样 */ }
      }
      m.note = (m.note ? m.note + '\n' : '') + txt.slice(0, 2000);
      log('读入描述：' + f.name + ' → ' + m.name);
    }
    S.media.sort((a, b) => SC.naturalCompare(a.name, b.name));
    for (const m of added) {
      try {
        await SC.probeMedia(m);
        m.shots = [{ in: 0, out: m.duration, feat: null, prof: null }];
        m.status = 'probed';
      } catch (err) { m.status = 'error'; log(m.name + ' 无法读取：' + err.message, 'err'); }
    }
    if (added.length) log('导入 ' + added.length + ' 个素材。可直接按文件名/描述生成，或点“分析素材”提取画面与声音特征。', 'ok');
    renderMedia();
    if (added.length && !S.manual) solve();
    else renderAll(); // 仅重新关联文件时保留现有（含手动编辑的）时间轴
    if (added.length && S.media.length <= 40) analyzeAll();
  }
  $('#fileMedia').onchange = (e) => { importFiles(e.target.files); e.target.value = ''; };
  const drop = $('#drop');
  ['dragover', 'dragenter'].forEach((ev) => document.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ev) => document.addEventListener(ev, (e) => { e.preventDefault(); if (ev === 'drop' || e.target === drop) drop.classList.remove('over'); }));
  document.addEventListener('drop', (e) => {
    const files = Array.from(e.dataTransfer.files || []);
    const scriptFile = files.length === 1 && /\.(txt|md)$/i.test(files[0].name) && !S.media.some((m) => SC.baseName(m.name) === SC.baseName(files[0].name));
    if (scriptFile) { files[0].text().then((t) => { openScriptDialog(); $('#scriptText').value = t; $('#scriptText').dispatchEvent(new Event('input')); }); return; }
    if (files.some((f) => /\.ddproj|\.json$/i.test(f.name)) && files.length === 1 && !S.media.length) { openProject(files[0]); return; }
    importFiles(files);
  });

  /* ------------------------------------------------------------------ 分析 */
  async function analyzeAll(force) {
    if (S.task) { log('已有任务在运行'); return; }
    const todo = S.media.filter((m) => m.url && (force || !m.samples));
    if (!todo.length) { log('没有需要分析的素材'); return; }
    const sig = { cancelled: false };
    S.task = sig;
    try {
      for (let k = 0; k < todo.length; k++) {
        const m = todo[k];
        m.status = 'analyzing';
        renderMedia();
        const t0 = performance.now();
        await SC.analyzeMedia(m, {
          signal: sig,
          onProgress: (f) => { m.progress = f; progress('分析素材 ' + (k + 1) + '/' + todo.length + ' · ' + m.name, (k + f) / todo.length); updateMediaStatus(m); },
        });
        m.shots = SC.buildShots(m, S.params.threshold, S.params.minShot);
        m.status = 'done';
        log('分析完成：' + m.name + ' · ' + m.shots.length + ' 个镜头 · ' + (m.audio ? '有声' : '无声轨') + ' · ' + ((performance.now() - t0) / 1000).toFixed(1) + 's');
        renderMedia();
        if (!S.manual) solve(true);
      }
      progress('分析完成', 1);
    } catch (err) {
      log('分析中止：' + err.message, 'err');
      S.media.forEach((m) => { if (m.status === 'analyzing') m.status = m.samples ? 'done' : 'probed'; });
      progress('已中止', null);
    } finally {
      S.task = null;
      renderMedia();
      if (!S.manual) solve();
      else { log('素材特征已更新；时间轴有手动编辑，未自动重算'); renderAll(); }
    }
  }

  function resegment() {
    for (const m of S.media) if (m.samples) m.shots = SC.buildShots(m, S.params.threshold, S.params.minShot);
  }

  /* ------------------------------------------------------------------ 求解 */
  function solve(silent) {
    const t0 = performance.now();
    const res = SC.solve({ script: S.script, media: S.media.filter((m) => m.shots && m.shots.length && m.duration), params: S.params, overrides: S.overrides });
    S.result = res;
    S.shotsById = new Map(res.shots.map((s) => [s.id, s]));
    S.items = res.items;
    S.report = res.report;
    S.manual = false;
    S.sel = -1;
    S.undo = []; S.redo = [];
    const ms = performance.now() - t0;
    if (!silent) log((res.mode === 'linear' ? '线性对位' : '非线性编排') + '完成：' + res.items.filter((i) => i.type === 'clip').length + ' 个剪辑 · 成片 ' + SC.fmtTime(res.report.total, true) + ' · 用时 ' + ms.toFixed(0) + 'ms');
    renderAll();
  }

  let solveTimer = 0;
  function paramsChanged(resegmentToo) {
    store.set('params', S.params);
    clearTimeout(solveTimer);
    solveTimer = setTimeout(() => {
      if (resegmentToo) { resegment(); renderMedia(); }
      if ($('#autoSolve').checked && !S.manual) solve(true);
      else renderParams();
    }, 70);
  }

  function rereport() {
    S.report = SC.report(S.items, { script: S.result && S.result.mode === 'linear' ? S.script : null, P: S.params, shotsById: S.shotsById });
  }

  /* ------------------------------------------------------------------ 手动编辑 */
  function snapshot() { S.undo.push(JSON.stringify(S.items)); if (S.undo.length > 100) S.undo.shift(); S.redo = []; }
  function edited() { S.manual = true; SC.layout(S.items); rereport(); renderAll(); }
  const mediaById = (id) => S.media.find((m) => m.id === id);

  const ops = {
    split() {
      const t = S.playhead;
      const i = S.items.findIndex((it) => t > it.rec + 0.04 && t < it.rec + it.len - 0.04);
      if (i < 0) return log('播放头不在可分割的片段内');
      snapshot();
      const it = S.items[i];
      const a = Object.assign({}, it), b = Object.assign({}, it);
      if (it.type === 'gap') { a.dur = t - it.rec; b.dur = it.len - a.dur; }
      else { a.srcOut = it.srcIn + (t - it.rec); b.srcIn = a.srcOut; }
      S.items.splice(i, 1, a, b);
      S.sel = i + 1;
      edited();
    },
    delete() {
      if (S.sel < 0) return log('先在时间轴上选中一个片段');
      snapshot();
      S.items.splice(S.sel, 1);
      S.sel = Math.min(S.sel, S.items.length - 1);
      edited();
    },
    up() { if (S.sel > 0) { snapshot(); const [x] = S.items.splice(S.sel, 1); S.items.splice(--S.sel, 0, x); edited(); } },
    down() { if (S.sel >= 0 && S.sel < S.items.length - 1) { snapshot(); const [x] = S.items.splice(S.sel, 1); S.items.splice(++S.sel, 0, x); edited(); } },
    undo() { if (!S.undo.length) return; S.redo.push(JSON.stringify(S.items)); S.items = JSON.parse(S.undo.pop()); edited(); },
    redo() { if (!S.redo.length) return; S.undo.push(JSON.stringify(S.items)); S.items = JSON.parse(S.redo.pop()); edited(); },
  };
  let trimBase = null;
  function onTrim(i, edge, delta, phase) {
    const it = S.items[i];
    if (!it) return;
    if (phase === 'start') { snapshot(); trimBase = Object.assign({}, it); return; }
    if (phase === 'end') { trimBase = null; edited(); return; }
    const b = trimBase;
    if (it.type === 'gap') {
      it.dur = Math.max(0.1, b.dur + (edge === 'out' ? delta : -delta));
    } else {
      const m = mediaById(it.mediaId);
      const maxOut = m ? m.duration : b.srcOut;
      if (edge === 'in') it.srcIn = SC.clamp(b.srcIn + delta, 0, it.srcOut - 0.1);
      else it.srcOut = SC.clamp(b.srcOut + delta, it.srcIn + 0.1, maxOut);
    }
    S.manual = true;
    SC.layout(S.items);
    renderTimeline();
  }
  function onMove(from, to) {
    snapshot();
    const [x] = S.items.splice(from, 1);
    if (to > from) to--;
    S.items.splice(to, 0, x);
    S.sel = to;
    edited();
  }

  /* ------------------------------------------------------------------ 参数台 */
  const PDEF = [
    { g: '编辑方式', items: [{ k: 'mode', t: 'select', label: '模式', opts: [['auto', '自动（有剧本→线性）'], ['linear', '线性：按剧本时间线对位'], ['nonlinear', '非线性：无剧本自动编排']] }] },
    { g: '镜头切分', note: '改动即时重切', items: [
      { k: 'threshold', label: '分镜阈值', min: 0.05, max: 0.9, step: 0.01, reseg: true },
      { k: 'minShot', label: '最短镜头 s', min: 0.2, max: 4, step: 0.1, reseg: true },
    ] },
    { g: '线性对位 · 匹配权重', mode: 'linear', items: [
      { k: 'wId', label: '文件名编号', min: 0, max: 6, step: 0.1 },
      { k: 'wText', label: '文本相似', min: 0, max: 3, step: 0.05 },
      { k: 'wLine', label: '线索视觉签名', min: 0, max: 3, step: 0.05 },
      { k: 'wDur', label: '时长贴合', min: 0, max: 3, step: 0.05 },
      { k: 'wEnergy', label: '能量↔剧情强度', min: 0, max: 3, step: 0.05 },
      { k: 'wDialog', label: '对白↔台词', min: 0, max: 3, step: 0.05 },
      { k: 'wOrder', label: '素材顺序', min: 0, max: 3, step: 0.05 },
      { k: 'wLang', label: '景别/运动↔剧本', min: 0, max: 3, step: 0.05 },
      { k: 'minScore', label: '置信阈值', min: 0, max: 1, step: 0.01 },
      { k: 'spread', label: '铺开度', min: 0, max: 2, step: 0.05 },
      { k: 'ripple', t: 'check', label: '闭合空缺（不保留缺素材的时长）' },
    ] },
    { g: '非线性编排', mode: 'nonlinear', items: [
      { k: 'target', label: '目标时长 s', min: 0, max: 1800, step: 1, fmt: (v) => (v ? v : '全部') },
      { k: 'asl', label: '平均镜头长 s', min: 0.5, max: 10, step: 0.1 },
      { k: 'pacing', label: '节奏张弛', min: 0, max: 1, step: 0.01 },
      { k: 'crossCut', label: '穿插频率', min: 0, max: 1, step: 0.01 },
      { k: 'continuity', label: '跳切 ← 衔接 → 顺接', min: -1, max: 1, step: 0.01 },
      { k: 'orderKeep', label: '保持源顺序', min: 0, max: 2, step: 0.05 },
      { k: 'variety', label: '去重复', min: 0, max: 1, step: 0.01 },
      { k: 'wGrammar', label: '镜头语法（防跳切/越轴）', min: 0, max: 3, step: 0.05 },
      { k: 'wSizeArc', label: '景别随情绪推近', min: 0, max: 3, step: 0.05 },
      { k: 'clusters', label: '视觉分组数', min: 0, max: 6, step: 1, fmt: (v) => (v ? v : '自动') },
      { k: 'beam', label: '搜索宽度', min: 1, max: 64, step: 1 },
    ] },
    { g: '情绪曲线 · 建置 / 发展 / 转折 / 高潮', mode: 'nonlinear', curve: true, items: [
      { k: 'curve.0', label: '建置 强度', min: 0, max: 1, step: 0.01 },
      { k: 'curve.1', label: '发展 强度', min: 0, max: 1, step: 0.01 },
      { k: 'curve.2', label: '转折 强度', min: 0, max: 1, step: 0.01 },
      { k: 'curve.3', label: '高潮 强度', min: 0, max: 1, step: 0.01 },
      { k: 'actSplit.0', label: '建置 占比', min: 0.05, max: 1, step: 0.01 },
      { k: 'actSplit.1', label: '发展 占比', min: 0.05, max: 1, step: 0.01 },
      { k: 'actSplit.2', label: '转折 占比', min: 0.05, max: 1, step: 0.01 },
      { k: 'actSplit.3', label: '高潮 占比', min: 0.05, max: 1, step: 0.01 },
    ] },
    { g: '输出', items: [
      { k: 'fps', t: 'select', label: '帧率', opts: [[24, '24'], [25, '25'], [30, '30'], [50, '50'], [60, '60']], num: true },
      { k: 'res', t: 'select', label: '画幅', opts: [['1920x1080', '1920×1080'], ['3840x2160', '3840×2160'], ['1080x1920', '1080×1920 竖屏'], ['1280x720', '1280×720']] },
    ] },
  ];
  const getP = (k) => { if (k === 'res') return S.params.width + 'x' + S.params.height; const [a, b] = k.split('.'); return b == null ? S.params[a] : S.params[a][+b]; };
  const setP = (k, v) => {
    if (k === 'res') { const [w, hh] = v.split('x').map(Number); S.params.width = w; S.params.height = hh; return; }
    const [a, b] = k.split('.');
    if (b == null) S.params[a] = v; else { S.params[a] = S.params[a].slice(); S.params[a][+b] = v; }
  };
  const fmtNum = (v) => (Math.abs(v) >= 100 ? String(Math.round(v)) : (+v).toFixed(2).replace(/\.?0+$/, '') || '0');

  function renderParams() {
    const box = $('#params');
    const mode = S.result ? S.result.mode : S.script ? 'linear' : 'nonlinear';
    box.innerHTML = '';
    for (const grp of PDEF) {
      if (grp.mode && grp.mode !== mode) continue; // 只显示当前模式生效的参数组
      const g = h('div', { class: 'pgroup' }, h('h4', {}, grp.g, h('span', { class: 'muted' }, grp.note || '')));
      if (grp.curve) {
        const cv = h('canvas', { width: 600, height: 120 });
        g.append(h('div', { class: 'curve-box' }, cv));
        requestAnimationFrame(() => drawCurve(cv));
      }
      for (const it of grp.items) {
        if (it.t === 'select') {
          const sel = h('select', { onchange: (e) => { setP(it.k, it.num ? Number(e.target.value) : e.target.value); paramsChanged(); if (it.k === 'mode') { S.manual = false; solve(); } } },
            it.opts.map(([v, l]) => h('option', { value: v, selected: String(getP(it.k)) === String(v) }, l)));
          g.append(h('div', { class: 'prow' }, h('label', {}, it.label), sel));
        } else if (it.t === 'check') {
          g.append(h('label', { class: 'chk', style: 'margin:4px 0' }, h('input', { type: 'checkbox', checked: !!getP(it.k), onchange: (e) => { setP(it.k, e.target.checked); paramsChanged(); } }), it.label));
        } else {
          const out = h('output', {}, (it.fmt || fmtNum)(getP(it.k)));
          const rng = h('input', { type: 'range', min: it.min, max: it.max, step: it.step, value: getP(it.k), oninput: (e) => {
            const v = Number(e.target.value);
            setP(it.k, v);
            out.textContent = (it.fmt || fmtNum)(v);
            if (grp.curve) drawCurve(box.querySelector('canvas'));
            paramsChanged(it.reseg);
          } });
          g.append(h('div', { class: 'prow' }, h('label', { title: it.k }, it.label), rng, out));
        }
      }
      box.append(g);
    }
    box.append(h('div', { class: 'pgroup' },
      h('button', { onclick: () => { const keep = { fps: S.params.fps, width: S.params.width, height: S.params.height }; S.params = Object.assign(SC.deepClone(SC.DEFAULT_PARAMS), keep); resegment(); store.set('params', S.params); S.manual = false; solve(); } }, '恢复默认参数')));
  }

  function drawCurve(cv) {
    if (!cv) return;
    const c = cv.getContext('2d'), W = cv.width, H = cv.height, P = S.params;
    c.clearRect(0, 0, W, H);
    const tot = SC.sum(P.actSplit) || 1;
    let a = 0;
    const cols = ['#24384f', '#2b3f58', '#3a3550', '#4a3030'], names = ['建置', '发展', '转折', '高潮'];
    P.actSplit.forEach((w, i) => {
      c.fillStyle = cols[i]; c.fillRect((a / tot) * W, 0, (w / tot) * W - 2, H);
      c.fillStyle = '#9fb3c8'; c.font = '20px sans-serif'; c.fillText(names[i], (a / tot) * W + 6, 24);
      a += w;
    });
    c.strokeStyle = '#f0a030'; c.lineWidth = 4; c.beginPath();
    for (let x = 0; x <= W; x += 4) { const y = H - 8 - SC.curveAt(P, x / W) * (H - 16); x ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke();
  }

  /* ------------------------------------------------------------------ 面板渲染 */
  function lineOptions(cur, autoLabel) {
    const lines = S.script ? S.script.lines : [];
    return [h('option', { value: '', selected: !cur }, autoLabel || '线索：自动')].concat(lines.map((l) => h('option', { value: l.id, selected: cur === l.id }, l.id + ' ' + l.name.replace(/（.*$/, ''))));
  }

  function mediaStatus(m) {
    if (!m.url) return ['需重新导入该文件', 'err'];
    if (m.status === 'analyzing') return ['分析中 ' + Math.round((m.progress || 0) * 100) + '%', 'warn'];
    if (m.status === 'error') return ['无法读取', 'err'];
    if (m.samples) return ['已分析 · ' + m.shots.length + ' 镜头 · ' + (m.audio ? '有声' : '无声'), 'ok'];
    return ['待分析（目前仅用文件名/描述）', 'warn'];
  }
  function updateMediaStatus(m) {
    const el = document.querySelector('[data-mstatus="' + m.id + '"]');
    if (el) { const [t, c] = mediaStatus(m); el.textContent = t; el.className = 'status ' + c; }
  }

  function renderMedia() {
    const box = $('#mediaList');
    box.innerHTML = '';
    $('#drop').hidden = S.media.length > 0;
    for (const m of S.media) {
      const [st, cls] = mediaStatus(m);
      const guess = S.result ? S.result.shots.filter((s) => s.mediaId === m.id) : [];
      const g0 = guess[0];
      const auto = g0 && !m.line ? (g0.lineGuess ? '自动 → ' + g0.lineGuess + ' (' + Math.round(g0.lineConf * 100) + '%)' : g0.idHint ? '自动 → ' + g0.idHint[0] : '线索：自动') : '线索：自动';
      box.append(h('div', { class: 'row media-row' },
        m.thumb ? h('img', { src: m.thumb, alt: '' }) : h('div', { style: 'width:88px;height:50px;background:#000;border-radius:3px' }),
        h('div', {},
          h('div', { class: 'name' }, m.name),
          h('div', { class: 'muted' }, SC.fmtTime(m.duration, true) + (m.width ? ' · ' + m.width + '×' + m.height : '') + (g0 && g0.idHint ? ' · 编号 ' + g0.idHint : '')),
          h('div', { class: 'status ' + cls, 'data-mstatus': m.id }, st)),
        h('div', { class: 'ctrl' },
          h('select', { onchange: (e) => { m.line = e.target.value || null; solveSoon(); } }, lineOptions(m.line, auto)),
          h('button', { title: '移除素材', onclick: () => { S.media.splice(S.media.indexOf(m), 1); if (m.url) URL.revokeObjectURL(m.url); renderMedia(); solve(); } }, '移除')),
        h('textarea', { placeholder: '内容描述 / 生成提示词（参与文本匹配）', value: m.note || '', onchange: (e) => { m.note = e.target.value; solveSoon(); } })));
    }
  }
  const solveSoon = () => { if (!S.manual) solve(true); else { log('已手动编辑：改动将在下次“生成剪辑”时生效'); renderAll(); } };

  function renderShots() {
    const box = $('#shotList');
    box.innerHTML = '';
    const used = new Map();
    S.items.forEach((it) => { if (it.type === 'clip') used.set(it.shotId, (used.get(it.shotId) || []).concat(it.seg || it.line || '✓')); });
    const segOpts = S.script ? S.script.segments.map((s) => [s.id, s.id + ' ' + s.title]) : [];
    let count = 0;
    for (const m of S.media) {
      (m.shots || []).forEach((sh, k) => {
        if (++count > 600) return;
        const id = m.id + '#' + k;
        const ov = S.overrides[id] || {};
        const ps = S.shotsById.get(id);
        const setOv = (patch) => { S.overrides[id] = Object.assign({}, ov, patch); solveSoon(); };
        const u = used.get(id);
        box.append(h('div', { class: 'row shot-row' + (S.sel >= 0 && S.items[S.sel] && S.items[S.sel].shotId === id ? ' sel' : '') },
          h('img', { src: SC.thumbAt(m, (sh.in + sh.out) / 2) || '', alt: '' }),
          h('div', {},
            h('div', {}, h('b', {}, m.name + ' #' + (k + 1)), '  ', h('span', { class: 'muted' }, SC.fmtTime(sh.in, true) + '–' + SC.fmtTime(sh.out, true) + ' · ' + (sh.out - sh.in).toFixed(2) + 's')),
            h('div', { class: 'muted' },
              ps ? '线索 ' + (ps.lineGuess || ps.group || '?') + (ps.lineConf && !ps.lineTag ? ' (' + Math.round(ps.lineConf * 100) + '%)' : '') + ' · 能量 ' + ps.energy.toFixed(2) + (sh.feat && sh.feat.hasAudio ? ' · 对白 ' + Math.round(ps.speech * 100) + '%' : '') : ov.exclude ? '已排除' : '',
              u ? h('span', { style: 'color:var(--accent)' }, ' · 用于 ' + Array.from(new Set(u)).join(',')) : ps ? h('span', { style: 'color:var(--accent2)' }, ' · 未使用') : '')),
          h('div', { class: 'ctl' },
            h('select', { onchange: (e) => setOv({ line: e.target.value || null }) }, lineOptions(ov.line)),
            langSelects(ov, ps, setOv),
            segOpts.length ? h('select', { onchange: (e) => setOv({ pin: e.target.value || null }) },
              [h('option', { value: '' }, '锁定段落：自动')].concat(segOpts.map(([v, l]) => h('option', { value: v, selected: ov.pin === v }, l)))) : null,
            h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: !!ov.exclude, onchange: (e) => setOv({ exclude: e.target.checked }) }), '排除'),
            h('button', { onclick: () => { const i = S.items.findIndex((it) => it.shotId === id); if (i >= 0) { S.sel = i; seek(S.items[i].rec); renderAll(); } else if (m.url) previewSource(m, sh.in); } }, '定位'))));
      });
    }
    if (count > 600) box.append(h('div', { class: 'hint' }, '仅显示前 600 个镜头'));
    if (!count) box.append(h('div', { class: 'hint' }, '导入素材后这里会列出切分得到的镜头。'));
  }

  /** 镜头语言下拉（景别 / 角度 / 运动 / 主体方向）：手动值写入 overrides，空 = 自动（文件名、描述、换角台导入） */
  function langSelects(ov, ps, setOv) {
    const G = SC.grammar, cur = ov.lang || {}, auto = (ps && ps.lang) || {};
    const one = (k, list, label) => h('select', { title: label + (auto[k] && !cur[k] ? '（自动：' + ((list.find((x) => x.id === auto[k]) || {}).zh || auto[k]) + '）' : ''),
      onchange: (e) => setOv({ lang: Object.assign({}, cur, { [k]: e.target.value || undefined }) }) },
      [h('option', { value: '' }, label + (auto[k] && !cur[k] ? '·' + ((list.find((x) => x.id === auto[k]) || {}).zh || '') : ''))].concat(list.map((x) => h('option', { value: x.id, selected: cur[k] === x.id, title: x.desc }, x.zh))));
    const dirs = ['R', 'L', 'U', 'D', 'IN', 'OUT'].map((d) => ({ id: d, zh: G.DIRS[d] + ' 方向', desc: '' }));
    return h('span', { class: 'lang' }, one('size', G.SIZES, '景别'), one('angle', G.ANGLES, '角度'), one('move', G.MOVES, '运动'), one('subjDir', dirs, '主体'));
  }

  function previewSource(m, t) {
    // 预览源素材：临时生成单段序列
    S.items = [{ type: 'clip', shotId: null, mediaId: m.id, name: m.name, srcIn: 0, srcOut: m.duration, seg: null, line: null }];
    S.manual = true;
    SC.layout(S.items);
    rereport();
    renderAll();
    seek(t);
    log('正在预览源素材 ' + m.name + '（点“生成剪辑”回到成片）');
  }

  function renderSegs() {
    const box = $('#segList');
    box.innerHTML = '';
    if (!S.script) { box.append(h('div', { class: 'hint' }, '尚未导入剧本时间线。点击工具栏“导入 / 编辑剧本时间线”。没有剧本时将执行非线性自动编排。')); return; }
    const rows = new Map(((S.result && S.result.segRows) || []).map((r) => [r.seg, r]));
    const cov = segCoverage();
    for (const s of S.script.segments) {
      const l = S.script.lines.find((x) => x.id === s.line);
      const r = rows.get(s.id);
      const f = cov[s.id] || 0;
      box.append(h('div', { class: 'row seg-row' + (S.selSeg === s.id ? ' sel' : ''), onclick: () => gotoSeg(s.id) },
        h('span', { class: 'chip', style: 'background:' + l.color }, s.id),
        h('div', {}, h('div', {}, s.title, h('span', { class: 'muted' }, '  ' + SC.fmtTime(s.start) + '–' + SC.fmtTime(s.end) + ' · 强度 ' + s.estIntensity.toFixed(2))),
          h('div', { class: 'mini-bar' }, h('i', { style: 'width:' + Math.round(f * 100) + '%;background:' + (f < 0.5 ? 'var(--danger)' : 'var(--accent)') }))),
        h('span', { class: 'muted' }, r && r.shots.length ? r.shots.length + ' 镜' : '—')));
    }
  }

  function segCoverage() {
    const out = {};
    if (!S.script) return out;
    const vis = {};
    SC.flattenScript(S.script).forEach((p) => { if (p.seg) vis[p.seg] = (vis[p.seg] || 0) + p.end - p.start; });
    const cov = {};
    S.items.forEach((it) => { if (it.type === 'clip' && it.seg) cov[it.seg] = (cov[it.seg] || 0) + it.len; });
    for (const s of S.script.segments) out[s.id] = vis[s.id] ? Math.min(1, (cov[s.id] || 0) / vis[s.id]) : 0;
    return out;
  }

  function gotoSeg(id) {
    S.selSeg = id;
    const i = S.items.findIndex((it) => it.seg === id);
    if (i >= 0) { S.sel = i; seek(S.items[i].rec); tl.ensureVisible(S.items[i].rec); }
    renderAll();
  }

  function renderDiag() {
    const box = $('#diag');
    box.innerHTML = '';
    const R = S.report;
    if (!R) return;
    const mode = S.result ? S.result.mode : '-';
    const k = (v, l) => h('div', { class: 'kpi' }, h('b', {}, v), h('span', {}, l));
    box.append(h('div', { class: 'kpis' },
      k(SC.fmtTime(R.total), '成片时长'), k(R.cuts, '剪辑数'), k(R.asl.toFixed(2) + 's', '平均镜头长'),
      k(R.coverage != null ? Math.round(R.coverage * 100) + '%' : '—', '剧本覆盖率'), k(R.switches, '线索切换'),
      k(R.energyFit == null ? '—' : R.energyFit.toFixed(2), '能量贴合 r')));
    box.append(h('div', { class: 'muted' }, '模式：' + (mode === 'linear' ? '线性 · 按剧本时间线对位' : '非线性 · ' + (S.result && S.result.groupMode === 'line' ? '按线索分组' : '按视觉聚类分组')) + (S.manual ? ' · 已手动编辑' : '') + (R.gapTime > 0.05 ? ' · 空缺 ' + R.gapTime.toFixed(1) + 's' : '')));

    box.append(h('div', { class: 'dsec' }, '线索占比（成片 / 剧本）'));
    const lines = S.script ? S.script.lines.map((l) => l.id) : Object.keys(R.share);
    const tot = R.total || 1, stot = R.scriptShare ? SC.sum(Object.values(R.scriptShare)) || 1 : 1;
    for (const id of lines) {
      const col = tl.lineColor(id);
      const a = (R.share[id] || 0) / tot, b = R.scriptShare ? (R.scriptShare[id] || 0) / stot : null;
      box.append(h('div', { class: 'share' }, h('span', { class: 'chip', style: 'background:' + col }, id),
        h('div', { class: 'bars' }, h('i', { style: 'width:' + a * 100 + '%;background:' + col }), b != null ? h('i', { style: 'width:' + b * 100 + '%;background:' + col + ';opacity:.35' }) : null),
        h('span', { class: 'muted' }, Math.round(a * 100) + '%' + (b != null ? ' / ' + Math.round(b * 100) + '%' : ''))));
    }
    if (R.chains) {
      const ok = R.chains.filter((c) => c.status === 'ok').length;
      box.append(h('div', { class: 'dsec' }, '伏笔与回收（' + ok + '/' + R.chains.length + ' 完整）'));
      for (const c of R.chains) {
        box.append(h('div', { class: 'chain' }, h('b', {}, c.name), h('span', { class: 'st-' + c.status }, { ok: '完整', broken: c.ordered ? '断链' : '顺序颠倒', empty: '无素材' }[c.status]),
          h('div', { class: 'nodes' }, c.nodes.map((n, i) => [i ? ' → ' : '', h('span', { class: n.fill > 0.5 ? 'f' : 'x', title: '覆盖 ' + Math.round(n.fill * 100) + '%' }, (n.kind === 'setup' ? '○' : '●') + n.seg)]))));
      }
    }
    if (S.result && S.result.unused.length) {
      box.append(h('div', { class: 'dsec' }, '未使用镜头 ' + S.result.unused.length + ' 个'));
      box.append(h('div', { class: 'muted' }, '低于置信阈值或超出段落容量。可在“镜头池”里锁定到指定段落，或调低“置信阈值”。'));
    }
    if (R.grammar) {
      const KIND = { jump: '跳切', axis: '越轴', leap: '景别跨度' };
      box.append(h('div', { class: 'dsec' }, '镜头语法（' + R.langCount + '/' + R.cuts + ' 个镜头有景别/运动标注）'));
      if (!R.langCount) box.append(h('div', { class: 'muted' }, '在“镜头池”里给镜头标景别 / 运动，或在文件名、描述里写“特写 / 推近 / 跟拍”等术语；换角预览台追踪后会自动标注。'));
      else if (!R.grammar.length) box.append(h('div', { class: 'st-ok' }, '相邻镜头没有跳切、越轴或景别硬跳。'));
      for (const g2 of R.grammar.slice(0, 30)) box.append(h('div', { class: 'mrow', onclick: () => seek(g2.rec) }, h('span', { class: 'st-broken' }, KIND[g2.kind] || '提示'), ' ', SC.fmtTime(g2.rec, true), ' · ', g2.text));
    }
    if (S.script && S.script.warnings && S.script.warnings.length) {
      box.append(h('div', { class: 'dsec' }, '剧本解析警告'));
      S.script.warnings.forEach((w) => box.append(h('div', { class: 'muted' }, w)));
    }
  }

  function renderMatch() {
    const box = $('#match');
    box.innerHTML = '';
    const res = S.result;
    if (!res) return;
    if (res.mode !== 'linear') {
      box.append(h('div', { class: 'muted' }, '非线性模式：按 ' + (res.groupMode === 'line' ? '线索' : '视觉聚类') + ' 分组后由束搜索排序。'));
      const groups = {};
      res.shots.forEach((s) => (groups[s.group] = (groups[s.group] || 0) + 1));
      Object.entries(groups).forEach(([gk, n]) => box.append(h('div', { class: 'share' }, h('span', { class: 'chip', style: 'background:' + tl.lineColor(gk) }, gk), h('span', {}, n + ' 个镜头'), h('span', {}))));
      return;
    }
    const NAMES = { id: '编号', text: '文本', line: '线索', dur: '时长', energy: '能量', dialog: '对白', order: '顺序', lang: '镜头语言' };
    for (const r of res.segRows) {
      const l = S.script.lines.find((x) => x.id === r.line);
      box.append(h('div', { class: 'mrow', onclick: () => gotoSeg(r.seg) },
        h('div', { class: 'h' }, h('span', { class: 'chip', style: 'background:' + l.color }, r.seg), h('b', {}, r.title), h('span', { class: 'grow' }),
          h('span', { class: r.filled / (r.vis || 1) < 0.5 ? 'st-broken' : 'muted' }, r.filled.toFixed(1) + '/' + r.vis.toFixed(1) + 's'),
          r.shots.length ? h('span', { class: 'muted' }, ' 置信 ' + Math.round(r.conf * 100)) : null),
        r.shots.length ? r.shots.map((s) => h('div', { class: 'sh' }, '· ' + s.name + ' #' + (Number(s.id.split('#')[1]) + 1) + '  ', h('span', { class: 'why' }, Object.entries(s.b).filter(([kk, v]) => kk !== 'id' || v).map(([kk, v]) => NAMES[kk] + ' ' + (kk === 'id' ? (v > 0 ? '✓' : '✗') : v.toFixed(2))).join(' · ')))) : h('div', { class: 'sh' }, '缺素材')));
    }
  }

  const tl = new SC.Timeline($('#tlScroll'), $('#tlCanvas'), $('#tlSpacer'), {
    onSeek: (t) => seek(t),
    onSelect: (i) => { S.sel = i; S.selSeg = S.items[i] && S.items[i].seg; renderTimeline(); renderShotsSel(); },
    onSegClick: (id) => gotoSeg(id),
    onTrim, onMove,
    onZoom: (z) => { $('#zoom').value = z; },
    onChainClick: (c) => { $$('[data-tab="diag"]')[0].click(); log('伏笔「' + c.name + '」：' + c.nodes.map((n) => (n.kind === 'setup' ? '○' : '●') + n.seg).join(' → ')); },
  });
  function renderShotsSel() { if (!$('[data-body="shots"]').hidden) renderShots(); }

  function renderTimeline() {
    const total = SC.layout(S.items);
    const firstRec = new Map();
    S.items.forEach((it) => { if (it.type === 'clip' && it.seg && !firstRec.has(it.seg)) firstRec.set(it.seg, it.rec); });
    const chainStatus = {};
    if (S.report && S.report.chains) S.report.chains.forEach((c) => (chainStatus[c.name] = c.status));
    tl.setData({
      items: S.items, total, script: S.script, mode: S.result ? S.result.mode : 'nonlinear', P: S.params,
      playhead: S.playhead, sel: S.sel, selSeg: S.selSeg, mediaById: new Map(S.media.map((m) => [m.id, m])), shotsById: S.shotsById,
      segFill: segCoverage(), firstRec, chainStatus,
    });
    $('#tlInfo').textContent = '成片 ' + SC.fmtTime(total, true) + (S.script ? ' · 剧本 ' + SC.fmtTime(S.script.duration, true) : '');
    $('#tcTotal').textContent = SC.fmtTime(total, true);
    $('#manualFlag').hidden = !S.manual;
  }

  function renderAll() {
    renderTimeline();
    renderParams();
    renderDiag();
    renderMatch();
    renderSegs();
    if (!$('[data-body="shots"]').hidden) renderShots();
    renderMedia();
    if (!player.playing) player.seek(S.playhead);
    updateViewerInfo();
  }

  /* ------------------------------------------------------------------ 播放 */
  const player = new SC.Player($('#vA'), $('#vB'), $('#overlay'), {
    items: () => S.items,
    media: (id) => mediaById(id),
    script: () => (S.result && S.result.mode === 'linear' ? S.script : S.script),
    burnIn: () => $('#burnIn').checked,
    onTime: (t) => {
      S.playhead = t;
      $('#tcNow').textContent = SC.fmtTime(t, true);
      tl.d.playhead = t;
      if (player.playing) tl.ensureVisible(t);
      tl.draw();
      updateViewerInfo();
    },
  });
  player.setVolume(0.8);
  function seek(t) { player.seek(t); }
  let lastInfo = '';
  function updateViewerInfo() {
    const it = player.itemAt(S.playhead);
    const txt = it ? (it.type === 'gap' ? (it.why === 'missing' ? '缺素材 ' + (it.seg || '') : '空') : (it.seg ? it.seg + ' · ' : '') + it.name + ' @ ' + SC.fmtTime(it.srcIn + S.playhead - it.rec, true)) : '';
    if (txt !== lastInfo) { $('#viewerInfo').textContent = txt; lastInfo = txt; }
  }
  $('#btnPlay').onclick = () => player.toggle();
  $('#btnPrev').onclick = () => { const it = S.items.slice().reverse().find((x) => x.rec < S.playhead - 0.05); seek(it ? it.rec : 0); };
  $('#btnNext').onclick = () => { const it = S.items.find((x) => x.rec > S.playhead + 0.01); if (it) seek(it.rec); };
  $('#volume').oninput = (e) => player.setVolume(Number(e.target.value));
  $('#burnIn').onchange = () => player.paintOverlay(player.itemAt(S.playhead));
  $('#zoom').oninput = (e) => tl.setZoom(Number(e.target.value), S.playhead, tl.tToX(S.playhead));

  /* ------------------------------------------------------------------ 工程存取 */
  function download(name, text, type) {
    const a = h('a', { href: URL.createObjectURL(new Blob([text], { type: type || 'text/plain;charset=utf-8' })), download: name });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  const safeName = () => (S.title || 'project').replace(/[\\/:*?"<>|\s]+/g, '_');

  function saveProject() {
    const proj = {
      app: 'director-desk', version: 1, title: S.title, scriptText: S.scriptText, params: S.params, overrides: S.overrides,
      media: S.media.map((m) => ({ id: m.id, name: m.name, duration: m.duration, width: m.width, height: m.height, note: m.note, line: m.line, thumb: m.thumb, strip: m.strip, samples: m.samples, audio: m.audio, shots: m.shots })),
      items: S.items, manual: S.manual,
    };
    download(safeName() + '.ddproj.json', JSON.stringify(proj), 'application/json');
    log('工程已保存（不含视频文件本身，重新打开后导入同名素材即可关联）', 'ok');
  }
  async function openProject(file) {
    try {
      const p = JSON.parse(await file.text());
      if (p.app !== 'director-desk') throw new Error('不是导演工作台工程文件');
      S.media.forEach((m) => m.url && URL.revokeObjectURL(m.url));
      S.title = p.title || '我的影片';
      S.params = Object.assign(SC.deepClone(SC.DEFAULT_PARAMS), p.params || {});
      S.overrides = p.overrides || {};
      S.media = (p.media || []).map((m) => Object.assign(m, { url: null, file: null, status: m.samples ? 'done' : 'probed' }));
      applyScript(p.scriptText || '', true);
      solve(true);
      if (p.items && p.items.length) { S.items = p.items; S.manual = !!p.manual; SC.layout(S.items); rereport(); renderAll(); }
      log('已打开工程：' + S.title + '。请“导入素材”选择同名视频文件以重新关联（' + S.media.length + ' 个）。', 'ok');
    } catch (err) { log('打开失败：' + err.message, 'err'); }
  }
  $('#fileProject').onchange = (e) => { if (e.target.files[0]) openProject(e.target.files[0]); e.target.value = ''; };

  function doExport(kind) {
    $('#exportMenu').hidden = true;
    const clips = S.items.filter((i) => i.type === 'clip');
    if (!clips.length && kind !== 'script') return log('时间轴为空，无可导出内容', 'err');
    SC.layout(S.items);
    const ctx = { items: S.items, media: S.media, title: S.title, fps: S.params.fps, width: S.params.width, height: S.params.height };
    const n = safeName();
    if (kind === 'edl') download(n + '.edl', SC.exportEDL(ctx));
    if (kind === 'fcpxml') download(n + '.fcpxml', SC.exportFCPXML(ctx), 'application/xml');
    if (kind === 'sh') download(n + '_render.sh', SC.exportFFmpeg(ctx, 'sh'));
    if (kind === 'bat') download(n + '_render.bat', SC.exportFFmpeg(ctx, 'bat'));
    if (kind === 'script') { if (!S.script) return log('没有剧本可导出', 'err'); download(n + '_剧本时间线.txt', SC.serializeScript(S.script)); }
    if (kind === 'sbSketch' || kind === 'sbFrame') { exportStoryboard(kind === 'sbSketch' ? 'sketch' : 'frame'); return; }
    if (kind === 'csv') {
      const rows = [['序号', '类型', '段落', '线索', '素材', '源入点', '源出点', '成片入点', '成片出点', '时长', '置信']];
      S.items.forEach((it, i) => rows.push([i + 1, it.type === 'gap' ? '空缺' : '镜头', it.seg || '', it.line || '', it.name || '', it.type === 'clip' ? it.srcIn.toFixed(3) : '', it.type === 'clip' ? it.srcOut.toFixed(3) : '', it.rec.toFixed(3), (it.rec + it.len).toFixed(3), it.len.toFixed(3), it.score == null ? '' : it.score]));
      download(n + '_剪辑表.csv', '﻿' + rows.map((r) => r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\r\n'), 'text/csv;charset=utf-8');
    }
    log('已导出 ' + kind.toUpperCase() + (kind === 'sh' || kind === 'bat' ? '：把脚本放到素材所在目录运行即可渲染 MP4（需要 ffmpeg）' : ''), 'ok');
  }

  /** 由当前成片时间轴生成分镜板：每个剪辑一格，标题来自镜头语言，副标题为剧本段落 */
  async function exportStoryboard(style) {
    const G = SC.grammar;
    const clips = S.items.filter((i) => i.type === 'clip');
    if (!clips.length) return log('时间轴为空', 'err');
    const panels = [];
    for (let i = 0; i < clips.length; i++) {
      const c = clips[i];
      const sh = S.shotsById.get(c.shotId);
      const L = (sh && sh.lang) || {};
      const m = mediaById(c.mediaId);
      const src = m && SC.thumbAt(m, (c.srcIn + c.srcOut) / 2);
      const frame = style === 'frame' && src ? await new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }) : null;
      const seg = c.seg && S.script ? S.script.segments[S.script.segIndex.get(c.seg)] : null;
      const dirX = { R: 1, L: -1, UR: 1, DR: 1, UL: -1, DL: -1 }[L.subjDir || L.dir] || 0;
      // 线稿：按景别估人物大小；有主体方向就画运动箭头
      const hRel = { EWS: 0.18, LS: 0.35, FS: 0.6, MS: 0.95, CU: 1.25, ECU: 1.4 }[L.size] || 0.5;
      const figures = style === 'sketch' ? [{ x: 0.42, y: Math.min(1.02, 0.68 + hRel * 0.3), h: hRel, from: [0.42, 0.7], to: [0.42 + dirX * 0.3, 0.7] }] : [];
      if (style === 'sketch' && (L.size === 'LS' || L.size === 'FS' || L.size === 'EWS')) figures.push({ x: 0.72, y: 0.7, h: hRel * 0.95 });
      panels.push({ n: i + 1, caption: G.caption(L) || (seg ? seg.title : c.name), sub: (seg ? seg.id + ' ' + seg.title : c.name) + ' · ' + c.len.toFixed(1) + 's', frame, figures, size: L.size, camMove: L.move, camDir: L.camDir, impact: seg ? /斩|砍|劈|刺|击|撞|反击|格挡/.test(seg.title + seg.desc) : false });
    }
    const chunk = 16;
    for (let p = 0; p < panels.length; p += chunk) {
      const cv = SC.storyboard.render({ title: 'SEQ. – ' + (S.title || 'Edit'), subtitle: '由成片时间轴与镜头语言生成', panels: panels.slice(p, p + chunk), style, cols: 4, footer: 'CONTINUOUS ACTION' });
      SC.storyboard.download(cv, safeName() + '_分镜板_' + (p / chunk + 1) + '.png');
    }
    log('分镜板已导出：' + panels.length + ' 格', 'ok');
  }

  /* ------------------------------------------------------------------ 工具栏 / 快捷键 */
  const actions = {
    new() {
      if (S.media.length && !confirm('清空当前工程？')) return;
      player.pause();
      S.media.forEach((m) => m.url && URL.revokeObjectURL(m.url));
      S.media = []; S.overrides = {}; S.items = []; S.manual = false;
      applyScript('', true);
      solve(true);
      log('新建工程');
    },
    open: () => $('#fileProject').click(),
    save: saveProject,
    importMedia: () => $('#fileMedia').click(),
    editScript: openScriptDialog,
    analyze: () => analyzeAll(false),
    solve() { if (S.manual && !confirm('将用当前参数重新求解，覆盖手动编辑？')) return; solve(); },
    play: () => { seek(0); player.play(); },
    exportMenu: () => { $('#exportMenu').hidden = !$('#exportMenu').hidden; },
    cancel() { if (S.task) { S.task.cancelled = true; log('正在取消…'); } else log('没有运行中的任务'); },
    split: ops.split, delete: ops.delete, up: ops.up, down: ops.down, undo: ops.undo, redo: ops.redo,
  };
  $$('[data-act]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); actions[b.dataset.act](); }));
  $$('[data-exp]').forEach((b) => b.addEventListener('click', () => doExport(b.dataset.exp)));
  document.addEventListener('click', (e) => { if (!e.target.closest('.menu')) $('#exportMenu').hidden = true; });
  $('#autoSolve').onchange = (e) => { if (e.target.checked && !S.manual) solve(true); };
  $$('.tabs').forEach((tabs) => tabs.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tab]');
    if (!b) return;
    tabs.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    const panel = tabs.parentElement;
    panel.querySelectorAll('.tab-body').forEach((body) => (body.hidden = body.dataset.body !== b.dataset.tab));
    if (b.dataset.tab === 'shots') renderShots();
  }));
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input,textarea,select,dialog')) return;
    const k = e.key.toLowerCase();
    if (k === ' ') { e.preventDefault(); player.toggle(); }
    else if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? ops.redo() : ops.undo(); }
    else if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); ops.redo(); }
    else if ((e.ctrlKey || e.metaKey) && k === 's') { e.preventDefault(); saveProject(); }
    else if (k === 'delete' || k === 'backspace') ops.delete();
    else if (k === 's' || k === 'b') ops.split();
    else if (k === 'arrowleft') seek(S.playhead - (e.shiftKey ? 1 : 1 / S.params.fps));
    else if (k === 'arrowright') seek(S.playhead + (e.shiftKey ? 1 : 1 / S.params.fps));
    else if (k === 'home') seek(0);
  });

  /* ------------------------------------------------------------------ 启动 */
  window.DD = { state: S, solve, log, timeline: tl, player }; // 方便在开发者工具里检查
  const saved = store.get('script');
  if (saved) { try { applyScript(saved, true); log('已恢复上次的剧本时间线：' + S.script.title); } catch (e) { /* 忽略损坏的缓存 */ } }
  tl.zoom = Number($('#zoom').value);
  solve(true);
  log('导演工作台就绪。步骤：① 导入 / 编辑剧本时间线（可选）② 导入素材 ③ 分析素材 ④ 调参数实时出剪辑 ⑤ 导出。');
})();
