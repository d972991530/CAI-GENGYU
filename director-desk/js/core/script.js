/* 剧本结构时间线：解析、序列化、可见区间展平、段落强度/对白估计。
 *
 * 文本格式（每行一条，# 开头为指令，其余为段落）：
 *   # 片名: 谢小娥 精编版
 *   # 线: A | 影戏线 | #e0622b
 *   # 幕: 建置 | 00:00-03:05
 *   A1 | 妖猴屠船 | 00:00-00:41 | 描述文字 @0.8      ← @数值 为可选强度
 *   # 伏笔: 那把剑 | ○C9 ●B9 ○C10 ●C15             ← ○埋 ●收
 * 竖线可换成空格；时间支持 mm:ss、hh:mm:ss、带小数秒。也接受 JSON（序列化结果）。
 */
(function (g) {
  'use strict';
  const SC = (g.SC = g.SC || {});

  const PALETTE = ['#e0622b', '#3a6fd8', '#1e8c5a', '#b04fc9', '#c9a227', '#2aa3b8', '#d0436c'];
  const T = '(\\d{1,2}:\\d{2}(?::\\d{2})?(?:\\.\\d+)?)';
  const SEG_RE = new RegExp('^[\\s(（\\[【]*([A-Za-z])\\s*(\\d{1,3})[)）\\]】]?\\s*[|｜\\s]\\s*(.+?)\\s*[|｜\\s]\\s*' + T + '\\s*[-–—~至到]\\s*' + T + '\\s*(?:[|｜\\s]\\s*(.*))?$');
  const SEG_RE_TIME_FIRST = new RegExp('^[\\s(（\\[【]*([A-Za-z])\\s*(\\d{1,3})[)）\\]】]?\\s*[|｜\\s]\\s*' + T + '\\s*[-–—~至到]\\s*' + T + '\\s*[|｜\\s]\\s*(.+?)\\s*(?:[|｜]\\s*(.*))?$');

  function emptyScript() {
    return { title: '未命名剧本', duration: 0, lines: [], acts: [], segments: [], chains: [] };
  }

  function ensureLine(script, id) {
    let l = script.lines.find((x) => x.id === id);
    if (!l) {
      l = { id, name: id + ' 线', color: PALETTE[script.lines.length % PALETTE.length] };
      script.lines.push(l);
    }
    return l;
  }

  SC.parseScript = function (text) {
    text = String(text || '').trim();
    if (text.startsWith('{')) return SC.normalizeScript(JSON.parse(text));
    const sc = emptyScript();
    const warnings = [];
    let declaredDur = 0;
    text.split(/\r?\n/).forEach((raw, ln) => {
      const line = raw.trim();
      if (!line) return;
      if (line.startsWith('#')) {
        const m = line.replace(/^#+\s*/, '').match(/^([^:：]+)[:：]\s*(.*)$/);
        if (!m) return;
        const key = m[1].trim();
        const parts = m[2].split(/[|｜]/).map((s) => s.trim());
        if (/片名|标题|title/i.test(key)) sc.title = parts.join(' ');
        else if (/总长|时长|duration/i.test(key)) declaredDur = SC.parseTime(parts[0]);
        else if (/^线|line/i.test(key)) {
          const l = ensureLine(sc, parts[0].toUpperCase());
          if (parts[1]) l.name = parts[1];
          if (parts[2]) l.color = parts[2];
        } else if (/幕|段|act/i.test(key)) {
          const tm = (parts[1] || '').match(new RegExp(T + '\\s*[-–—~至到]\\s*' + T));
          if (tm) sc.acts.push({ name: parts[0], start: SC.parseTime(tm[1]), end: SC.parseTime(tm[2]) });
          else warnings.push('第 ' + (ln + 1) + ' 行：幕缺少时间范围');
        } else if (/伏笔|chain/i.test(key)) {
          const name = parts.length > 1 ? parts[0] : '伏笔' + (sc.chains.length + 1);
          const body = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
          const nodes = [];
          for (const t of body.matchAll(/([○◯oO●*•])?\s*([A-Za-z]\d{1,3})/g)) {
            const mark = t[1];
            const kind = mark ? (/[●*•]/.test(mark) ? 'payoff' : 'setup') : nodes.length ? 'payoff' : 'setup';
            nodes.push({ seg: t[2].toUpperCase(), kind });
          }
          if (nodes.length) sc.chains.push({ name, nodes });
        }
        return;
      }
      let m = line.match(SEG_RE);
      let id, title, a, b, desc;
      if (m) { id = m[1].toUpperCase() + Number(m[2]); title = m[3]; a = m[4]; b = m[5]; desc = m[6] || ''; }
      else if ((m = line.match(SEG_RE_TIME_FIRST))) { id = m[1].toUpperCase() + Number(m[2]); a = m[3]; b = m[4]; title = m[5]; desc = m[6] || ''; }
      else { warnings.push('第 ' + (ln + 1) + ' 行无法识别：' + line.slice(0, 30)); return; }
      let intensity = null;
      const im = desc.match(/@\s*(0?\.\d+|1(?:\.0+)?)\s*$/);
      if (im) { intensity = parseFloat(im[1]); desc = desc.slice(0, im.index).trim(); }
      const lineId = id[0];
      ensureLine(sc, lineId);
      sc.segments.push({ id, line: lineId, title: title.replace(/[|｜]+$/, '').trim(), start: SC.parseTime(a), end: SC.parseTime(b), desc, intensity });
    });
    sc.duration = declaredDur;
    const out = SC.normalizeScript(sc);
    out.warnings = warnings;
    return out;
  };

  /** 补全派生字段：排序、总长、所属幕、强度、对白期望 */
  SC.normalizeScript = function (sc) {
    sc = Object.assign(emptyScript(), sc);
    sc.lines.forEach((l, i) => { if (!l.color) l.color = PALETTE[i % PALETTE.length]; });
    sc.segments = sc.segments.filter((s) => isFinite(s.start) && isFinite(s.end) && s.end > s.start);
    sc.segments.sort((x, y) => x.start - y.start || x.end - y.end);
    for (const s of sc.segments) ensureLine(sc, s.line);
    const maxEnd = Math.max(0, ...sc.segments.map((s) => s.end), ...sc.acts.map((a) => a.end));
    sc.duration = Math.max(sc.duration || 0, maxEnd);
    sc.acts.sort((a, b) => a.start - b.start);
    const actBase = [0.3, 0.5, 0.72, 0.92];
    for (const s of sc.segments) {
      const mid = (s.start + s.end) / 2;
      const ai = sc.acts.findIndex((a) => mid >= a.start && mid < a.end);
      s.act = ai;
      const base = ai >= 0 ? actBase[Math.min(ai, 3)] : 0.3 + 0.6 * (mid / (sc.duration || 1));
      const kw = SC.textIntensity(s.title + ' ' + s.desc);
      s.estIntensity = s.intensity != null ? s.intensity : kw == null ? base : 0.5 * base + 0.5 * kw;
      s.estDialogue = SC.textDialogue(s.desc);
    }
    sc.segIndex = new Map(sc.segments.map((s, i) => [s.id, i]));
    for (const c of sc.chains) c.nodes = c.nodes.filter((n) => sc.segIndex.has(n.seg));
    sc.chains = sc.chains.filter((c) => c.nodes.length);
    return sc;
  };

  SC.serializeScript = function (sc) {
    const L = [];
    L.push('# 片名: ' + sc.title);
    L.push('# 总长: ' + SC.fmtTime(sc.duration));
    for (const l of sc.lines) L.push('# 线: ' + l.id + ' | ' + l.name + ' | ' + l.color);
    for (const a of sc.acts) L.push('# 幕: ' + a.name + ' | ' + SC.fmtTime(a.start) + '-' + SC.fmtTime(a.end));
    for (const s of sc.segments) {
      const t = (x) => (Math.abs(x - Math.round(x)) > 1e-6 ? SC.fmtTime(x, true) : SC.fmtTime(x));
      L.push(s.id + ' | ' + s.title + ' | ' + t(s.start) + '-' + t(s.end) + ' | ' + (s.desc || '') + (s.intensity != null ? ' @' + s.intensity : ''));
    }
    for (const c of sc.chains) L.push('# 伏笔: ' + c.name + ' | ' + c.nodes.map((n) => (n.kind === 'setup' ? '○' : '●') + n.seg).join(' '));
    return L.join('\n');
  };

  /** 展平：同一时刻只能看到一个段落。规则——覆盖该时刻的段落中，开始最晚者可见（插入镜头打断外层段落）。
   *  返回 pieces [{seg, start, end}]，同一段落可能被切成多块（交叉剪辑）。 */
  SC.flattenScript = function (sc) {
    const segs = sc.segments;
    const pts = new Set([0, sc.duration]);
    for (const s of segs) { pts.add(s.start); pts.add(s.end); }
    const ts = Array.from(pts).sort((a, b) => a - b);
    const pieces = [];
    for (let k = 0; k + 1 < ts.length; k++) {
      const a = ts[k], b = ts[k + 1];
      if (b - a < 1e-6) continue;
      const mid = (a + b) / 2;
      let best = null;
      for (const s of segs) {
        if (s.start <= mid && s.end > mid) {
          if (!best || s.start > best.start || (s.start === best.start && s.end - s.start < best.end - best.start)) best = s;
        }
      }
      const id = best ? best.id : null;
      const last = pieces[pieces.length - 1];
      if (last && last.seg === id && Math.abs(last.end - a) < 1e-6) last.end = b;
      else pieces.push({ seg: id, start: a, end: b });
    }
    return pieces;
  };

  SC.SAMPLE_SCRIPT = [
    '# 片名: 谢小娥 精编版',
    '# 总长: 14:48',
    '# 线: A | 影戏线（皮影：妖猴与女娃） | #e0622b',
    '# 线: B | 现实线（申府一夜·单挑申春） | #3a6fd8',
    '# 线: C | 回忆线（流落·入府·练剑） | #1e8c5a',
    '# 幕: 建置 | 00:00-03:05',
    '# 幕: 发展 | 03:05-08:29',
    '# 幕: 转折 | 08:29-12:17',
    '# 幕: 高潮 | 12:17-14:48',
    'A1 | 妖猴屠船 | 00:00-00:41 | 黑暗中锣响，白影黄猴登场，妖猴屠船，女娃坠水。师傅设问：“一个女娃，要怎样才能变成侠客？”',
    'B1 | 从天而降 | 00:33-00:59 | 深夜，申府。一个黑影从申兰卧房的房梁上落下，一刀扎在申兰床前',
    'C1 | 江边闪帧 | 00:38-00:39 | 一身半裹、浑身是泥的少女躺在江边，睁开眼',
    'A2 | 女娃斩小猴 | 00:59-01:04 | 闪前：女娃举刀，小妖猴倒下',
    'B2 | 申春惊起 | 01:04-01:14 | 申春赤手推门，看见床上的哥哥和站在床边的人：“哑子？！” 一脚踢飞她的短刀',
    'A3 | 流落街头 | 01:14-01:19 | 女娃的影子摇摇晃晃，被一只手推到大街上',
    'B3 | 被推开 | 01:19-01:23 | 申春一把将她推开，她跌跌撞撞撞上墙',
    'C2 | 无人相助 | 01:23-02:04 | 她一个人走在街上，挨家挨户求救，路过的人看她一眼就摇头，有人别过脸',
    'B4 | 室内压制 | 02:04-02:24 | 屋里狭窄，桌椅翻倒，申春一脚踩住她的衣领：“你个哑巴，原来是来要命的。”',
    'C3 | 乞讨受辱 | 02:24-02:47 | 她第一次伸手讨饭，店家拿着她的衣领把她扔到街上，围观的人笑：“千金小姐也来讨饭。”',
    'B5 | 爬 | 02:47-02:54 | 她被踹到地上往外爬，申春不急着追，绕着她慢慢走：“爬啊。”',
    'C4 | 倒在路边 | 02:54-03:10 | 雨里，她倒在路边，来往的脚一双双从她身边绕过去，没人停下',
    'A4 | 妖猴近身 | 03:10-03:16 | 女娃躺在地上，一只大妖猴跳到她身边',
    'C5 | 认仇 | 03:16-03:54 | 她在码头扛货，一条船靠岸，船上有人放声大笑——那天夜里江上就是这个笑声。有人喊他“申春”',
    'B6 | 躲进暗处 | 03:54-04:01 | 她挣扎着冲进外面的里面，贴墙屏住呼吸；申春在门外：“出来。”',
    'A5 | 摇嘴随猴 | 04:01-04:31 | 女娃捂住自己的嘴，远远跟在妖猴身后，翻过山，走进猴洞。说书：“一开口就露了底”',
    'C6 | 应召入府 | 04:31-05:28 | 申府招杂役，她摇了摇嘴，走上前；申春：“哑巴好，嘴严。”真是个哑的？',
    'A6 | 妖猴扔桃 | 05:28-05:36 | 妖猴从高处随手扔下一只啃过的桃，女娃蹲身接住',
    'C7 | 埋头吃饭 | 05:36-05:44 | 柴房角落，她捧着一碗冷饭吃，眼泪一颗颗掉进碗里',
    'B7 | 被掐住脖颈 | 05:44-05:54 | 申春抬脚把她抵在墙上，掐住她的脖子按在墙上，她喘不上气，眼泪顺着脸往下流',
    'C8 | 不弃闲人 | 05:54-06:09 | 申春拿她当出气的人，一脚踢翻她的水桶：“我这儿不养闲人！”她一声不吭，也不求饶',
    'B8 | 打进院子 | 06:09-06:34 | 她挣开，申春一脚把她踢出房门，两人打到院子里（大俯拍），她且战且退，肩头挨了一记重拳',
    'C9 | 仓库里的剑 | 06:34-07:25 | 搬运时，她在杂物堆底下摸到一把蒙尘的剑，双手才抬得起来；她吹去灰，一点一点把剑拔出了鞘',
    'B9 | 拔剑起身 | 07:25-07:37 | 大院里，她被打倒在地，撑着地站起来，反手从背上拔出那把剑',
    'C10 | 苦练练剑 | 07:37-07:53 | 半夜后院，她握着那把剑练，刺、刺、劈；一次又一次摔倒，又爬起来',
    'A7 | 撒猴观斗 | 07:53-07:59 | 女娃一个接一个打倒围上来的人，两只妖猴坐在高处拍手',
    'C11 | 院中比武 | 07:59-08:29 | 申府院子里，申春让家丁比武取乐，赢的有赏；她一个吃力地打倒对手，申春大笑',
    'B10 | 申春之怒 | 08:29-08:59 | 申春盯着她手里的剑，脸色一点点沉下来：满是怒意，冷笑着从兵器架上抄起一把大刀',
    'C12 | 那一票 | 08:59-10:10 | 庆功宴上，申春喝得半醉，拍着桌子讲起当年在江上劫过的那一票：“一船的人，一个都没跑。”',
    'A8 | 蝴蝶飞出 | 10:10-10:31 | 一只蝴蝶从影窗左边飞进画面，越飞越高',
    'C13 | 剑法渐精 | 10:31-10:52 | 后院夜练：同一套剑招，一遍比一遍快、稳、准，剑不再脱手',
    'A9 | 摇身成侠 | 10:52-10:55 | 女娃一转身，影偶换成持剑的大侠客',
    'B11 | 格挡 | 10:55-11:08 | 申春的大刀当头劈下，她横剑架住，刀锋停在她眼前一寸',
    'A10 | 再下山 | 11:08-11:16 | 两只妖猴走在一起扛刀，山下江上又来了一船人家',
    'C14 | 就在今夜 | 11:16-11:50 | 她给兄弟俩倒酒，听他们说：后天江上有条商船，一家老小，顺着逆风好劫。她倒酒的手停了一下',
    'A11 | 高超剑法 | 11:50-12:05 | 侠客独立影窗中央，一套剑法使得如行云流水',
    'C15 | 炉火纯青 | 12:05-12:17 | 月下，她一剑削断飘落的树叶，剑收鞘时，叶子才分成两半落地',
    'A12 | 侠客闪切 | 12:13-12:15 | 侠客影偶的脸与小娥的脸交叉闪切，0.5秒→0.1秒',
    'B12 | 反击 | 12:17-12:46 | 她不再退，一剑快过一剑，把申春从大院逼到房里，挑飞他的大刀；申春跪倒：“饶命……”',
    'A13 | 小猴失刀 | 12:31-12:34 | 小妖猴的刀飞出去，它跪倒在地',
    'C16 | 第一次拔剑 | 12:39-12:42 | 闪回：仓库里，她第一次把那把剑拔出鞘',
    'A14 | 侠客斩猴 | 12:46-12:57 | 侠客站在跪地的小妖猴面前举剑。说书：“小猴问：你是谁？”',
    'B13 | 你是谁 | 12:57-13:19 | 天色发白，她的剑架在申春颈上，申春抬头：“你到底是谁？”她张开嘴——',
    'C17 | 坟前 | 13:19-14:15 | 江边乱坟前，她跪着，一个头一个头地磕下去：“爹，娘，我……一定会报的。”',
    'B14 | 我叫谢小娥 | 14:15-14:40 | 剑落，申春倒下。她收剑起身，背对着申春第一次开口：“我叫谢小娥。”',
    'A15 | 女中豪杰 | 14:40-14:48 | 影戏落幕，镜头从影窗转到台下，老人赞叹“侠客谢小娥当真是女中豪杰”；坐在台下的正是谢小娥',
    '# 伏笔: 开篇设问 | ○A1 ●B14 ●A15',
    '# 伏笔: 装哑→开口 | ○A5 ○C6 ○C8 ●C17 ●B14',
    '# 伏笔: 那把剑 | ○C9 ●B9 ○C10 ○C13 ○C14 ●C15 ●C16 ●B14',
    '# 伏笔: 实力差距 | ○B2 ○B4 ○B7 ●C11 ●B11 ●B12',
    '# 伏笔: 认仇 | ○A4 ●C5 ●C12',
    '# 伏笔: 申春的喜与怒 | ○C11 ●B10',
    '# 伏笔: 眼泪 | ○C7 ●B7',
    '# 伏笔: 为什么是今夜 | ○B1 ○A10 ●C14',
    '# 伏笔: 求饶 | ○C8 ●B12 ●B14',
    '# 伏笔: 你是谁 | ○B2 ○C6 ○A14 ●B13 ●B14',
    '# 伏笔: 坟前誓言 | ○C1 ●C17 ●B14',
    '# 伏笔: 女娃→侠客 | ○A5 ○A8 ●A9 ●A11 ●A15',
  ].join('\n');
})(typeof window !== 'undefined' ? window : globalThis);
