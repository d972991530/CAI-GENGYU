/* 镜头语言层：景别 / 角度 / 运动 / 画面方向的词汇表、自动判别、文字标签解析、剪辑语法评分。
 * 导演工作台（剪辑求解与诊断）与换角预览台（自动标注、分镜板）共用。全部是确定性规则，不用模型。 */
(function (g) {
  'use strict';
  const SC = (g.SC = g.SC || {});
  const G = (SC.grammar = {});

  /** 景别：rank 越大越近 */
  G.SIZES = [
    { id: 'EWS', zh: '建立镜头', en: 'ESTABLISHING', short: '建立', desc: '展示场所、状况的远景，引入场景' },
    { id: 'LS', zh: '远景', en: 'WIDE', short: '远', desc: '全身 + 背景，空间掌握、孤独感' },
    { id: 'FS', zh: '全景', en: 'FULL', short: '全', desc: '全身收入画面，动作与关系性' },
    { id: 'MS', zh: '中景', en: 'MEDIUM', short: '中', desc: '胸部以上，对话、自然的距离感' },
    { id: 'CU', zh: '特写', en: 'CLOSE-UP', short: '特', desc: '放大脸或手，强调情感' },
    { id: 'ECU', zh: '极特写', en: 'EXTREME CLOSE-UP', short: '极特', desc: '眼睛或嘴巴，强烈印象、心理描写' },
  ];
  G.ANGLES = [
    { id: 'eye', zh: '平视', en: 'EYE LEVEL', desc: '稳定、自然、共鸣' },
    { id: 'high', zh: '高角度', en: 'HIGH ANGLE', desc: '弱小、被支配的印象' },
    { id: 'overhead', zh: '俯拍', en: 'OVERHEAD', desc: '俯瞰的、命运的视角' },
    { id: 'bird', zh: '鸟瞰', en: "BIRD'S EYE", desc: '掌握整体、孤独感' },
    { id: 'low', zh: '低角度', en: 'LOW ANGLE', desc: '威压感、英雄的' },
    { id: 'worm', zh: '虫视角', en: "WORM'S EYE", desc: '压倒性的规模、幽默' },
    { id: 'dutch', zh: '倾斜', en: 'DUTCH', desc: '不安、紧张、混乱' },
    { id: 'ots', zh: '过肩', en: 'OVER THE SHOULDER', desc: '对话的自然视角' },
    { id: 'pov', zh: '主观', en: 'POV', desc: '共享人物的视角' },
  ];
  G.MOVES = [
    { id: 'static', zh: '固定', en: 'STATIC', desc: '稳定、观察' },
    { id: 'pan', zh: '摇', en: 'PAN', desc: '左右摇动，展示周围、引导视线' },
    { id: 'tilt', zh: '俯仰', en: 'TILT', desc: '上下摇动，表现高度、规模' },
    { id: 'push', zh: '推', en: 'PUSH IN', desc: '前进靠近，聚焦情绪' },
    { id: 'pull', zh: '拉', en: 'PULL BACK', desc: '后退远离，释放、揭示' },
    { id: 'track', zh: '跟拍', en: 'TRACK', desc: '与被摄体平行移动，动态感' },
    { id: 'zoom', zh: '变焦', en: 'ZOOM', desc: '机械的视线集中/释放' },
    { id: 'crash', zh: '急速变焦', en: 'CRASH ZOOM', desc: '喜剧、冲击' },
    { id: 'dollyzoom', zh: '变焦滑轨', en: 'DOLLY ZOOM', desc: '背景扭曲的眩晕感' },
    { id: 'crane', zh: '升降', en: 'CRANE', desc: '规模感、漂浮感' },
    { id: 'drone', zh: '航拍', en: 'DRONE', desc: '广阔、自由的视角' },
    { id: 'steadicam', zh: '稳定器', en: 'STEADICAM', desc: '平滑、临场感' },
    { id: 'handheld', zh: '手持', en: 'HANDHELD', desc: '晃动带来紧迫感、真实感' },
  ];
  // IN / OUT：主体朝镜头逼近 / 远离（画面中变大 / 变小而背景不缩放）
  G.DIRS = { R: '→', L: '←', U: '↑', D: '↓', UR: '↗', UL: '↖', DR: '↘', DL: '↙', IN: '⊙', OUT: '⊗', N: '' };
  G.DIR_EN = { R: 'RIGHT', L: 'LEFT', U: 'UP', D: 'DOWN', UR: 'RIGHT', UL: 'LEFT', DR: 'RIGHT', DL: 'LEFT', IN: 'TOWARD CAMERA', OUT: 'AWAY', N: '' };
  const by = (list, id) => list.find((x) => x.id === id) || null;
  G.size = (id) => by(G.SIZES, id);
  G.angle = (id) => by(G.ANGLES, id);
  G.move = (id) => by(G.MOVES, id);
  G.sizeRank = (id) => G.SIZES.findIndex((s) => s.id === id);

  /** 向量 → 八方向（y 向下为正）；幅度不足返回 N */
  G.dirOf = function (dx, dy, minMag) {
    if (Math.hypot(dx, dy) < (minMag == null ? 0.04 : minMag)) return 'N';
    const a = (Math.atan2(-dy, dx) * 180) / Math.PI; // 数学角，上为正
    const k = Math.round(((a + 360) % 360) / 45) % 8;
    return ['R', 'UR', 'U', 'UL', 'L', 'DL', 'D', 'DR'][k];
  };

  /** 景别判别：主体框高度占画面比例（被画框裁切则视为更近）。无主体 → 建立镜头 */
  G.sizeFromHeight = function (hRel, cropped) {
    if (hRel == null) return 'EWS';
    if (cropped && hRel > 0.9) return hRel > 1.5 ? 'ECU' : 'CU';
    if (hRel < 0.18) return 'EWS';
    if (hRel < 0.42) return 'LS';
    if (hRel < 0.72) return 'FS';
    if (hRel < 0.95) return 'MS';
    return hRel > 1.5 ? 'ECU' : 'CU';
  };

  /** 景别判别（优先）：主体遮罩占画面面积比例。比框高更可靠——区分得了“腰部被裁的中景”和“脸占满的特写” */
  G.sizeFromArea = function (aRel) {
    if (aRel == null || aRel < 0.012) return 'EWS';
    if (aRel < 0.05) return 'LS';
    if (aRel < 0.14) return 'FS';
    if (aRel < 0.32) return 'MS';
    if (aRel < 0.6) return 'CU';
    return 'ECU';
  };

  /**
   * 由追踪结果自动标注一个镜头。
   * a = { dur, W, H, gm:[{dx,dy}] (工作分辨率像素/采样), subjects:[{ boxes:[{x,y,w,h}|null] }] }
   * 返回 { size, move, camDir, subjDir, handheld, motion:{pan,tilt,scale,jitter} }
   */
  G.analyze = function (a) {
    const n = a.gm.length, dur = Math.max(0.05, a.dur), rate = (n - 1) / dur;
    let sx = 0, sy = 0;
    const steps = [], dxs = [], dys = [];
    for (let i = 1; i < n; i++) {
      sx += a.gm[i].dx; sy += a.gm[i].dy;
      if (a.gm[i].unknown) continue;
      steps.push(a.gm[i].dx / a.W); dxs.push(a.gm[i].dx); dys.push(a.gm[i].dy);
    }
    // 内容位移的反方向即镜头运动方向；用逐帧中值（抗人物出框造成的偶发误判），按“每秒画宽比例”计
    const tmean = (v) => { const b = v.slice().sort((x, y) => x - y), k = Math.floor(b.length * 0.2); const c = b.slice(k, b.length - k); return c.length ? SC.mean(c) : SC.mean(b); };
    const pan = dxs.length ? (-tmean(dxs) * rate) / a.W : 0, tilt = dys.length ? (-tmean(dys) * rate) / a.H : 0;
    // 晃动：相邻帧运动差的截尾均值（去掉最大的 20%，偶发误判帧不算手持）
    const dd = [];
    for (let i = 1; i < dxs.length; i++) dd.push(Math.abs(dxs[i] - dxs[i - 1]) / a.W + Math.abs(dys[i] - dys[i - 1]) / a.H);
    dd.sort((x, y) => x - y);
    const keep = dd.slice(0, Math.max(1, Math.ceil(dd.length * 0.8)));
    const jitter = dd.length ? SC.mean(keep) : 0;
    // 主体：取平均框最高的那个
    let main = null, mainH = -1, mainArea = null;
    for (const s of a.subjects || []) {
      const bs = s.boxes.filter(Boolean);
      if (!bs.length) continue;
      const h = SC.mean(bs.map((b) => b.h));
      if (h > mainH) { mainH = h; main = bs; }
      const ar = (s.areas || []).filter((x) => x != null);
      if (ar.length) mainArea = Math.max(mainArea || 0, SC.median(ar));
    }
    let size = 'EWS', scale = 0, subjDir = 'N';
    if (main) {
      const mid = main[Math.floor(main.length / 2)];
      const cropped = mid.y < -0.02 * a.H || mid.y + mid.h > 1.02 * a.H;
      size = mainArea != null ? G.sizeFromArea(mainArea) : G.sizeFromHeight(mid.h / a.H, cropped);
      const k = Math.max(1, Math.floor(main.length / 4));
      const h0 = SC.mean(main.slice(0, k).map((b) => b.h)), h1 = SC.mean(main.slice(-k).map((b) => b.h));
      scale = Math.log(h1 / h0) / dur;
      const c0 = main[0], c1 = main[main.length - 1];
      // 主体在“世界”中的方向 = 画面内位移 + 镜头带走的位移
      const wdx = (c1.x + c1.w / 2 - c0.x - c0.w / 2) / a.W - sx / a.W;
      const wdy = (c1.y + c1.h / 2 - c0.y - c0.h / 2) / a.H - sy / a.H;
      subjDir = G.dirOf(wdx, wdy, 0.08);
    }
    let move = 'static', camDir = 'N';
    const camSpeed = Math.hypot(pan, tilt);
    const handheld = jitter > 0.001;
    const shakeDominates = handheld && camSpeed < jitter * 3; // 晃动幅度远大于净漂移：是手持，不是摇镜
    if (camSpeed > 0.06 && !shakeDominates) {
      camDir = G.dirOf(pan, tilt, 0);
      const subjectFollowed = main && Math.abs(scale) < 0.25 && subjDir !== 'N' && G.DIR_EN[subjDir] === G.DIR_EN[camDir];
      if (subjectFollowed) move = 'track';
      else move = Math.abs(tilt) > Math.abs(pan) * 1.3 ? 'tilt' : 'pan';
    } else if (Math.abs(scale) > 0.12 && a.bgScale != null && Math.abs(a.bgScale) > 0.05) {
      // 背景也在缩放才是推拉镜头
      move = a.bgScale > 0 ? 'push' : 'pull';
    } else if (scale > 0.12) subjDir = 'IN';
    else if (scale < -0.12) subjDir = 'OUT';
    if (move === 'static' && handheld) move = 'handheld';
    return { size, move, camDir, subjDir, handheld, motion: { pan: +pan.toFixed(3), tilt: +tilt.toFixed(3), scale: +scale.toFixed(3), jitter: +jitter.toFixed(4) } };
  };

  /** 文字标签解析：文件名、提示词、分镜描述里的中英文镜头术语 → 局部标注 */
  const SIZE_KW = [['ECU', /极特写|大特写|extreme close|\becu\b/i], ['CU', /特写|close[- ]?up|\bcu\b/i], ['MS', /中景|中近景|近景|medium|\bms\b|\bmcu\b/i],
    ['FS', /全景|full shot|\bfs\b/i], ['LS', /远景|long shot|wide|\bls\b|\bws\b/i], ['EWS', /大远景|建立镜头|establishing|\bews\b/i]];
  const ANGLE_KW = [['bird', /鸟瞰|bird/i], ['overhead', /俯拍|俯视|overhead|top[- ]?down/i], ['high', /高角度|high angle/i], ['worm', /虫视|worm/i],
    ['low', /低角度|仰拍|低机位|low angle/i], ['dutch', /倾斜|斜角|dutch/i], ['ots', /过肩|over[- ]the[- ]shoulder|\bots\b/i], ['pov', /主观|pov/i], ['eye', /平视|eye level/i]];
  const MOVE_KW = [['dollyzoom', /变焦滑轨|dolly zoom|眩晕/i], ['crash', /急速变焦|crash zoom/i], ['zoom', /变焦|zoom/i], ['push', /推近|推镜|推轨|缓推|push in|dolly in/i],
    ['pull', /拉远|拉镜|拉轨|后拉|pull back|dolly out|pull out/i], ['track', /跟拍|跟随|横移|track/i], ['pan', /摇镜|横摇|左摇|右摇|快速摇|\bpan\b/i], ['tilt', /俯仰|上摇|下摇|tilt/i],
    ['crane', /升降|摇臂|crane|jib/i], ['drone', /航拍|无人机|drone/i], ['steadicam', /稳定器|steadicam|gimbal/i], ['handheld', /手持|handheld/i], ['static', /固定|static|locked/i]];
  G.parseTags = function (text) {
    const s = String(text || '');
    const pick = (list) => { for (const [id, re] of list) if (re.test(s)) return id; return null; };
    const out = {};
    // 先判“极特写/大远景”这类更具体的
    if (/极特写|大特写|extreme close|\becu\b/i.test(s)) out.size = 'ECU';
    else if (/大远景|建立镜头|establishing|\bews\b/i.test(s)) out.size = 'EWS';
    else { const z = pick(SIZE_KW); if (z) out.size = z; }
    const a = pick(ANGLE_KW); if (a) out.angle = a;
    const m = pick(MOVE_KW); if (m) out.move = m;
    const d = s.match(/(向|往)?(左|右|上|下)(?=移|摇|跑|冲|跟|推)|\b(left|right)\b/i);
    if (d) out.dir = /左|left/i.test(d[0]) ? 'L' : /右|right/i.test(d[0]) ? 'R' : /上/.test(d[0]) ? 'U' : 'D';
    return out;
  };

  /** 分镜板标题行，例："WIDE – TRACK RIGHT →" / "远景 · 跟拍 →" */
  G.caption = function (lang, zh) {
    if (!lang) return '';
    const sz = G.size(lang.size), mv = G.move(lang.move), dir = lang.camDir && lang.camDir !== 'N' ? lang.camDir : lang.subjDir || 'N';
    const arrow = G.DIRS[dir] || '';
    if (zh) return [sz && sz.zh, mv && mv.id !== 'static' ? (lang.handheld && mv.id !== 'handheld' ? '手持' : '') + mv.zh : null].filter(Boolean).join(' · ') + (arrow ? ' ' + arrow : '');
    const hh = lang.handheld && mv && mv.id !== 'handheld' ? 'HANDHELD ' : '';
    const mvTxt = mv && mv.id !== 'static' ? hh + mv.en + (lang.camDir && lang.camDir !== 'N' && /PAN|TRACK|TILT/.test(mv.en) ? ' ' + G.DIR_EN[lang.camDir] : '') : null;
    return [sz && sz.en, mvTxt].filter(Boolean).join(' – ') + (arrow ? ' ' + arrow : '');
  };

  /** 目标景别：情绪强度越高越近（打戏：远景建立 → 推近冲击） */
  G.idealSizeRank = (intensity) => 1 + intensity * 3.2; // 0 → 远景, 1 → 特写附近

  /**
   * 相邻两镜的剪辑语法代价（越小越顺）。a/b = { size, angle, move, dir(主体画面方向), group(同一主体/线索) }
   * 规则：同景别同角度同主体 → 跳切；景别跨度 ≥3 级 → 生硬；同一主体左右方向反转 → 越轴；方向一致 → 动作连贯奖励。
   */
  G.transition = function (a, b) {
    const notes = [];
    let cost = 0;
    if (!a || !b) return { cost, notes };
    const ra = G.sizeRank(a.size), rb = G.sizeRank(b.size);
    if (a.size && b.size && a.size === b.size && (a.angle || 'eye') === (b.angle || 'eye') && a.group && a.group === b.group) {
      cost += 1; notes.push({ kind: 'jump', text: '跳切风险：同一主体、景别与角度都没变' });
    }
    if (ra >= 0 && rb >= 0 && Math.abs(ra - rb) >= 3) { cost += 0.5; notes.push({ kind: 'leap', text: '景别跨度过大：' + G.size(a.size).zh + ' → ' + G.size(b.size).zh }); }
    const h = (d) => (d === 'R' || d === 'UR' || d === 'DR' ? 1 : d === 'L' || d === 'UL' || d === 'DL' ? -1 : 0);
    if (a.group && a.group === b.group && h(a.dir) && h(b.dir)) {
      if (h(a.dir) !== h(b.dir)) { cost += 0.8; notes.push({ kind: 'axis', text: '画面方向反转（同一人物' + G.DIRS[a.dir] + ' 接 ' + G.DIRS[b.dir] + '），可能越轴' }); }
      else { cost -= 0.3; notes.push({ kind: 'flow', text: '动作方向连贯 ' + G.DIRS[a.dir] }); }
    }
    return { cost, notes };
  };

  /** 对整条序列做语法检查，返回问题列表 [{i, kind, text}]（i 为后一镜序号） */
  G.check = function (seq) {
    const out = [];
    for (let i = 1; i < seq.length; i++) {
      for (const n of G.transition(seq[i - 1], seq[i]).notes) if (n.kind !== 'flow') out.push(Object.assign({ i }, n));
    }
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
