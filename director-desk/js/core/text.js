/* 中文文本匹配：字 + 二元组的 TF-IDF 余弦相似度；剧情强度 / 对白关键词估计。
   不依赖任何语言模型，只做确定性的字符统计。 */
(function (g) {
  'use strict';
  const SC = (g.SC = g.SC || {});

  // 高频虚字，不参与匹配
  const STOP = new Set('的了在是她他它们这那一个有和与及也就都而又被把着过吗呢吧啊之其中上下来去为对从到以于'.split(''));
  const CJK = /[㐀-鿿]/;

  /** 文本 → token 词袋（Map token→count） */
  SC.tokenize = function (text) {
    const bag = new Map();
    const add = (t, w) => bag.set(t, (bag.get(t) || 0) + (w || 1));
    const s = String(text || '').toLowerCase();
    // 英文 / 数字词
    for (const m of s.matchAll(/[a-z][a-z0-9]+/g)) add(m[0]);
    // 中文：按连续汉字串切分，单字 + 二元组
    for (const m of s.matchAll(/[㐀-鿿]+/g)) {
      const run = m[0];
      for (let i = 0; i < run.length; i++) {
        const c = run[i];
        if (!STOP.has(c)) add(c, 0.5);
        if (i + 1 < run.length) {
          const bi = run.substr(i, 2);
          if (!(STOP.has(bi[0]) && STOP.has(bi[1]))) add(bi, 1);
        }
      }
    }
    return bag;
  };

  /** 以一组文档建立 IDF，提供向量化与余弦相似度 */
  SC.TextIndex = function (docs) {
    const df = new Map();
    const N = Math.max(1, docs.length);
    for (const d of docs) for (const t of SC.tokenize(d).keys()) df.set(t, (df.get(t) || 0) + 1);
    this.idf = (t) => Math.log(1 + N / (1 + (df.get(t) || 0)));
    this.vec = (text) => {
      const bag = SC.tokenize(text);
      const v = new Map();
      let norm = 0;
      for (const [t, c] of bag) { const w = c * this.idf(t); v.set(t, w); norm += w * w; }
      v.norm = Math.sqrt(norm) || 1;
      return v;
    };
  };
  SC.cosine = function (a, b) {
    if (a.size > b.size) { const t = a; a = b; b = t; }
    let dot = 0;
    for (const [t, w] of a) { const x = b.get(t); if (x) dot += w * x; }
    return dot / (a.norm * b.norm);
  };

  const HIGH = ['杀', '斩', '砍', '刺', '劈', '打', '斗', '战', '怒', '吼', '冲', '追', '逃', '摔', '扑', '踢', '掐', '压制', '反击', '格挡', '拔剑', '屠', '血', '闪切', '爆', '撞', '飞出', '厮', '搏', '挣', '惊', '喊', '刀', '剑法', '高潮', '决战', '求饶'];
  const LOW = ['睁眼', '吃饭', '埋头', '睡', '静', '乞讨', '倒在', '望', '坐', '跪', '誓', '回忆', '沉默', '独自', '慢', '夜色', '月', '安静', '呼吸', '凝视', '低头', '收剑'];

  /** 从文字估计剧情强度 0..1；无关键词返回 null */
  SC.textIntensity = function (text) {
    const s = String(text || '');
    let hi = 0, lo = 0;
    for (const k of HIGH) if (s.includes(k)) hi++;
    for (const k of LOW) if (s.includes(k)) lo++;
    if (!hi && !lo) return null;
    return SC.clamp(0.5 + 0.18 * hi - 0.15 * lo, 0.05, 1);
  };

  /** 是否预期有对白：引号、问号、说/问/喊等 */
  SC.textDialogue = function (text) {
    const s = String(text || '');
    let score = 0;
    if (/[“”"「」『』]/.test(s)) score += 0.6;
    if (/[说问喊叫答道念唱骂][:：，,“"]?/.test(s)) score += 0.3;
    if (/[？?！!]/.test(s)) score += 0.2;
    return SC.clamp(score, 0, 1);
  };

  /** 从文件名里读出剧本段落编号，如 "A3_流落街头" "B-12" "c17" → "A3" / "B12" / "C17" */
  SC.idFromName = function (name, validIds) {
    const base = SC.baseName(name);
    const re = /(?:^|[^A-Za-z])([A-Za-z])\s*[-_ ]?\s*(\d{1,3})(?!\d)/g;
    let m;
    while ((m = re.exec(base))) {
      const id = m[1].toUpperCase() + Number(m[2]);
      if (!validIds || validIds.has(id)) return id;
    }
    return null;
  };

  SC.isCJK = (c) => CJK.test(c);
})(typeof window !== 'undefined' ? window : globalThis);
