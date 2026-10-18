/* 自动剪辑求解器。
 *
 * 线性模式（导入了剧本时间线）：
 *   1. 剧本展平为“可见区间”（插入镜头打断外层段落 → 交叉剪辑）。
 *   2. 每个段落按可见时长拆成若干槽位；为“镜头 × 槽位”计算多因子匹配分：
 *        文件名编号 · 文本相似度(TF-IDF) · 线索视觉签名 · 时长贴合 · 能量/剧情强度 · 对白 · 素材顺序
 *   3. 匈牙利算法求全局最优指派（含“弃用”虚拟列，低于置信阈值的镜头不硬塞）。
 *   4. 段内按素材顺序成流，按可见区间消费；超长时智能取窗裁剪（避开对白中途、按强度挑运动段）。
 *
 * 非线性模式（无剧本）：
 *   1. MMR 选片（质量 + 去重复），2. 束搜索排序：目标情绪曲线、组间穿插节奏、视觉衔接（顺接/跳切）、
 *   源顺序保持，3. 按节奏曲线分配镜头长度（高潮更碎）并收敛到目标总长。
 */
(function (g) {
  'use strict';
  const SC = (g.SC = g.SC || {});

  SC.DEFAULT_PARAMS = {
    mode: 'auto',
    threshold: 0.3, minShot: 0.6,
    wId: 3, wText: 1.2, wLine: 1.5, wDur: 0.6, wEnergy: 0.8, wDialog: 0.4, wOrder: 0.8,
    minScore: 0.2, spread: 0.5, ripple: false,
    target: 0, asl: 3, pacing: 0.5, crossCut: 0.5, continuity: 0.3, orderKeep: 0.7, variety: 0.4,
    curve: [0.3, 0.5, 0.75, 0.95], actSplit: [0.22, 0.36, 0.24, 0.18], beam: 24, clusters: 0,
    fps: 25, width: 1920, height: 1080,
  };

  /* ---------------------------------------------------------------- 预处理 */

  /** 素材 → 求解器镜头列表，计算能量、顺序、线索归属概率 */
  SC.prepareShots = function (mediaList, script, overrides) {
    overrides = overrides || {};
    const segIds = script ? new Set(script.segments.map((s) => s.id)) : null;
    const lineIds = script ? script.lines.map((l) => l.id) : [];
    const media = mediaList.slice().sort((a, b) => SC.naturalCompare(a.name, b.name));
    const shots = [];
    media.forEach((m, mi) => {
      const idHintMedia = segIds ? SC.idFromName(m.name, segIds) : null;
      (m.shots || []).forEach((sh, k) => {
        const id = m.id + '#' + k;
        const ov = overrides[id] || {};
        if (ov.exclude) return;
        const idHint = ov.pin || idHintMedia;
        let lineTag = ov.line || m.line || (idHint ? idHint[0] : null);
        if (lineTag && script && !lineIds.includes(lineTag)) lineTag = null;
        shots.push({
          id, mediaId: m.id, name: m.name, k, mi,
          in: sh.in, out: sh.out, dur: sh.out - sh.in,
          text: SC.baseName(m.name).replace(/[_\-.]+/g, ' ') + ' ' + (m.note || '') + ' ' + (ov.note || ''),
          idHint, pin: ov.pin || null, lineTag,
          feat: sh.feat, prof: sh.prof, vis: SC.visVector(sh.feat),
        });
      });
    });
    const n = shots.length;
    shots.forEach((s, i) => (s.rank = n > 1 ? i / (n - 1) : 0.5));
    // 文件名普遍带序号（1.mp4、shot_03…）时，素材顺序才是可信的先验
    const numbered = media.filter((m) => /\d/.test(SC.baseName(m.name))).length;
    shots.orderReliable = media.length > 1 && numbered / media.length >= 0.8;
    // 能量：运动量与响度各自做百分位归一后加权，跨素材可比
    const withF = shots.filter((s) => s.feat);
    const rm = SC.rankNorm(withF.map((s) => s.feat.motion));
    const anyAudio = withF.some((s) => s.feat.hasAudio && s.feat.rms > 0);
    const ra = SC.rankNorm(withF.map((s) => s.feat.rms));
    withF.forEach((s, i) => (s.energy = anyAudio ? 0.6 * rm[i] + 0.4 * ra[i] : rm[i]));
    shots.forEach((s) => { if (s.energy == null) s.energy = 0.5; s.speech = s.feat ? s.feat.speech : 0; });
    inferLines(shots, lineIds);
    return shots;
  };

  /** 线索归属：已知线索（文件名编号/手动标注）的镜头构成视觉质心，未知镜头按高斯核距离得到概率 */
  function inferLines(shots, lineIds) {
    const L = lineIds.length;
    shots.forEach((s) => { s.lineProb = L ? lineIds.map(() => 1 / L) : []; s.lineGuess = s.lineTag; s.lineConf = s.lineTag ? 1 : 0; });
    if (!L) return;
    const cents = lineIds.map((lid) => {
      const vs = shots.filter((s) => s.lineTag === lid && s.vis).map((s) => s.vis);
      if (!vs.length) return null;
      const c = new Array(vs[0].length).fill(0);
      for (const v of vs) for (let d = 0; d < c.length; d++) c[d] += v[d] / vs.length;
      return c;
    });
    const intra = [];
    shots.forEach((s) => { if (s.lineTag && s.vis) intra.push(SC.dist(s.vis, cents[lineIds.indexOf(s.lineTag)])); });
    const sigma = Math.max(0.15, SC.median(intra) * 1.5 || 0.4);
    // 开放集：没有样本的线索按“典型类外距离 2σ”给核权重，远离所有已知质心的镜头会自然归到未知线索
    const wUnknown = Math.exp(-2);
    shots.forEach((s) => {
      if (s.lineTag) { s.lineProb = lineIds.map((l) => (l === s.lineTag ? 1 : 0)); return; }
      if (!s.vis || !cents.some(Boolean)) return;
      const w = lineIds.map((l, i) => (cents[i] ? Math.exp(-Math.pow(SC.dist(s.vis, cents[i]), 2) / (2 * sigma * sigma)) : wUnknown));
      const sum = SC.sum(w) || 1;
      const p = w.map((x) => x / sum);
      s.lineProb = p;
      const bi = p.indexOf(Math.max(...p));
      s.lineGuess = p[bi] > 0.5 ? lineIds[bi] : null;
      s.lineConf = p[bi];
    });
  }

  /* ---------------------------------------------------------------- 智能取窗 */

  /** 在镜头内挑一段长度为 len 的窗口：强度高 → 偏向运动峰值；边界避开响度高处（不切在台词中间）；略偏居中 */
  SC.bestWindow = function (shot, len, intensity) {
    if (len >= shot.dur - 1e-6) return [shot.in, shot.out];
    const p = shot.prof;
    if (!p || !p.m.length) {
      const c = (shot.in + shot.out) / 2;
      return [c - len / 2, c + len / 2];
    }
    const N = p.m.length, W = Math.max(1, Math.round(len / p.dt));
    const mMax = Math.max(...p.m) || 1, aMax = Math.max(...p.a) || 1;
    const pre = [0];
    for (let i = 0; i < N; i++) pre.push(pre[i] + p.m[i] / mMax);
    const steps = Math.max(1, N - W);
    let best = 0, bestScore = -Infinity;
    const bias = (intensity == null ? 0.5 : intensity) - 0.5;
    for (let s = 0; s <= steps; s++) {
      const e = Math.min(N, s + W);
      const meanM = (pre[e] - pre[s]) / (e - s);
      const center = 1 - Math.abs(s / steps - 0.5) * 2;
      const edgeA = ((p.a[s] || 0) + (p.a[Math.min(N - 1, e)] || 0)) / (2 * aMax);
      const sc = 2 * bias * meanM + 0.3 * center - 0.6 * edgeA;
      if (sc > bestScore) { bestScore = sc; best = s; }
    }
    const a = shot.in + best * p.dt;
    return [a, Math.min(shot.out, a + len)];
  };

  /* ---------------------------------------------------------------- 线性 */

  function linearSolve(script, shots, P) {
    const pieces = SC.flattenScript(script);
    const vis = new Map();
    for (const pc of pieces) if (pc.seg) vis.set(pc.seg, (vis.get(pc.seg) || 0) + pc.end - pc.start);
    const segs = script.segments.filter((s) => (vis.get(s.id) || 0) > 0.04);
    const lineIds = script.lines.map((l) => l.id);
    const L = lineIds.length;
    const segRank = new Map(segs.map((s, i) => [s.id, segs.length > 1 ? i / (segs.length - 1) : 0.5]));

    const slotDur = SC.clamp(SC.median(shots.map((s) => s.dur)) || 3, 1.5, 8);
    const slots = [];
    for (const s of segs) {
      const v = vis.get(s.id);
      const k = SC.clamp(Math.round(v / slotDur), 1, 8);
      for (let j = 0; j < k; j++) slots.push({ seg: s, j, exp: v / k });
    }

    // 文本相似度：段落(标题加权) vs 镜头(文件名+备注/提示词)
    const segTexts = segs.map((s) => s.title + ' ' + s.title + ' ' + (s.desc || ''));
    const idx = new SC.TextIndex(segTexts.concat(shots.map((s) => s.text)));
    const segV = segs.map((s, i) => idx.vec(segTexts[i]));
    const shotV = shots.map((s) => idx.vec(s.text));
    const sim = shots.map((s, i) => segs.map((g2, j) => SC.cosine(shotV[i], segV[j])));
    let maxSim = 0;
    sim.forEach((r) => r.forEach((v) => (maxSim = Math.max(maxSim, v))));
    // 以最大相似度归一，但下限 0.25：全体都不相关时不把噪声放大成“满分”
    const simScale = 1 / Math.max(maxSim, 0.25);
    const segPos = new Map(segs.map((s, i) => [s.id, i]));

    const wSum = P.wText + P.wLine + P.wDur + P.wEnergy + P.wDialog + P.wOrder || 1;
    const breakdown = (shot, si, seg, exp) => {
      const li = lineIds.indexOf(seg.line);
      const lineP = L > 1 ? (shot.lineProb[li] - 1 / L) * (L / (L - 1)) : 0;
      const hasF = !!shot.feat;
      return {
        id: shot.idHint ? (shot.idHint === seg.id ? 1 : -1) : 0,
        text: sim[si][segPos.get(seg.id)] * simScale,
        line: lineP,
        dur: 1 - Math.min(1, Math.abs(Math.log(shot.dur / exp)) / Math.log(4)),
        energy: hasF ? 1 - Math.abs(shot.energy - seg.estIntensity) : 0.5,
        dialog: hasF && shot.feat.hasAudio ? 1 - Math.abs(Math.min(1, shot.speech * 1.5) - seg.estDialogue) : 0.5,
        order: shots.orderReliable ? 1 - Math.abs(shot.rank - segRank.get(seg.id)) : 0.5,
      };
    };
    const scoreOf = (b) => (P.wText * b.text + P.wLine * b.line + P.wDur * b.dur + P.wEnergy * b.energy + P.wDialog * b.dialog + P.wOrder * b.order) / wSum + (P.wId * b.id) / 2;
    // 展示用置信度 0..1：编号命中/冲突按固定幅度加减，不随权重放大
    const confOf = (b) => SC.clamp((P.wText * b.text + P.wLine * b.line + P.wDur * b.dur + P.wEnergy * b.energy + P.wDialog * b.dialog + P.wOrder * b.order) / wSum + 0.35 * b.id, 0, 1);

    const n = shots.length, S = slots.length;
    const cost = [];
    for (let i = 0; i < n; i++) {
      const row = new Array(S + n);
      const sh = shots[i];
      for (let c = 0; c < S; c++) {
        const sl = slots[c];
        if (sh.pin) { row[c] = sh.pin === sl.seg.id ? -100 + sl.j : 100; continue; }
        row[c] = -(scoreOf(breakdown(sh, i, sl.seg, sl.exp)) - P.spread * 0.08 * sl.j);
      }
      for (let d = 0; d < n; d++) row[S + d] = d === i ? -P.minScore : 1e6;
      cost.push(row);
    }
    const assign = n ? SC.hungarian(cost) : [];

    const segShots = new Map();
    const unused = [];
    assign.forEach((c, i) => {
      if (c >= 0 && c < S) {
        const seg = slots[c].seg;
        const b = breakdown(shots[i], i, seg, slots[c].exp);
        if (!segShots.has(seg.id)) segShots.set(seg.id, []);
        segShots.get(seg.id).push({ shot: shots[i], score: scoreOf(b), conf: confOf(b), b });
      } else unused.push(shots[i]);
    });

    // 段内成流：按素材顺序；超长则按比例分配并智能取窗，过短的镜头按分数淘汰
    const streams = new Map();
    for (const seg of segs) {
      let list = (segShots.get(seg.id) || []).slice().sort((a, b) => a.shot.rank - b.shot.rank);
      const V = vis.get(seg.id);
      let lens;
      for (;;) {
        const Ssum = SC.sum(list.map((x) => x.shot.dur));
        if (Ssum <= V + 1e-6) { lens = list.map((x) => x.shot.dur); break; }
        lens = list.map((x) => (x.shot.dur * V) / Ssum);
        if (list.length <= 1 || Math.min(...lens) >= P.minShot) break;
        let wi = 0;
        list.forEach((x, k) => { if (x.score < list[wi].score) wi = k; });
        unused.push(list[wi].shot);
        list.splice(wi, 1);
      }
      streams.set(seg.id, list.map((x, k) => {
        const [a, b] = SC.bestWindow(x.shot, lens[k], seg.estIntensity);
        return { shot: x.shot, a, b, score: x.score, conf: x.conf, bd: x.b };
      }));
    }

    const items = [];
    const cursor = new Map();
    for (const pc of pieces) {
      let need = pc.end - pc.start;
      const seg = pc.seg ? script.segments[script.segIndex.get(pc.seg)] : null;
      if (!seg) { items.push(gap(need, null, 'nocover')); continue; }
      const st = streams.get(seg.id) || [];
      let cur = cursor.get(seg.id) || { k: 0, off: 0 };
      while (need > 1e-4 && cur.k < st.length) {
        const el = st[cur.k];
        const avail = el.b - el.a - cur.off;
        const take = Math.min(avail, need);
        items.push(clipItem(el.shot, el.a + cur.off, el.a + cur.off + take, seg, el.conf));
        need -= take;
        cur.off += take;
        if (cur.off >= el.b - el.a - 1e-4) cur = { k: cur.k + 1, off: 0 };
      }
      cursor.set(seg.id, cur);
      if (need > 1e-4) items.push(gap(need, seg, 'missing'));
    }
    let out = mergeItems(items);
    if (P.ripple) out = out.filter((it) => it.type !== 'gap');

    const segRows = script.segments.map((s) => {
      const st = streams.get(s.id) || [];
      const V = vis.get(s.id) || 0;
      const filled = Math.min(V, SC.sum(st.map((x) => x.b - x.a)));
      return {
        seg: s.id, line: s.line, title: s.title, vis: V, filled,
        conf: st.length ? SC.mean(st.map((x) => x.conf)) : 0,
        shots: st.map((x) => ({ id: x.shot.id, name: x.shot.name, score: x.conf, b: x.bd })),
      };
    });
    return { items: out, segRows, unused: unused.map((s) => s.id), pieces };
  }

  function clipItem(shot, a, b, seg, score) {
    return { type: 'clip', shotId: shot.id, mediaId: shot.mediaId, name: shot.name, srcIn: a, srcOut: b, seg: seg ? seg.id : null, line: seg ? seg.line : shot.lineGuess || shot.group || null, score: score == null ? null : +score.toFixed(3), energy: shot.energy };
  }
  function gap(d, seg, why) {
    return { type: 'gap', dur: d, seg: seg ? seg.id : null, line: seg ? seg.line : null, why };
  }
  function mergeItems(items) {
    const out = [];
    for (const it of items) {
      const last = out[out.length - 1];
      if (last && it.type === 'gap' && last.type === 'gap' && last.seg === it.seg && last.why === it.why) last.dur += it.dur;
      else if (last && it.type === 'clip' && last.type === 'clip' && last.shotId === it.shotId && last.seg === it.seg && Math.abs(last.srcOut - it.srcIn) < 1e-4) last.srcOut = it.srcOut;
      else out.push(Object.assign({}, it));
    }
    return out.filter((it) => (it.type === 'gap' ? it.dur > 0.02 : it.srcOut - it.srcIn > 0.02));
  }

  /* ---------------------------------------------------------------- 非线性 */

  SC.curveAt = function (P, pos) {
    const split = P.actSplit, c = P.curve;
    const tot = SC.sum(split) || 1;
    let acc = 0;
    const centers = split.map((w) => { const m = (acc + w / 2) / tot; acc += w; return m; });
    if (pos <= centers[0]) return c[0];
    for (let i = 0; i + 1 < centers.length; i++) {
      if (pos <= centers[i + 1]) return SC.lerp(c[i], c[i + 1], (pos - centers[i]) / (centers[i + 1] - centers[i]));
    }
    return c[c.length - 1];
  };

  function assignGroups(shots, lineIds, P) {
    const guessed = shots.filter((s) => s.lineGuess).length;
    if (lineIds.length && guessed >= shots.length * 0.5) {
      shots.forEach((s) => (s.group = s.lineGuess || '?'));
      return 'line';
    }
    const withV = shots.filter((s) => s.vis);
    const k = P.clusters || SC.clamp(Math.round(Math.sqrt(withV.length / 2)), withV.length >= 4 ? 2 : 1, 4);
    if (withV.length >= 2) {
      const km = SC.kmeans(withV.map((s) => s.vis), k, 25);
      withV.forEach((s, i) => (s.group = 'G' + (km.labels[i] + 1)));
    }
    shots.forEach((s) => { if (!s.group) s.group = 'M' + s.mi; });
    return 'cluster';
  }

  function nonlinearSolve(shots, P, lineIds) {
    const groupMode = assignGroups(shots, lineIds, P);
    const asl = Math.max(0.5, P.asl);
    const useLen = (s) => Math.min(s.dur, asl * 1.5);
    // 1) MMR 选片
    let pool = shots.slice();
    if (P.target > 0 && SC.sum(pool.map(useLen)) > P.target * 1.15) {
      const quality = (s) => {
        const f = s.feat;
        let q = 1 - Math.min(1, Math.abs(Math.log(Math.max(0.2, s.dur) / asl)) / Math.log(6));
        if (f) q += 0.4 * (1 - f.dark) + 0.2 * Math.min(1, f.lstd * 4);
        return q;
      };
      const picked = [];
      const rest = pool.slice();
      let acc = 0;
      while (rest.length && acc < P.target * 1.15) {
        let bi = 0, bs = -Infinity;
        rest.forEach((s, i) => {
          let md = 1;
          if (s.vis) for (const p of picked) if (p.vis) md = Math.min(md, SC.dist(s.vis, p.vis));
          const v = quality(s) + P.variety * 2 * md;
          if (v > bs) { bs = v; bi = i; }
        });
        const s = rest.splice(bi, 1)[0];
        picked.push(s);
        acc += useLen(s);
      }
      pool = picked.sort((a, b) => a.rank - b.rank);
    }
    // 2) 束搜索排序
    const groups = {};
    pool.forEach((s, i) => { s._i = i; (groups[s.group] = groups[s.group] || []).push(i); });
    const gkeys = Object.keys(groups);
    const N = pool.length;
    const totalEst = P.target > 0 ? Math.min(P.target, SC.sum(pool.map(useLen))) : SC.sum(pool.map(useLen));
    const R = 1 + (1 - P.crossCut) * 6;
    const lenAt = (s, pos) => SC.clamp(asl * (1 + P.pacing * (0.5 - SC.curveAt(P, pos)) * 1.6), P.minShot, s.dur);
    let beam = [{ seq: [], used: new Uint8Array(N), t: 0, cost: 0, lastG: null, run: 0 }];
    for (let step = 0; step < N; step++) {
      const next = [];
      for (const st of beam) {
        const prev = st.seq.length ? pool[st.seq[st.seq.length - 1]] : null;
        for (const gk of gkeys) {
          let skipped = 0;
          for (const i of groups[gk]) {
            if (st.used[i]) continue;
            if (skipped > 2) break;
            const s = pool[i];
            const pos = SC.clamp(st.t / (totalEst || 1), 0, 1);
            let c = 1.5 * Math.abs(s.energy - SC.curveAt(P, pos));
            if (prev && prev.vis && s.vis) {
              const d = Math.min(1, SC.dist(prev.vis, s.vis) / 1.2);
              c += P.continuity >= 0 ? P.continuity * d : -P.continuity * (1 - d);
            }
            c += P.orderKeep * skipped * 0.8;
            if (prev && s.group === st.lastG) c += st.run + 1 > R ? (st.run + 1 - R) * 0.5 : 0;
            else if (prev) c += st.run < R ? (R - st.run) * 0.12 * P.crossCut : 0;
            next.push({ from: st, i, cost: st.cost + c, len: lenAt(s, pos) });
            skipped++;
          }
        }
      }
      if (!next.length) break;
      next.sort((a, b) => a.cost - b.cost || a.i - b.i);
      const seen = new Set();
      beam = [];
      for (const nx of next) {
        const key = nx.from.seq.concat(nx.i).slice().sort((a, b) => a - b).join(',') + '|' + nx.i;
        if (seen.has(key)) continue;
        seen.add(key);
        const used = nx.from.used.slice();
        used[nx.i] = 1;
        const s = pool[nx.i];
        beam.push({ seq: nx.from.seq.concat(nx.i), used, t: nx.from.t + nx.len, cost: nx.cost, lastG: s.group, run: s.group === nx.from.lastG ? nx.from.run + 1 : 1 });
        if (beam.length >= Math.max(1, P.beam)) break;
      }
    }
    const seq = beam[0].seq.map((i) => pool[i]);
    // 3) 节奏化长度并收敛到目标总长
    const totalDur = seq.length ? SC.sum(seq.map((s) => s.dur)) : 0;
    const T = P.target > 0 ? Math.min(P.target, totalDur) : SC.sum(seq.map((s, k) => lenAt(s, seq.length > 1 ? k / (seq.length - 1) : 0)));
    let scale = 1, lens = [];
    for (let it = 0; it < 8; it++) {
      let t = 0;
      lens = seq.map((s) => {
        const L = SC.clamp(lenAt(s, t / (T || 1)) * scale, Math.min(P.minShot, s.dur), s.dur);
        t += L;
        return L;
      });
      const sum = SC.sum(lens);
      if (!sum || Math.abs(sum - T) < 0.05) break;
      scale *= T / sum;
    }
    let t = 0;
    const items = seq.map((s, k) => {
      const pos = t / (T || 1);
      t += lens[k];
      const [a, b] = SC.bestWindow(s, lens[k], SC.curveAt(P, pos));
      const it = clipItem(s, a, b, null, null);
      it.line = s.group;
      return it;
    });
    return { items, groupMode, unused: shots.filter((s) => !seq.includes(s)).map((s) => s.id) };
  }

  /* ---------------------------------------------------------------- 报告 */

  SC.layout = function (items) {
    let t = 0;
    for (const it of items) {
      it.rec = t;
      it.len = it.type === 'gap' ? it.dur : it.srcOut - it.srcIn;
      t += it.len;
    }
    return t;
  };

  SC.report = function (items, ctx) {
    const { script, P, shotsById } = ctx;
    const total = SC.layout(items);
    const clips = items.filter((i) => i.type === 'clip');
    const gapT = SC.sum(items.filter((i) => i.type === 'gap').map((i) => i.dur));
    const rep = { total, cuts: clips.length, asl: clips.length ? SC.sum(clips.map((c) => c.len)) / clips.length : 0, gapTime: gapT };
    let sw = 0;
    for (let i = 1; i < clips.length; i++) if (clips[i].line !== clips[i - 1].line) sw++;
    rep.switches = sw;
    const share = {};
    clips.forEach((c) => (share[c.line || '?'] = (share[c.line || '?'] || 0) + c.len));
    rep.share = share;
    // 能量贴合：目标强度 vs 实际镜头能量，按时间加权相关
    const tgt = [], act = [];
    for (const c of clips) {
      const target = script && c.seg ? script.segments[script.segIndex.get(c.seg)].estIntensity : SC.curveAt(P, total ? (c.rec + c.len / 2) / total : 0);
      const sh = shotsById.get(c.shotId);
      if (!sh || !sh.feat) continue;
      tgt.push(target); act.push(sh.energy);
    }
    rep.energyFit = corr(tgt, act);
    if (script) {
      const covered = new Map();
      clips.forEach((c) => { if (c.seg) covered.set(c.seg, (covered.get(c.seg) || 0) + c.len); });
      const pieces = SC.flattenScript(script);
      const visT = new Map();
      pieces.forEach((p) => { if (p.seg) visT.set(p.seg, (visT.get(p.seg) || 0) + p.end - p.start); });
      const scriptT = SC.sum(Array.from(visT.values()));
      rep.coverage = scriptT ? SC.sum(Array.from(covered.values())) / scriptT : 0;
      const filled = (id) => (visT.get(id) ? (covered.get(id) || 0) / visT.get(id) : 0);
      const firstRec = new Map();
      clips.forEach((c) => { if (c.seg && !firstRec.has(c.seg)) firstRec.set(c.seg, c.rec); });
      rep.chains = script.chains.map((ch) => {
        const nodes = ch.nodes.map((n) => ({ seg: n.seg, kind: n.kind, fill: filled(n.seg), at: firstRec.has(n.seg) ? firstRec.get(n.seg) : null }));
        const present = nodes.filter((n) => n.at != null);
        let ordered = true;
        for (let i = 1; i < present.length; i++) if (present[i].at < present[i - 1].at - 1e-6 && present[i].kind === 'payoff' && present[i - 1].kind === 'setup') ordered = false;
        const setupOk = nodes.filter((n) => n.kind === 'setup').some((n) => n.fill > 0.5);
        const payoffOk = nodes.filter((n) => n.kind === 'payoff').some((n) => n.fill > 0.5);
        return { name: ch.name, nodes, ordered, status: !setupOk && !payoffOk ? 'empty' : setupOk && payoffOk && ordered ? 'ok' : 'broken' };
      });
      rep.scriptShare = {};
      script.segments.forEach((s) => (rep.scriptShare[s.line] = (rep.scriptShare[s.line] || 0) + (visT.get(s.id) || 0)));
    }
    return rep;
  };

  function corr(a, b) {
    if (a.length < 3) return null;
    const ma = SC.mean(a), mb = SC.mean(b);
    let num = 0, da = 0, db = 0;
    for (let i = 0; i < a.length; i++) { num += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; }
    return da && db ? num / Math.sqrt(da * db) : null;
  }

  /* ---------------------------------------------------------------- 入口 */

  SC.solve = function (opts) {
    const P = Object.assign({}, SC.DEFAULT_PARAMS, opts.params || {});
    const script = opts.script && opts.script.segments.length ? opts.script : null;
    const shots = SC.prepareShots(opts.media || [], script, opts.overrides);
    const mode = P.mode === 'auto' ? (script ? 'linear' : 'nonlinear') : P.mode;
    const shotsById = new Map(shots.map((s) => [s.id, s]));
    let res;
    if (mode === 'linear' && script) res = linearSolve(script, shots, P);
    else res = nonlinearSolve(shots, P, script ? script.lines.map((l) => l.id) : []);
    res.mode = mode === 'linear' && script ? 'linear' : 'nonlinear';
    res.shots = shots;
    res.report = SC.report(res.items, { script: res.mode === 'linear' ? script : null, P, shotsById });
    return res;
  };
})(typeof window !== 'undefined' ? window : globalThis);
