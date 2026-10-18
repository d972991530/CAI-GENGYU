/* 换角预览台主程序 */
(function () {
  'use strict';
  const SC = window.SC, RC = SC.recast, G = SC.grammar;
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
  const fmt = (t) => SC.fmtTime(t, true);
  const ROLES = ['A', 'B'];
  const STYLE_DEFAULT = '2000年代港式动作片质感，夜晚城市后巷，冷青蓝调色，高反差，霓虹点缀与虚化光斑，35mm胶片颗粒，写实近身格斗';
  const MAP_ROWS = [
    ['video', '源视频片段', 'video'], ['refA', '参考图 A（单轮时唯一参考图）', 'image'], ['ptsA', '正点 A', 'coordinates'], ['negA', '负点 A', 'neg_coordinates'],
    ['segA', '分割文字 A（可选）', 'prompt'], ['refB', '参考图 B（单轮双人才填）', 'image'], ['ptsB', '正点 B', 'coordinates'], ['negB', '负点 B', 'neg_coordinates'],
    ['prompt', '正向提示词', 'positive_prompt'], ['frameCap', '帧数上限（可选）', 'frame_load_cap'], ['seed', '随机种子（可选）', 'seed'],
  ];

  /* ------------------------------------------------------------ 状态 */
  const newCast = (r) => ({ name: r === 'A' ? '新角色A' : '新角色B', desc: '', seg: r === 'A' ? 'man in black leather jacket' : 'man in white jacket', img: null, mode: 'recolor', strength: 0.85, keepShade: 0.35, matchLight: 0.6 });
  const P = {
    app: 'recast', version: 1,
    film: null, // { name, duration, fps, w, h }
    cast: { A: newCast('A'), B: newCast('B') },
    scene: { img: null, on: false, parallax: 0.6 },
    grade: { on: false, exposure: 0, contrast: 1, saturation: 1, hue: 0, temp: 0 },
    style: STYLE_DEFAULT,
    work: { W: 320, fps: 15 },
    local: { url: 'http://127.0.0.1:8188', cw: 854, ch: 480, fps: 16, map: Object.fromEntries(MAP_ROWS.map((r) => [r[0], { nodeId: '', field: r[2] }])), workflow: null, wfName: '' },
    shots: [],
  };
  const S = { url: null, src: null, sel: -1, view: 'final', tool: 'boxA', playing: null, task: null, filter: 'all', split: 0.5, draft: null };
  const cv = $('#out'), ui = $('#ui'), uictx = ui.getContext('2d');
  const comp = new RC.Compositor(cv);
  const player = $('#player');
  player.volume = 0.7;

  /* ------------------------------------------------------------ 日志 */
  function log(msg, cls) {
    const box = $('#log');
    box.append(h('div', { class: cls || '' }, new Date().toTimeString().slice(0, 8) + '  ' + msg));
    box.scrollTop = box.scrollHeight;
  }
  function progress(name, f) {
    $('#taskName').textContent = name;
    $('#bar').style.width = f == null ? '0' : Math.round(f * 100) + '%';
    $('#pct').textContent = f == null ? '' : Math.round(f * 100) + '%';
  }
  async function runTask(name, fn) {
    if (S.task) { log('已有任务在运行，请先取消或等待', 'err'); return; }
    S.task = { cancelled: false };
    progress(name, 0);
    try { await fn(S.task); progress(name + ' · 完成', 1); }
    catch (e) { log(name + '中止：' + e.message, 'err'); progress('已中止', null); }
    finally { S.task = null; }
  }

  /* ------------------------------------------------------------ 镜头 */
  const newRole = () => ({ on: false, kf: [], neg: [], mode: 'inherit', scale: 1, dx: 0, dy: 0, mirror: false });
  function makeShot(i, start, end, extra) {
    return Object.assign({ id: 'S' + String(i + 1).padStart(3, '0'), n: i + 1, start, end, shot: '', move: '', desc: '', keep: false, prompt: null, sceneOn: true, thumb: null, track: null, lang: null,
      roles: { A: newRole(), B: newRole() } }, extra || {});
  }
  const cur = () => P.shots[S.sel] || null;
  const shotAt = (t) => P.shots.find((s) => t >= s.start && t < s.end) || (P.shots.length && t >= P.shots[P.shots.length - 1].end ? P.shots[P.shots.length - 1] : null);
  const workH = () => (P.film ? Math.round((P.work.W * P.film.h) / P.film.w / 2) * 2 : 180);

  /* ------------------------------------------------------------ 打开原片 */
  async function openFilm(file) {
    if (S.url) URL.revokeObjectURL(S.url);
    S.url = URL.createObjectURL(file);
    player.src = S.url;
    if (S.src) S.src.dispose();
    S.src = new RC.FrameSource(S.url);
    await S.src.ready;
    await new Promise((res) => { if (player.readyState >= 1) res(); else player.addEventListener('loadedmetadata', res, { once: true }); });
    const fps = (await RC.estimateFps(S.url).catch(() => null)) || (P.film && P.film.fps) || 30;
    const sameFilm = P.film && Math.abs(P.film.duration - player.duration) < 0.5;
    P.film = { name: file.name, duration: player.duration, fps, w: player.videoWidth, h: player.videoHeight };
    const W = Math.min(1280, P.film.w);
    cv.width = W; cv.height = Math.round((W * P.film.h) / P.film.w);
    $('#stageEmpty').hidden = true;
    log('原片：' + file.name + ' · ' + fmt(P.film.duration) + ' · ' + P.film.w + '×' + P.film.h + ' · ' + fps + 'fps', 'ok');
    if (P.shots.length && sameFilm) log('已有 ' + P.shots.length + ' 个镜头的镜头表，与原片时长吻合，直接使用');
    else if (P.shots.length) log('现有镜头表与原片时长不符（' + fmt(P.shots[P.shots.length - 1].end) + '），可点“自动分镜”重新切分', 'err');
    else await detectShots();
    await makeThumbs();
    if (S.sel < 0 && P.shots.length) select(0); else { renderAll(); seekFilm(cur() ? cur().start : 0); }
  }

  async function detectShots() {
    if (!S.src) return log('请先打开原片', 'err');
    await runTask('自动分镜', async (sig) => {
      const list = await RC.detectShots(S.src, { fps: P.film.fps, signal: sig, onProgress: (f) => progress('自动分镜（逐帧精确）', f) });
      P.shots = list.map((s, i) => makeShot(i, s.start, s.end));
      log('分镜完成：' + P.shots.length + ' 个镜头（切点精确到帧）', 'ok');
      S.sel = -1;
    });
    await makeThumbs();
    if (P.shots.length) select(0);
  }

  async function makeThumbs() {
    if (!S.src) return;
    const todo = P.shots.filter((s) => !s.thumb);
    if (!todo.length) return;
    const tw = 160, th = Math.round((160 * P.film.h) / P.film.w);
    for (let i = 0; i < todo.length; i++) {
      const s = todo[i];
      await S.src.seek(Math.min(s.start + 0.05, s.end - 0.01));
      s.thumb = S.src.thumb(tw, th, 0.7);
      if (i % 10 === 0) { progress('生成缩略图', i / todo.length); renderShotList(); }
    }
    progress('就绪', null);
    renderShotList();
  }

  /* ------------------------------------------------------------ 导入旧镜头表 / 任务包 */
  async function importShots(file) {
    const data = JSON.parse(await file.text());
    let list = Array.isArray(data) ? data : data.shots;
    if (!Array.isArray(list)) throw new Error('不是镜头表');
    const job = !Array.isArray(data) && data.format === 'lane-director-job' ? data : null;
    P.shots = list.map((o, i) => {
      const s = makeShot(i, o.start, o.end, { id: o.id || 'S' + String(i + 1).padStart(3, '0'), shot: o.shot || '', move: o.move || '', desc: o.desc || '', keep: !!o.keep, prompt: o.prompt || null });
      const pts = o.pts || {};
      for (const r of ROLES) {
        const jr = o.roles && o.roles[r];
        const p = pts[r] || (jr && jr.points && jr.points[0]);
        if (p) {
          // 旧版点坐标是 0..1；按景别估一个初始框，放在第 0 秒关键帧
          const b = RC.boxFromPoint(p, s.shot, 1, 1);
          s.roles[r].on = true;
          s.roles[r].kf = [{ t: 0, box: [b.x, b.y, b.w, b.h] }];
        }
        if (jr && jr.neg) s.roles[r].neg = jr.neg.map((q) => [q[0], q[1]]);
      }
      const tags = G.parseTags(s.shot + ' ' + s.move);
      if (tags.size || tags.move || tags.angle) s.lang = Object.assign({ auto: false, from: 'text' }, tags);
      return s;
    });
    if (job) {
      for (const r of ROLES) {
        const c = job.cast && job.cast[r];
        if (!c) continue;
        Object.assign(P.cast[r], { name: c.name || P.cast[r].name, desc: c.desc || '', seg: c.seg || P.cast[r].seg });
        const im = c.image && job.images && job.images[c.image];
        if (im && im.b64) await setCastImage(r, 'data:' + im.mime + ';base64,' + im.b64);
      }
      if (job.style) P.style = job.style;
    }
    log('导入 ' + P.shots.length + ' 个镜头' + (job ? '（含卡司与参考图）' : '') + '。旧版的点选已转换为第 0 秒的初始框，追踪前可拖框修正。', 'ok');
    S.sel = -1;
    if (S.src) await makeThumbs();
    if (P.shots.length) select(0); else renderAll();
  }

  /* ------------------------------------------------------------ 卡司参考图 */
  async function setCastImage(r, url) {
    const c = P.cast[r];
    c.img = url;
    if (!url) { c.cut = null; c.refStats = null; c.ver = (c.ver || 0) + 1; comp.invalidate(); renderCast(); return; }
    const im = await RC.loadImageData(url, 512);
    const cut = RC.cutout(im);
    c.cut = { w: im.w, h: im.h, data: im.data, alpha: cut.alpha, bbox: cut.bbox, coverage: cut.coverage };
    c.refStats = RC.colorStats(im, (x, y) => cut.alpha[y * im.w + x] > 128);
    c.ver = (c.ver || 0) + 1;
    comp.invalidate();
    if (cut.coverage > 0.92) log('角色' + r + ' 参考图没抠出背景（建议用纯色背景或透明 PNG）', 'err');
    renderCast();
    redraw();
  }
  function fileToDataURL(file) { return new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(file); }); }
  let imgTarget = null;
  function pickImage(cb) { imgTarget = cb; $('#fileImg').value = ''; $('#fileImg').click(); }
  $('#fileImg').onchange = async (e) => { const f = e.target.files[0]; if (f && imgTarget) imgTarget(await fileToDataURL(f)); };

  /* ------------------------------------------------------------ 追踪 */
  async function trackShot(shot, sig, quiet) {
    if (!S.src) throw new Error('请先打开原片');
    const roles = {};
    const W = P.work.W, H = workH();
    const fps = Math.min(P.work.fps, P.film.fps);
    for (const r of ROLES) {
      const ro = shot.roles[r];
      if (!ro.on || !ro.kf.length) continue;
      roles[r] = {
        keyframes: ro.kf.map((k) => ({ fi: Math.round(k.t * fps), box: { x: k.box[0] * W, y: k.box[1] * H, w: k.box[2] * W, h: k.box[3] * H } })),
        neg: ro.neg.map((p) => [p[0] * W, p[1] * H]),
        motion: ro.motion || 'auto',
      };
    }
    if (!Object.keys(roles).length) { if (!quiet) log(shot.id + '：没有开启的角色或没有框', 'err'); return false; }
    const { frames, times } = await S.src.grabRange(shot.start, shot.end, fps, W, H, (f) => progress('取帧 ' + shot.id, f * 0.6), sig);
    const n = frames.length;
    for (const r of Object.keys(roles)) roles[r].keyframes.forEach((k) => (k.fi = SC.clamp(k.fi, 0, n - 1)));
    progress('追踪 ' + shot.id, 0.65);
    await new Promise((res) => setTimeout(res, 0));
    const tr = RC.trackShot(frames, roles, { fps });
    let plateData = null;
    if (tr.static) {
      const plate = RC.cleanPlate(frames, frames.map((f, i) => Object.keys(tr.roles).map((r) => tr.roles[r].masks[i])));
      if (plate.holeRatio < 0.08 && plate.residual < 10) {
        plateData = plate;
        RC.refineWithPlate(frames, frames.map((f, i) => Object.keys(tr.roles).map((r) => tr.roles[r].masks[i])), plate);
      }
    }
    const out = { W, H, fps, times, static: tr.static, gm: tr.gm.map((m) => ({ dx: m.dx, dy: m.dy, unknown: m.unknown || undefined })), plate: null, roles: {} };
    for (const r of Object.keys(tr.roles)) {
      const t = tr.roles[r];
      out.roles[r] = {
        boxes: t.boxes.map((b) => (b ? { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.w.toFixed(1), h: +b.h.toFixed(1) } : null)),
        conf: t.conf, lost: t.lost, P: t.P, motionRefined: !!t.motionRefined,
        masks: t.masks.map((m) => (m ? { x: m.x, y: m.y, w: m.w, h: m.h, area: m.area, rle: RC.rle(m.m) } : null)),
        srcStats: statsOf(frames, t.masks),
      };
    }
    if (plateData) {
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      c.getContext('2d').putImageData(new ImageData(plateData.data, W, H), 0, 0);
      out.plate = c.toDataURL('image/jpeg', 0.85);
    }
    shot.track = out;
    comp.invalidate(shot.id + '|');
    // 镜头语言自动标注（用户手动改过的不覆盖）
    const an = G.analyze({ dur: shot.end - shot.start, W, H, gm: tr.gm, subjects: Object.values(tr.roles).map((t) => ({ boxes: t.boxes, areas: t.masks.map((m) => (m ? m.area / (W * H) : null)) })) });
    if (!shot.lang || shot.lang.auto) shot.lang = Object.assign({ auto: true, angle: shot.lang && shot.lang.angle }, an);
    else shot.lang.analysis = an;
    const lostPct = Object.keys(out.roles).map((r) => r + ' 丢失 ' + Math.round((100 * out.roles[r].lost.filter(Boolean).length) / n) + '%').join(' · ');
    if (!quiet) log(shot.id + ' 追踪完成：' + n + ' 帧 · ' + lostPct + (tr.static ? ' · 固定机位' + (out.plate ? '（已生成干净背景板）' : '') : ' · 运动镜头') + ' · 自动标注：' + G.caption(shot.lang, true), 'ok');
    return true;
  }
  function statsOf(frames, masks) {
    const picks = [];
    for (let i = 0; i < frames.length; i += Math.max(1, Math.floor(frames.length / 6))) if (masks[i]) picks.push(i);
    if (!picks.length) return null;
    const hy = new Array(256).fill(0);
    let n = 0, mb = 0, mr = 0, sdb = 0, sdr = 0;
    for (const i of picks) {
      const m = masks[i];
      const st = RC.colorStats(frames[i], (x, y) => x >= m.x && y >= m.y && x < m.x + m.w && y < m.y + m.h && m.m[(y - m.y) * m.w + x - m.x]);
      if (!st) continue;
      for (let k = 0; k < 256; k++) hy[k] += st.hy[k];
      mb += st.mb * st.n; mr += st.mr * st.n; sdb += st.sdb * st.n; sdr += st.sdr * st.n; n += st.n;
    }
    if (!n) return null;
    return { n, hy, mb: mb / n, mr: mr / n, sdb: sdb / n, sdr: sdr / n };
  }

  /* ------------------------------------------------------------ 播放与渲染 */
  function seekFilm(t) {
    if (!S.url) return;
    player.currentTime = SC.clamp(t, 0, P.film.duration - 0.001);
  }
  player.addEventListener('seeked', () => redraw());
  function redraw() {
    if (!S.url || player.readyState < 2) { drawUI(); return; }
    const t = player.currentTime;
    const shot = shotAt(t);
    comp.render({ video: player, shot, t: shot ? t - shot.start : 0, view: S.view, P: viewP(), split: S.split });
    drawUI();
    updateTransport(t, shot);
  }
  function viewP() { return { cast: P.cast, scene: Object.assign({}, P.scene, { el: sceneEl }), grade: P.grade }; }
  let sceneEl = null;
  function loop() {
    if (S.playing) {
      const t = player.currentTime, s = cur();
      if (S.playing === 'shot' && s && t >= s.end - 0.02) { player.currentTime = s.start; }
      if (S.playing === 'film' && player.ended) stop();
      redraw();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  function play(mode) {
    if (!S.url) return;
    if (S.playing === mode) return stop();
    S.playing = mode;
    const s = cur();
    if (mode === 'shot' && s && (player.currentTime < s.start || player.currentTime >= s.end - 0.03)) player.currentTime = s.start;
    player.play().catch(() => {});
    $('#btnPlayShot').textContent = mode === 'shot' ? '■ 停止' : '▶ 本镜循环';
    $('#btnPlayFilm').textContent = mode === 'film' ? '■ 停止' : '▶ 整片播放';
  }
  function stop() {
    S.playing = null; player.pause();
    $('#btnPlayShot').textContent = '▶ 本镜循环'; $('#btnPlayFilm').textContent = '▶ 整片播放';
  }
  function updateTransport(t, shot) {
    $('#tc').textContent = fmt(t) + (shot ? '  ·  ' + shot.id + ' +' + (t - shot.start).toFixed(2) + 's' : '');
    const s = cur();
    if (s && !S.scrubbing) $('#scrub').value = SC.clamp((t - s.start) / (s.end - s.start), 0, 1);
    if (S.playing === 'film' && shot && shot !== s) { S.sel = P.shots.indexOf(shot); renderShotList(); renderShotCtl(); drawConf(); }
    const ph = $('#filmStrip .ph');
    if (ph && P.film) ph.style.left = (t / P.film.duration) * 100 + '%';
    drawConfHead(t);
  }

  /* ------------------------------------------------------------ 舞台交互（拖框 / 负点） */
  function uiSize() {
    const r = cv.getBoundingClientRect();
    if (ui.width !== Math.round(r.width) || ui.height !== Math.round(r.height)) { ui.width = Math.round(r.width); ui.height = Math.round(r.height); }
    ui.style.left = cv.offsetLeft + 'px'; ui.style.top = cv.offsetTop + 'px';
    return r;
  }
  new ResizeObserver(() => drawUI()).observe($('#stage'));
  function drawUI() {
    uiSize();
    const c = uictx, W = ui.width, H = ui.height;
    c.clearRect(0, 0, W, H);
    const s = cur();
    if (!s || !S.url) return;
    const t = player.currentTime - s.start;
    if (t < -0.01 || t > s.end - s.start + 0.01) return;
    for (const r of ROLES) {
      const ro = s.roles[r];
      // 当前帧附近的关键帧：实线框
      const fps = Math.min(P.work.fps, P.film.fps);
      for (const k of ro.kf) {
        const near = Math.abs(k.t - t) < 0.6 / fps;
        if (!near && s.track) continue;
        c.strokeStyle = RC.ROLE_COL[r]; c.lineWidth = near ? 2.5 : 1; c.setLineDash(near ? [] : [4, 4]);
        c.strokeRect(k.box[0] * W, k.box[1] * H, k.box[2] * W, k.box[3] * H);
        c.setLineDash([]);
        c.fillStyle = RC.ROLE_COL[r]; c.font = 'bold 12px sans-serif';
        c.fillText(r + (near ? ' 关键帧' : ' 初始框'), k.box[0] * W + 3, k.box[1] * H + 14);
      }
      for (const p of ro.neg) {
        c.strokeStyle = RC.ROLE_COL[r]; c.setLineDash([3, 2]); c.lineWidth = 2;
        c.beginPath(); c.arc(p[0] * W, p[1] * H, 7, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
        c.fillStyle = '#fff'; c.fillText('−', p[0] * W - 3, p[1] * H + 4);
      }
    }
    if (S.draft) {
      const d = S.draft;
      c.strokeStyle = RC.ROLE_COL[d.role]; c.lineWidth = 2; c.setLineDash([6, 3]);
      c.strokeRect(Math.min(d.x0, d.x1), Math.min(d.y0, d.y1), Math.abs(d.x1 - d.x0), Math.abs(d.y1 - d.y0));
      c.setLineDash([]);
    }
  }
  ui.addEventListener('mousedown', (e) => {
    const s = cur();
    if (!s || !S.url) return;
    const r = ui.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (S.tool === 'neg') {
      const role = s.roles.B.on && !s.roles.A.on ? 'B' : 'A';
      const ro = s.roles[role];
      const nx = x / r.width, ny = y / r.height;
      const hit = ro.neg.findIndex((p) => Math.hypot((p[0] - nx) * r.width, (p[1] - ny) * r.height) < 10);
      if (hit >= 0) ro.neg.splice(hit, 1); else ro.neg.push([+nx.toFixed(4), +ny.toFixed(4)]);
      if (s.roles.A.on && s.roles.B.on) { const o = s.roles[role === 'A' ? 'B' : 'A']; o.neg = ro.neg.map((p) => p.slice()); }
      markDirty(s); drawUI();
      return;
    }
    S.draft = { role: S.tool === 'boxB' ? 'B' : 'A', x0: x, y0: y, x1: x, y1: y };
  });
  window.addEventListener('mousemove', (e) => {
    if (!S.draft) return;
    const r = ui.getBoundingClientRect();
    S.draft.x1 = SC.clamp(e.clientX - r.left, 0, r.width); S.draft.y1 = SC.clamp(e.clientY - r.top, 0, r.height);
    drawUI();
  });
  window.addEventListener('mouseup', () => {
    const d = S.draft;
    if (!d) return;
    S.draft = null;
    const s = cur(), r = ui.getBoundingClientRect();
    const bw = Math.abs(d.x1 - d.x0), bh = Math.abs(d.y1 - d.y0);
    if (!s || bw < 6 || bh < 6) { drawUI(); return; }
    const box = [Math.min(d.x0, d.x1) / r.width, Math.min(d.y0, d.y1) / r.height, bw / r.width, bh / r.height].map((v) => +v.toFixed(4));
    const t = SC.clamp(player.currentTime - s.start, 0, s.end - s.start);
    const ro = s.roles[d.role];
    const fps = Math.min(P.work.fps, P.film.fps);
    const i = ro.kf.findIndex((k) => Math.abs(k.t - t) < 0.6 / fps);
    if (i >= 0) ro.kf[i] = { t: ro.kf[i].t, box }; else ro.kf.push({ t: +t.toFixed(3), box });
    ro.kf.sort((a, b) => a.t - b.t);
    ro.on = true;
    markDirty(s);
    log(s.id + ' 角色' + d.role + ' 在 +' + t.toFixed(2) + 's 设关键帧（共 ' + ro.kf.length + ' 个）。点“追踪本镜”重新计算。');
    renderShotCtl(); renderShotList(); drawUI();
  });
  function markDirty(s) { s.dirty = true; renderShotList(); }

  /* ------------------------------------------------------------ 置信度条 */
  const conf = $('#confStrip');
  function drawConf() {
    const c = conf.getContext('2d');
    const r = conf.getBoundingClientRect();
    conf.width = Math.round(r.width); conf.height = Math.round(r.height);
    const W = conf.width, H = conf.height;
    c.fillStyle = '#0f1a27'; c.fillRect(0, 0, W, H);
    const s = cur();
    if (!s) return;
    const dur = s.end - s.start;
    const rows = ROLES.filter((r2) => s.roles[r2].on);
    rows.forEach((r2, k) => {
      const y0 = 2 + k * ((H - 4) / Math.max(1, rows.length)), hh = (H - 4) / Math.max(1, rows.length) - 2;
      const tr = s.track && s.track.roles[r2];
      if (tr) {
        const times = s.track.times;
        times.forEach((t, i) => {
          const x0 = (t / dur) * W, x1 = ((times[i + 1] != null ? times[i + 1] : dur) / dur) * W;
          const cf = Math.min(1, tr.conf[i] || 0);
          c.fillStyle = tr.lost[i] ? '#a8433c' : RC.ROLE_COL[r2];
          c.globalAlpha = tr.lost[i] ? 0.9 : 0.25 + 0.6 * cf;
          c.fillRect(x0, y0 + hh * (1 - (tr.lost[i] ? 1 : cf)), Math.max(1, x1 - x0), hh * (tr.lost[i] ? 1 : cf));
        });
        c.globalAlpha = 1;
      } else { c.fillStyle = '#2a3b4f'; c.fillRect(0, y0, W, hh); c.fillStyle = '#7d90a6'; c.font = '11px sans-serif'; c.fillText(r2 + ' 未追踪' + (s.dirty ? '（框已改）' : ''), 6, y0 + hh / 2 + 4); }
      for (const kf of s.roles[r2].kf) {
        const x = (kf.t / dur) * W;
        c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x, y0); c.lineTo(x + 5, y0 + hh / 2); c.lineTo(x, y0 + hh); c.lineTo(x - 5, y0 + hh / 2); c.fill();
      }
    });
    if (!rows.length) { c.fillStyle = '#7d90a6'; c.font = '12px sans-serif'; c.fillText('本镜没有开启替换的角色：用“框选 A / B”在画面上拖一个框', 8, H / 2 + 4); }
  }
  function drawConfHead(t) {
    const s = cur();
    if (!s) return;
    drawConf();
    const c = conf.getContext('2d');
    const x = ((t - s.start) / (s.end - s.start)) * conf.width;
    c.fillStyle = '#f0a030'; c.fillRect(x - 1, 0, 2, conf.height);
  }
  conf.addEventListener('click', (e) => {
    const s = cur();
    if (!s) return;
    const r = conf.getBoundingClientRect();
    stop();
    seekFilm(s.start + ((e.clientX - r.left) / r.width) * (s.end - s.start));
  });

  /* ------------------------------------------------------------ 渲染面板 */
  function select(i) {
    if (i < 0 || i >= P.shots.length) return;
    S.sel = i;
    const s = P.shots[i];
    if (S.playing !== 'film') { stop(); seekFilm(s.start + 0.001); }
    renderShotList(); renderShotCtl(); drawConf();
    $('#shotTitle').textContent = s.id + ' · ' + fmt(s.start) + ' · ' + (s.end - s.start).toFixed(2) + 's';
    const el = document.querySelector('[data-shot="' + s.id + '"]');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }

  function slider(label, get, set, min, max, step, fmtv) {
    const out = h('output', {}, (fmtv || ((v) => (+v).toFixed(2)))(get()));
    return h('div', { class: 'mini-row' }, h('span', {}, label),
      h('input', { type: 'range', min, max, step, value: get(), oninput: (e) => { set(Number(e.target.value)); out.textContent = (fmtv || ((v) => (+v).toFixed(2)))(e.target.value); comp.invalidate(); redraw(); } }), out);
  }

  function renderCast() {
    const box = $('#castBox');
    box.innerHTML = '';
    for (const r of ROLES) {
      const c = P.cast[r];
      const drop = h('div', { class: 'ref-drop', title: '点击或拖入新角色参考图（纯色背景或透明 PNG 抠像最好）', onclick: () => pickImage((u) => setCastImage(r, u)) });
      if (c.cut) {
        const pv = document.createElement('canvas');
        const b = c.cut.bbox;
        pv.width = b.w; pv.height = b.h;
        const d = new ImageData(Uint8ClampedArray.from(c.cut.data), c.cut.w, c.cut.h);
        for (let i = 0; i < c.cut.alpha.length; i++) d.data[i * 4 + 3] = c.cut.alpha[i];
        const tmp = document.createElement('canvas'); tmp.width = c.cut.w; tmp.height = c.cut.h; tmp.getContext('2d').putImageData(d, 0, 0);
        pv.getContext('2d').drawImage(tmp, b.x, b.y, b.w, b.h, 0, 0, b.w, b.h);
        drop.append(pv);
      } else drop.append('点击或拖入\n新角色参考图');
      drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
      drop.addEventListener('dragleave', () => drop.classList.remove('over'));
      drop.addEventListener('drop', async (e) => { e.preventDefault(); e.stopPropagation(); drop.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) setCastImage(r, await fileToDataURL(f)); });
      const inp = (k, ph, multi) => h(multi ? 'textarea' : 'input', { type: 'text', placeholder: ph, value: c[k] || '', oninput: (e) => { c[k] = e.target.value; } });
      box.append(h('div', { class: 'cast' },
        h('div', { class: 'cast-head' }, h('span', { class: 'tag ' + r }, r), h('b', {}, c.name || '角色' + r), h('span', { class: 'grow' }), c.img ? h('button', { onclick: () => setCastImage(r, null) }, '移除图') : null),
        h('div', { class: 'ref' }, drop, h('div', { style: 'display:grid;gap:6px' },
          h('label', { class: 'fld' }, h('span', {}, '新角色名'), inp('name', '例如 镖师')),
          h('label', { class: 'fld' }, h('span', {}, '替换方式（全局，单镜可覆盖）'),
            h('select', { onchange: (e) => { c.mode = e.target.value; redraw(); renderShotList(); } },
              [['recolor', '换装调色（保留原表演）'], ['standin', '贴图替身（站位/比例预演）'], ['none', '仅追踪（给本地生成用）']].map(([v, l]) => h('option', { value: v, selected: c.mode === v }, l)))))),
        slider('替换强度', () => c.strength, (v) => (c.strength = v), 0, 1, 0.01),
        slider('保留明暗', () => c.keepShade, (v) => (c.keepShade = v), 0, 1, 0.01),
        slider('替身融光', () => c.matchLight, (v) => (c.matchLight = v), 0, 1, 0.01),
        h('label', { class: 'fld' }, h('span', {}, '外观描述（写进本地生成提示词）'), inp('desc', '发型、服装、武器、气质…', true)),
        h('label', { class: 'fld' }, h('span', {}, '分割文字（英文，本地生成用）'), inp('seg', ''))));
    }
    // 场景
    const sc = P.scene;
    const sdrop = h('div', { class: 'ref-drop', style: 'width:100%;height:70px', onclick: () => pickImage(setScene) }, sc.img ? h('img', { src: sc.img, style: 'width:100%;height:100%;object-fit:cover' }) : '点击上传新场景图（替换背景）');
    box.append(h('div', { class: 'cast' },
      h('div', { class: 'sect-title' }, '场景替换', h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: sc.on, onchange: (e) => { sc.on = e.target.checked; redraw(); } }), '启用')),
      sdrop,
      slider('随镜头移动', () => sc.parallax, (v) => (sc.parallax = v), 0, 1.5, 0.01),
      h('div', { class: 'muted', style: 'font-size:11px' }, '人物遮罩之外换成新场景；运动镜头按估计的镜头平移移动背景。')));
    // 调色
    const gr = P.grade;
    box.append(h('div', { class: 'cast' },
      h('div', { class: 'sect-title' }, '整体调色', h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: gr.on, onchange: (e) => { gr.on = e.target.checked; redraw(); } }), '启用')),
      slider('曝光', () => gr.exposure, (v) => (gr.exposure = v), -0.6, 0.6, 0.01),
      slider('对比', () => gr.contrast, (v) => (gr.contrast = v), 0.5, 1.8, 0.01),
      slider('饱和', () => gr.saturation, (v) => (gr.saturation = v), 0, 2, 0.01),
      slider('色相', () => gr.hue, (v) => (gr.hue = v), -60, 60, 1, (v) => Math.round(v) + '°'),
      slider('冷 ↔ 暖', () => gr.temp, (v) => (gr.temp = v), -1, 1, 0.01),
      h('label', { class: 'fld' }, h('span', {}, '统一画面风格（拼进本地生成提示词）'), h('textarea', { value: P.style, oninput: (e) => (P.style = e.target.value) }))));
  }
  async function setScene(url) {
    P.scene.img = url;
    sceneEl = url ? await new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.src = url; }) : null;
    if (url) P.scene.on = true;
    renderCast(); redraw();
  }

  /* 镜头语言选择器 */
  function langRow(s) {
    const L = s.lang || {};
    const set = (k, v) => { s.lang = Object.assign({}, s.lang || {}, { [k]: v || null, auto: false }); renderShotList(); renderShotCtl(); };
    const sel = (k, list, label) => h('select', { title: label, onchange: (e) => set(k, e.target.value) },
      [h('option', { value: '' }, label + '：—')].concat(list.map((x) => h('option', { value: x.id, selected: L[k] === x.id, title: x.desc }, x.zh))));
    const dirs = Object.keys(G.DIRS).filter((d) => d !== 'N').map((d) => ({ id: d, zh: G.DIRS[d] + ' ' + (G.DIR_EN[d] === 'TOWARD CAMERA' ? '逼近镜头' : G.DIR_EN[d] === 'AWAY' ? '远离镜头' : ''), desc: '' }));
    const an = L.auto ? L : L.analysis;
    return h('div', { class: 'role-row' },
      h('b', { style: 'color:var(--accent)' }, '镜头语言'),
      sel('size', G.SIZES, '景别'), sel('angle', G.ANGLES, '角度'), sel('move', G.MOVES, '运动'),
      sel('camDir', dirs, '镜头方向'), sel('subjDir', dirs, '主体方向'),
      h('span', { class: 'stat' }, (L.auto ? '自动标注' : s.lang ? '手动' : '未标注') + (an && an.motion ? ' · 摇 ' + an.motion.pan + ' 俯仰 ' + an.motion.tilt + ' 晃动 ' + an.motion.jitter : '')),
      L && !L.auto && L.analysis ? h('button', { onclick: () => { s.lang = Object.assign({ auto: true, angle: L.angle }, L.analysis); renderShotCtl(); renderShotList(); } }, '用自动结果') : null);
  }

  function renderShotCtl() {
    const box = $('#shotCtl');
    box.innerHTML = '';
    const s = cur();
    if (!s) return;
    box.append(h('div', { class: 'role-row' },
      h('label', {}, h('input', { type: 'checkbox', checked: s.keep, onchange: (e) => { s.keep = e.target.checked; renderShotList(); redraw(); } }), '保留原片（不替换）'),
      h('label', {}, h('input', { type: 'checkbox', checked: s.sceneOn !== false, onchange: (e) => { s.sceneOn = e.target.checked; redraw(); } }), '本镜换场景'),
      s.track ? h('span', { class: 'stat' }, (s.track.static ? '固定机位' : '运动镜头') + (s.track.plate ? ' · 有干净背景板' : '') + ' · ' + s.track.times.length + ' 个采样') : h('span', { class: 'stat' }, '未追踪'),
      s.shot || s.move ? h('span', { class: 'stat' }, '原标注：' + [s.shot, s.move].filter(Boolean).join(' · ')) : null,
      h('span', { class: 'grow' }),
      S.sel > 0 ? h('button', { title: '分镜切多了（例如快速甩镜被误判）时，把本镜并回上一镜', onclick: mergePrev }, '与上一镜合并') : null,
      h('button', { title: '在播放头位置把本镜切成两镜', onclick: splitHere }, '在播放头拆分')));
    box.append(langRow(s));
    for (const r of ROLES) {
      const ro = s.roles[r];
      const upd = () => { comp.invalidate(s.id + '|'); redraw(); };
      box.append(h('div', { class: 'role-row' },
        h('label', {}, h('input', { type: 'checkbox', checked: ro.on, onchange: (e) => { ro.on = e.target.checked; renderShotList(); drawConf(); redraw(); } }), h('span', { class: 'tag ' + r }, r), P.cast[r].name),
        h('select', { onchange: (e) => { ro.mode = e.target.value; upd(); } },
          [['inherit', '沿用全局'], ['recolor', '换装调色'], ['standin', '贴图替身'], ['none', '仅追踪']].map(([v, l]) => h('option', { value: v, selected: ro.mode === v }, l))),
        h('label', {}, '大小', h('input', { type: 'range', min: 0.4, max: 1.8, step: 0.01, value: ro.scale, oninput: (e) => { ro.scale = +e.target.value; upd(); } })),
        h('label', {}, '上下', h('input', { type: 'range', min: -0.6, max: 0.6, step: 0.01, value: ro.dy, oninput: (e) => { ro.dy = +e.target.value; upd(); } })),
        h('label', {}, '左右', h('input', { type: 'range', min: -0.6, max: 0.6, step: 0.01, value: ro.dx, oninput: (e) => { ro.dx = +e.target.value; upd(); } })),
        h('label', {}, h('input', { type: 'checkbox', checked: ro.mirror, onchange: (e) => { ro.mirror = e.target.checked; upd(); } }), '镜像'),
        h('label', { title: '人物与背景同色（如白衣 vs 浅色墙）时，只保留“在动”的部分作为遮罩。改后需重新追踪' }, '运动约束',
          h('select', { onchange: (e) => { ro.motion = e.target.value; markDirty(s); } },
            [['auto', '自动' + (s.track && s.track.roles[r] ? (s.track.roles[r].motionRefined ? '（开）' : '（关）') : '')], ['on', '开'], ['off', '关']].map(([v, l]) => h('option', { value: v, selected: (ro.motion || 'auto') === v }, l)))),
        h('span', { class: 'stat' }, ro.kf.length + ' 关键帧 · ' + ro.neg.length + ' 负点'),
        ro.kf.length || ro.neg.length ? h('button', { onclick: () => { ro.kf = []; ro.neg = []; ro.on = false; if (s.track) delete s.track.roles[r]; comp.invalidate(s.id + '|'); renderShotCtl(); renderShotList(); drawConf(); redraw(); } }, '清除') : null));
    }
    box.append(h('div', { class: 'shot-desc' }, h('input', { type: 'text', placeholder: '镜头描述（剧情动作，写进分镜板与提示词）', value: s.desc, style: 'width:100%', oninput: (e) => { s.desc = e.target.value; } })));
    const ta = h('textarea', { value: promptOf(s), oninput: (e) => { s.prompt = e.target.value; } });
    box.append(h('details', { class: 'prompt' }, h('summary', {}, '本地生成提示词（可选，导出 ComfyUI 任务包时使用）'), ta,
      h('button', { onclick: () => { s.prompt = null; ta.value = autoPrompt(s); } }, '恢复自动')));
  }

  /* 分镜修正：合并 / 拆分。镜头编号随之重排，受影响镜头的追踪结果作废 */
  function renumber() {
    P.shots.forEach((s, i) => { s.n = i + 1; if (/^S\d{3}$/.test(s.id)) s.id = 'S' + String(i + 1).padStart(3, '0'); });
    comp.invalidate();
  }
  function mergePrev() {
    const i = S.sel;
    if (i <= 0) return;
    const a = P.shots[i - 1], b = P.shots[i];
    a.end = b.end; a.track = null; a.dirty = false;
    for (const r of ROLES) if (!a.roles[r].on && b.roles[r].on) a.roles[r] = b.roles[r];
    P.shots.splice(i, 1);
    renumber();
    log('已合并到上一镜：' + a.id + '（' + (a.end - a.start).toFixed(2) + 's），需重新追踪');
    S.sel = -1; select(i - 1);
  }
  function splitHere() {
    const s = cur();
    if (!s) return;
    const fps = P.film ? P.film.fps : 30;
    const t = Math.round(player.currentTime * fps) / fps;
    if (t - s.start < 0.1 || s.end - t < 0.1) return log('播放头离镜头边界太近，先把播放头移到要切开的那一帧', 'err');
    const b = makeShot(0, t, s.end, { shot: s.shot, move: s.move, desc: s.desc });
    for (const r of ROLES) {
      b.roles[r] = Object.assign(newRole(), { on: s.roles[r].on, mode: s.roles[r].mode, neg: s.roles[r].neg.map((p) => p.slice()) });
      b.roles[r].kf = s.roles[r].kf.filter((k) => k.t >= t - s.start).map((k) => ({ t: +(k.t - (t - s.start)).toFixed(3), box: k.box }));
      s.roles[r].kf = s.roles[r].kf.filter((k) => k.t < t - s.start);
    }
    s.end = t; s.track = null;
    const i = P.shots.indexOf(s);
    P.shots.splice(i + 1, 0, b);
    renumber();
    log('已在 ' + fmt(t) + ' 拆分；后一镜没有关键帧的角色需要重新拖框');
    makeThumbs().then(() => select(i + 1));
  }

  function grammarIssues() {
    // 对整片相邻镜头做剪辑语法检查：同一主体用“开启的角色”近似
    const seq = P.shots.map((s) => {
      const L = s.lang || {};
      const on = ROLES.filter((r) => s.roles[r].on);
      return { size: L.size, angle: L.angle, move: L.move, dir: L.subjDir, group: on.length === 1 ? on[0] : on.length ? 'AB' : null };
    });
    const map = new Map();
    for (const iss of G.check(seq)) { const id = P.shots[iss.i].id; if (!map.has(id)) map.set(id, []); map.get(id).push(iss); }
    return map;
  }

  const FILTERS = [['all', '全部'], ['todo', '未追踪'], ['lost', '丢失多'], ['issue', '语法提示'], ['keep', '保留原片']];
  function renderShotList() {
    const fb = $('#filters');
    fb.innerHTML = '';
    FILTERS.forEach(([k, l]) => fb.append(h('button', { class: 'chip' + (S.filter === k ? ' on' : ''), onclick: () => { S.filter = k; renderShotList(); } }, l)));
    const box = $('#shotList');
    box.innerHTML = '';
    const issues = grammarIssues();
    let tracked = 0, need = 0;
    P.shots.forEach((s, i) => {
      const on = ROLES.filter((r) => s.roles[r].on);
      if (on.length && !s.keep) need++;
      if (s.track) tracked++;
      const lostPct = s.track ? Math.max(0, ...Object.values(s.track.roles).map((t) => t.lost.filter(Boolean).length / Math.max(1, t.lost.length))) : 0;
      const iss = issues.get(s.id) || [];
      if (S.filter === 'todo' && (s.track || s.keep || !on.length)) return;
      if (S.filter === 'lost' && lostPct < 0.25) return;
      if (S.filter === 'issue' && !iss.length) return;
      if (S.filter === 'keep' && !s.keep) return;
      const L = s.lang;
      box.append(h('div', { class: 'shot-card' + (i === S.sel ? ' sel' : ''), 'data-shot': s.id, onclick: () => select(i) },
        s.thumb ? h('img', { src: s.thumb, alt: '' }) : h('div', { class: 'noimg' }),
        h('div', {},
          h('div', {}, h('span', { class: 'id' }, s.id), '  ', h('span', { class: 'muted' }, fmt(s.start) + ' · ' + (s.end - s.start).toFixed(2) + 's')),
          L ? h('div', { class: 'muted' }, G.caption(L, true)) : s.shot ? h('div', { class: 'muted' }, s.shot + ' · ' + s.move) : null,
          h('div', { class: 'badges' },
            s.keep ? h('span', { class: 'badge' }, '保留原片') : on.map((r) => h('span', { class: 'badge ' + r }, r)),
            s.track ? h('span', { class: 'badge ' + (lostPct > 0.25 ? 'warn' : 'ok') }, lostPct > 0.25 ? '丢失 ' + Math.round(lostPct * 100) + '%' : '已追踪') : on.length && !s.keep ? h('span', { class: 'badge warn' }, '待追踪') : null,
            s.dirty && s.track ? h('span', { class: 'badge warn' }, '框已改') : null,
            iss.map((x) => h('span', { class: 'badge warn', title: x.text }, { jump: '跳切', axis: '越轴?', leap: '景别跨度' }[x.kind] || '提示'))))));
    });
    $('#shotStats').textContent = P.shots.length ? P.shots.length + ' 镜 · 需替换 ' + need + ' · 已追踪 ' + tracked : '';
    renderStrip();
  }

  function renderStrip() {
    const s = $('#filmStrip');
    s.innerHTML = '';
    if (!P.film || !P.shots.length) return;
    P.shots.forEach((sh, i) => {
      const on = sh.keep ? '' : ROLES.filter((r) => sh.roles[r].on).join('');
      s.append(h('button', { class: on + (sh.track ? '' : ' pending') + (i === S.sel ? ' sel' : ''), style: 'flex:' + (sh.end - sh.start), title: sh.id + ' ' + fmt(sh.start) + (sh.lang ? ' · ' + G.caption(sh.lang, true) : ''), onclick: () => select(i) }));
    });
    s.append(h('div', { class: 'ph' }));
  }

  function renderAll() { renderCast(); renderShotList(); renderShotCtl(); drawConf(); redraw(); }

  /* ------------------------------------------------------------ 提示词 */
  const roleName = (r) => (P.cast[r].name || '').trim() || '角色' + r;
  function autoPrompt(s) {
    const d = (s.desc || '').replace(/角色A|(?<![A-Za-z])A(?![A-Za-z])/g, roleName('A')).replace(/角色B|(?<![A-Za-z])B(?![A-Za-z])/g, roleName('B'));
    const looks = ROLES.filter((r) => s.roles[r].on && P.cast[r].desc.trim()).map((r) => roleName(r) + '：' + P.cast[r].desc.trim()).join('；');
    const lang = s.lang ? G.caption(s.lang, true) : [s.shot, s.move].filter(Boolean).join('，');
    return [lang, d, looks, P.style].filter(Boolean).join('。') + '。';
  }
  const promptOf = (s) => (s.prompt != null ? s.prompt : autoPrompt(s));

  /* ------------------------------------------------------------ 分镜板 */
  async function exportStoryboard(style) {
    $('#exportMenu').hidden = true;
    const list = P.shots.filter((s) => !S.storyRange || (s.start >= S.storyRange[0] && s.end <= S.storyRange[1]));
    if (!list.length) return log('没有镜头', 'err');
    const panels = [];
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      const L = s.lang || G.parseTags(s.shot + ' ' + s.move) || {};
      const figures = [];
      if (s.track) {
        const W = s.track.W, H = s.track.H;
        for (const r of Object.keys(s.track.roles)) {
          const bs = s.track.roles[r].boxes.filter(Boolean);
          if (!bs.length) continue;
          const a = bs[0], b = bs[bs.length - 1];
          figures.push({ x: (a.x + a.w / 2) / W, y: (a.y + a.h) / H, h: a.h / H, col: RC.ROLE_COL[r], from: [(a.x + a.w / 2) / W, (a.y + a.h) / H], to: [(b.x + b.w / 2) / W, (b.y + b.h) / H] });
        }
      } else {
        for (const r of ROLES) {
          const k = s.roles[r].kf[0];
          if (k) figures.push({ x: k.box[0] + k.box[2] / 2, y: k.box[1] + k.box[3], h: k.box[3], col: RC.ROLE_COL[r] });
        }
      }
      let frame = null;
      if (style === 'frame' && s.thumb) frame = await new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = s.thumb; });
      panels.push({ n: i + 1, caption: G.caption(L) || [s.shot, s.move].filter(Boolean).join(' · ') || s.id, sub: s.id + ' · ' + (s.desc || G.caption(L, true)), frame, figures, size: L.size,
        camMove: L.move, camDir: L.camDir, impact: /击中|重击|撞|砍|劈|刺|impact|hit/i.test(s.desc || '') });
    }
    const title = (S.storyTitle || 'SEQ. 01 – ' + (P.film ? SC.baseName(P.film.name) : 'Fight Beat'));
    const chunk = 16;
    for (let p = 0; p < panels.length; p += chunk) {
      const cv2 = SC.storyboard.render({ title: title + (panels.length > chunk ? '  (' + (p / chunk + 1) + ')' : ''), subtitle: '由追踪与镜头语言自动生成', panels: panels.slice(p, p + chunk), style, cols: 4, aspect: P.film ? P.film.h / P.film.w : 9 / 16, footer: 'CONTINUOUS ACTION' });
      SC.storyboard.download(cv2, 'storyboard_' + style + '_' + (p / chunk + 1) + '.png');
    }
    log('分镜板已导出：' + panels.length + ' 格（' + (style === 'sketch' ? '线稿风' : '实拍帧') + '）', 'ok');
  }

  /* ------------------------------------------------------------ 导出：整片替换预演 */
  async function exportPrevis() {
    $('#exportMenu').hidden = true;
    if (!S.url) return log('请先打开原片', 'err');
    if (!window.MediaRecorder || !cv.captureStream) return log('浏览器不支持录制，请用新版 Chrome / Edge', 'err');
    await runTask('导出整片替换预演', async (sig) => {
      stop();
      const prevView = S.view;
      S.view = 'final';
      const stream = cv.captureStream(Math.min(30, P.film.fps));
      try {
        const as = player.captureStream ? player.captureStream() : player.mozCaptureStream ? player.mozCaptureStream() : null;
        if (as) as.getAudioTracks().forEach((t) => stream.addTrack(t));
      } catch (e) { log('未能录入原声：' + e.message, 'err'); }
      const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m));
      const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8e6 });
      const chunks = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      const done = new Promise((res) => (rec.onstop = res));
      player.currentTime = 0;
      await new Promise((res) => player.addEventListener('seeked', res, { once: true }));
      rec.start(1000);
      S.playing = 'film';
      await player.play();
      await new Promise((res) => {
        const tick = () => {
          if (sig.cancelled || player.ended || player.currentTime >= P.film.duration - 0.05) return res();
          progress('导出整片替换预演（实时合成）', player.currentTime / P.film.duration);
          setTimeout(tick, 250);
        };
        tick();
      });
      stop();
      rec.stop();
      await done;
      S.view = prevView;
      if (sig.cancelled) throw new Error('已取消');
      const blob = new Blob(chunks, { type: 'video/webm' });
      const a = h('a', { href: URL.createObjectURL(blob), download: SC.baseName(P.film.name) + '_替换预演.webm' });
      document.body.append(a); a.click(); a.remove();
      log('整片替换预演已导出（webm，含原声）。转 MP4：ffmpeg -i 输入.webm -c:v libx264 -crf 18 -c:a aac 输出.mp4', 'ok');
    });
  }

  /* ------------------------------------------------------------ 导出：本地 ComfyUI 任务包 */
  function openLocalDlg() {
    $('#exportMenu').hidden = true;
    const L = P.local;
    $('#lc_url').value = L.url; $('#lc_cw').value = L.cw; $('#lc_ch').value = L.ch; $('#lc_fps').value = L.fps;
    $('#lc_wfname').textContent = L.wfName ? '已载入：' + L.wfName : '未载入';
    const tb = $('#lc_map');
    tb.innerHTML = '';
    for (const [k, label] of MAP_ROWS) {
      const m = L.map[k] || (L.map[k] = { nodeId: '', field: '' });
      tb.append(h('tr', {}, h('td', {}, label),
        h('td', {}, h('input', { type: 'text', value: m.nodeId, placeholder: '—', oninput: (e) => (m.nodeId = e.target.value.trim()) })),
        h('td', {}, h('input', { type: 'text', value: m.field, oninput: (e) => (m.field = e.target.value.trim()) }))));
    }
    $('#localDlg').showModal();
  }
  $('#lc_wf').onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try { P.local.workflow = JSON.parse(await f.text()); P.local.wfName = f.name; $('#lc_wfname').textContent = '已载入：' + f.name; }
    catch (err) { $('#lc_wfname').textContent = '不是有效 JSON'; }
  };
  $('#lc_go').onclick = () => {
    const L = P.local;
    L.url = $('#lc_url').value.trim(); L.cw = +$('#lc_cw').value || 854; L.ch = +$('#lc_ch').value || 480; L.fps = +$('#lc_fps').value || 16;
    const images = {};
    const addImg = (key, url) => { if (!url) return null; const [m, b] = url.split(','); images[key] = { filename: key + (m.includes('png') ? '.png' : '.jpg'), mime: m.slice(5, m.indexOf(';')), b64: b }; return key; };
    const cast = {};
    for (const r of ROLES) cast[r] = { name: roleName(r), desc: P.cast[r].desc, seg: P.cast[r].seg, image: addImg('cast_' + r, P.cast[r].img) };
    const shots = P.shots.map((s) => {
      const roles = {};
      if (!s.keep) for (const r of ROLES) {
        const ro = s.roles[r];
        if (!ro.on) continue;
        // 正点：追踪结果第一帧的主体中心（没有追踪就用初始框中心），换算到工作流画布坐标
        const tb = s.track && s.track.roles[r] && s.track.roles[r].boxes.find(Boolean);
        const c = tb ? [(tb.x + tb.w / 2) / s.track.W, (tb.y + tb.h * 0.4) / s.track.H] : ro.kf[0] ? [ro.kf[0].box[0] + ro.kf[0].box[2] / 2, ro.kf[0].box[1] + ro.kf[0].box[3] * 0.4] : null;
        if (!c) continue;
        roles[r] = { image: cast[r].image, points: [[Math.round(c[0] * L.cw), Math.round(c[1] * L.ch)]], neg: ro.neg.map((p) => [Math.round(p[0] * L.cw), Math.round(p[1] * L.ch)]), seg: P.cast[r].seg };
      }
      return { id: s.id, start: s.start, end: s.end, keep: !Object.keys(roles).length, prompt: promptOf(s), lang: s.lang ? G.caption(s.lang) : '', roles };
    });
    const job = { format: 'recast-local-job', version: 1, createdAt: new Date().toISOString(), film: P.film,
      comfy: { url: L.url, workflow: L.workflow, nodes: L.map, coordW: L.cw, coordH: L.ch, fps: L.fps }, cast, images, shots };
    download('recast_job.json', JSON.stringify(job), 'application/json');
    $('#localDlg').close();
    const n = shots.filter((s) => !s.keep).length;
    log('已导出本地生成任务包（' + n + ' 个镜头待生成）。运行：python tools/recast_local.py recast_job.json "' + (P.film ? P.film.name : '原片.mp4') + '"' + (L.workflow ? '' : '（注意：还没载入工作流 JSON）'), L.workflow ? 'ok' : 'err');
  };

  function download(name, text, type) {
    const a = h('a', { href: URL.createObjectURL(new Blob([text], { type: type || 'text/plain;charset=utf-8' })), download: name });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  /* ------------------------------------------------------------ 工程 */
  function saveProject() {
    const out = JSON.parse(JSON.stringify(P, (k, v) => (k === 'cut' || k === 'refStats' || k === 'bits' || k === 'el' ? undefined : v)));
    download((P.film ? SC.baseName(P.film.name) : 'recast') + '.recast.json', JSON.stringify(out), 'application/json');
    log('工程已保存（含镜头表、关键帧、追踪结果与遮罩；不含视频本身）', 'ok');
  }
  async function openProject(file) {
    const d = JSON.parse(await file.text());
    if (d.app !== 'recast') throw new Error('不是换角预览台工程');
    Object.assign(P, d);
    for (const r of ROLES) { P.cast[r] = Object.assign(newCast(r), d.cast[r]); if (P.cast[r].img) await setCastImage(r, P.cast[r].img); }
    if (P.scene.img) await setScene(P.scene.img);
    comp.invalidate();
    S.sel = -1;
    log('已打开工程：' + P.shots.length + ' 个镜头。请“打开原片”选择同一个视频文件。', 'ok');
    if (P.shots.length) select(0); else renderAll();
    renderCast();
  }

  /* ------------------------------------------------------------ 工具栏 */
  const actions = {
    openFilm: () => $('#fileFilm').click(),
    importShots: () => $('#fileShots').click(),
    detect: () => { if (P.shots.some((s) => s.track) && !confirm('重新分镜会清掉现有镜头表与追踪结果，继续？')) return; detectShots(); },
    trackShot: () => { const s = cur(); if (!s) return log('先选择一个镜头', 'err'); runTask('追踪 ' + s.id, async (sig) => { await trackShot(s, sig); s.dirty = false; renderShotList(); renderShotCtl(); drawConf(); redraw(); }); },
    trackAll: () => runTask('追踪全部', async (sig) => {
      const list = P.shots.filter((s) => !s.keep && ROLES.some((r) => s.roles[r].on && s.roles[r].kf.length) && (!s.track || s.dirty));
      if (!list.length) return log('没有待追踪的镜头（需要先给角色拖框）');
      for (let i = 0; i < list.length; i++) {
        if (sig.cancelled) throw new Error('已取消');
        progress('追踪全部 ' + (i + 1) + '/' + list.length, i / list.length);
        await trackShot(list[i], sig, true);
        list[i].dirty = false;
        if (i % 3 === 0) renderShotList();
      }
      log('追踪完成 ' + list.length + ' 个镜头', 'ok');
      renderShotList(); renderShotCtl(); drawConf(); redraw();
    }),
    openProj: () => $('#fileProj').click(),
    saveProj: saveProject,
    exportMenu: () => { $('#exportMenu').hidden = !$('#exportMenu').hidden; },
    cancel: () => { if (S.task) { S.task.cancelled = true; log('正在取消…'); } },
  };
  $$('[data-act]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); actions[b.dataset.act](); }));
  $$('[data-exp]').forEach((b) => b.addEventListener('click', () => ({ previs: exportPrevis, local: openLocalDlg, sketch: () => exportStoryboard('sketch'), frame: () => exportStoryboard('frame'),
    shots: () => download('shots.json', JSON.stringify(P.shots.map((s) => ({ id: s.id, n: s.n, start: s.start, end: s.end, frames: Math.round((s.end - s.start) * (P.film ? P.film.fps : 30)), shot: s.lang ? G.caption(s.lang, true) : s.shot, move: s.move, desc: s.desc, keep: s.keep, lang: s.lang || null })), null, 1), 'application/json') })[b.dataset.exp]()));
  document.addEventListener('click', (e) => { if (!e.target.closest('.menu')) $('#exportMenu').hidden = true; });
  const guard = (fn) => async (e) => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; try { await fn(f); } catch (err) { log(err.message, 'err'); } };
  $('#fileFilm').onchange = guard(openFilm);
  $('#fileShots').onchange = guard(importShots);
  $('#fileProj').onchange = guard(openProject);
  $('#viewSeg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; S.view = b.dataset.view; $$('#viewSeg button').forEach((x) => x.classList.toggle('on', x === b)); redraw(); });
  $('#toolSeg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; S.tool = b.dataset.tool; $$('#toolSeg button').forEach((x) => x.classList.toggle('on', x === b)); });
  $('#btnClearKf').onclick = () => {
    const s = cur();
    if (!s) return;
    const t = player.currentTime - s.start, fps = Math.min(P.work.fps, P.film ? P.film.fps : 30);
    let n = 0;
    for (const r of ROLES) { const before = s.roles[r].kf.length; s.roles[r].kf = s.roles[r].kf.filter((k) => Math.abs(k.t - t) >= 0.6 / fps); n += before - s.roles[r].kf.length; }
    if (n) { markDirty(s); renderShotCtl(); drawConf(); drawUI(); log('删除 ' + n + ' 个关键帧'); } else log('当前帧没有关键帧');
  };
  $('#btnPlayShot').onclick = () => play('shot');
  $('#btnPlayFilm').onclick = () => play('film');
  const step = (d) => { stop(); seekFilm(player.currentTime + d / (P.film ? P.film.fps : 30)); };
  $('#btnPrevF').onclick = () => step(-1);
  $('#btnNextF').onclick = () => step(1);
  $('#scrub').addEventListener('input', (e) => { const s = cur(); if (!s) return; S.scrubbing = true; stop(); seekFilm(s.start + Number(e.target.value) * (s.end - s.start - 0.01)); });
  $('#scrub').addEventListener('change', () => { S.scrubbing = false; });
  $('#vol').oninput = (e) => (player.volume = Number(e.target.value));
  // 对比视图：在画面上拖动分割线
  cv.parentElement.addEventListener('mousemove', (e) => { if (S.view !== 'compare' || !(e.buttons & 1) || S.draft) return; const r = cv.getBoundingClientRect(); S.split = SC.clamp((e.clientX - r.left) / r.width, 0, 1); redraw(); });
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input,textarea,select,dialog')) return;
    const k = e.key;
    if (k === ' ') { e.preventDefault(); play(S.playing || 'shot'); }
    else if (k === 'ArrowLeft') step(e.shiftKey ? -10 : -1);
    else if (k === 'ArrowRight') step(e.shiftKey ? 10 : 1);
    else if (k === 'ArrowUp') { e.preventDefault(); select(S.sel - 1); }
    else if (k === 'ArrowDown') { e.preventDefault(); select(S.sel + 1); }
    else if (k >= '1' && k <= '4') $$('#viewSeg button')[+k - 1].click();
    else if (k === 'a' || k === 'A') $('#toolSeg [data-tool=boxA]').click();
    else if (k === 'b' || k === 'B') $('#toolSeg [data-tool=boxB]').click();
    else if (k === 'n' || k === 'N') $('#toolSeg [data-tool=neg]').click();
    else if (k === 't' || k === 'T') actions.trackShot();
  });
  // 拖入原片 / 镜头表
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', async (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f) return;
    try {
      if ((f.type || '').startsWith('video/') || /\.(mp4|mov|mkv|webm|m4v)$/i.test(f.name)) await openFilm(f);
      else if (/\.json$/i.test(f.name)) { const txt = await f.text(); if (/"app"\s*:\s*"recast"/.test(txt.slice(0, 200))) await openProject(f); else await importShots(f); }
    } catch (err) { log(err.message, 'err'); }
  });

  window.RECAST = { P, S, comp, log, select, trackShot, G };
  renderAll();
  log('换角预览台就绪。流程：① 打开原片（自动逐帧分镜）或导入旧镜头表 ② 选镜头，用“框选 A/B”拖框 ③ 追踪本镜（T）④ 左侧上传新角色参考图，选替换方式 ⑤ 导出整片替换预演 / 分镜板。');
})();
