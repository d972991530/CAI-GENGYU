// 剧本文本 → 场次 → 时长估算（纯本地，不依赖 AI）

const TIME_WORDS = "日|夜|晨|清晨|早晨|早上|上午|中午|下午|黄昏|傍晚|夜晚|晚上|深夜|凌晨|白天|日景|夜景|DAY|NIGHT|DAWN|DUSK|MORNING|EVENING|CONTINUOUS";
const NUM = "[0-9０-９一二三四五六七八九十百零〇]+";

const HEADING_PATTERNS = [
  // 1.外景 村口-日 / 外景 海边 日 / 12、内/外景 …
  new RegExp(`^(?:第?\\s*(${NUM})\\s*(?:场)?\\s*[\\.．、:：\\s]*)?\\s*(内\\/外景|外\\/内景|内外景|内景|外景|夜景|日景)[\\s\\.．、:：]*(.*)$`),
  // 第12场 …
  new RegExp(`^第\\s*(${NUM})\\s*场[\\s\\.．、:：]*(.*)$`),
  // 场12 / 场次 12
  new RegExp(`^场次?\\s*(${NUM})[\\s\\.．、:：]*(.*)$`),
  // 12. 村口-日
  new RegExp(`^(${NUM})\\s*[\\.．、]\\s*(\\S.{0,40}[-—–－\\s](?:${TIME_WORDS}))\\s*$`, "i"),
  // 12 INT. HOUSE - DAY / EXT. …
  /^(\d+[A-Z]?)?\s*\.?\s*((?:INT|EXT|INT\.?\/EXT|EXT\.?\/INT|I\/E)\b[\.\s].*)$/i,
];

const SENT_PUNCT = /[。，！？；…,!?;"“”]/;

function cleanLine(l) {
  return l.replace(/ /g, " ").replace(/^[\s\-–—•·*#>]+/, "").replace(/\s+$/, "");
}

export function matchHeading(line) {
  if (!line || line.length > 60) return null;
  for (let i = 0; i < HEADING_PATTERNS.length; i++) {
    const m = line.match(HEADING_PATTERNS[i]);
    if (!m) continue;
    if (i === 0) {
      // 「外景」后面要有地点，或带编号
      if (!m[3] && !m[1]) continue;
      return { num: m[1] || null, heading: line };
    }
    if (i === 4) return { num: m[1] || null, heading: line };
    return { num: m[1], heading: line };
  }
  return null;
}

function parseHeading(h) {
  const t = h.match(new RegExp(`(${TIME_WORDS})\\s*$`, "i"));
  const io = h.match(/(内\/外景|外\/内景|内外景|内景|外景|夜景|日景|INT\.?\/EXT|EXT\.?\/INT|INT|EXT)/i);
  let place = h
    .replace(new RegExp(`^(?:第?\\s*${NUM}\\s*(?:场)?\\s*[\\.．、:：\\s]*)`), "")
    .replace(/(内\/外景|外\/内景|内外景|内景|外景|夜景|日景)/, "")
    .replace(/^(\d+[A-Z]?)?\s*\.?\s*(INT\.?\/EXT|EXT\.?\/INT|INT|EXT|I\/E)\.?/i, "")
    .replace(new RegExp(`[-—–－\\s]*(${TIME_WORDS})\\s*$`, "i"), "")
    .replace(/^[\s\.．、:：\-—–]+|[\s\-—–]+$/g, "");
  return { time: t ? t[1] : "", interior: io ? io[1] : "", place };
}

function isCue(p, next) {
  if (!next) return false;
  if (p.length > 18) return false;
  if (p.startsWith("（") || p.startsWith("(")) return false;
  const core = p.replace(/[（(][^）)]*[）)]/g, "").replace(/\b(o\.?s\.?|v\.?o\.?|O\.?S\.?|V\.?O\.?)\b/g, "").trim();
  if (!core || core.length > 10) return false;
  if (SENT_PUNCT.test(core) || /[：:]/.test(core)) return false;
  if (matchHeading(next)) return false;
  return true;
}

export function cueName(p) {
  return p.replace(/[（(][^）)]*[）)]/g, "").replace(/\s*(o\.?s\.?|v\.?o\.?)\s*$/i, "").trim();
}

// 主入口：纯文本 → 场次数组
export function splitScenes(raw) {
  const paras = raw.replace(/\r/g, "").split(/\n/).map(cleanLine).filter((l) => l.length);
  const scenes = [];
  let cur = null;
  let preamble = [];
  for (const p of paras) {
    const h = matchHeading(p);
    if (h) {
      cur = { heading: p, origNum: h.num, paras: [] };
      scenes.push(cur);
    } else if (cur) {
      if (/^[（(]?\s*(剧终|全剧终|完|END|THE END|FADE OUT)\s*[）)]?\.?$/i.test(p)) { cur = null; continue; }
      cur.paras.push(p);
    } else preamble.push(p);
  }
  return {
    preamble,
    scenes: scenes.map((s, i) => analyseScene(s, i + 1)),
  };
}

function analyseScene(s, id) {
  let actionChars = 0, dialogueChars = 0, dialogueLines = 0;
  const cast = new Map();
  const ps = s.paras;
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i];
    const inline = p.match(/^([^\s：:，。]{1,10})[：:]\s*(.+)$/);
    if (inline) {
      const n = cueName(inline[1]);
      cast.set(n, (cast.get(n) || 0) + 1);
      dialogueChars += countChars(inline[2]); dialogueLines++;
      continue;
    }
    if (isCue(p, ps[i + 1])) {
      const n = cueName(p);
      cast.set(n, (cast.get(n) || 0) + 1);
      dialogueChars += countChars(ps[i + 1]); dialogueLines++;
      i++;
      continue;
    }
    if (/^[（(][^）)]{1,12}[）)]$/.test(p)) continue; // （稍晚）等转场注记
    actionChars += countChars(p);
  }
  const h = parseHeading(s.heading);
  return {
    id, origNum: s.origNum, heading: s.heading, ...h,
    text: ps.join("\n"),
    actionChars, dialogueChars, dialogueLines,
    cast: [...cast.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n),
  };
}

function countChars(s) {
  // 中文按字，英文按词折算（约 1 词 = 1.6 字的时长）
  const cjk = (s.match(/[㐀-鿿]/g) || []).length;
  const words = (s.replace(/[㐀-鿿]/g, " ").match(/[A-Za-z0-9']+/g) || []).length;
  return cjk + Math.round(words * 1.6);
}

// 估算参数（秒）：可在设置中调整
export const DEFAULT_RATES = { base: 8, action: 0.24, dialogue: 0.26, perLine: 1.2 };

export function estimate(scenes, rates = DEFAULT_RATES, targetSeconds = 0) {
  let raw = scenes.map((s) =>
    rates.base + s.actionChars * rates.action + s.dialogueChars * rates.dialogue + s.dialogueLines * rates.perLine
  );
  if (targetSeconds > 0) {
    const sum = raw.reduce((a, b) => a + b, 0);
    raw = raw.map((r) => (r * targetSeconds) / sum);
  }
  return raw.map((r) => Math.max(5, Math.round(r / 5) * 5));
}
