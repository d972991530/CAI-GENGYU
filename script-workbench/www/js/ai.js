// 调用 Claude / GPT / Gemini / DeepSeek 做结构分析和台词写作
import { t, aiLangName } from "./i18n.js";

// 密钥由用户在设置中填写，只保存在本机；在 App 里请求走原生网络层（CapacitorHttp），不受浏览器跨域限制。

export const PROVIDERS = {
  claude: {
    name: "Claude（Anthropic）",
    baseUrl: "https://api.anthropic.com/v1",
    models: ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"],
    keyHint: "在 platform.claude.com 控制台创建 API Key（sk-ant- 开头）。claude.ai 网页会员不含 API 额度，需单独充值。",
    kind: "anthropic",
  },
  openai: {
    name: "GPT（OpenAI）",
    baseUrl: "https://api.openai.com/v1",
    models: ["gpt-6-sol", "gpt-6-luna"],
    keyHint: "在 platform.openai.com 创建 API Key。模型名以你账户里可用的为准，可点「获取可用模型」。",
    kind: "openai",
  },
  gemini: {
    name: "Gemini（Google）",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    models: ["gemini-3.8-flash", "gemini-4-argon"],
    keyHint: "在 Google AI Studio（aistudio.google.com）创建 API Key。模型名以账户可用的为准，可点「获取可用模型」。",
    kind: "gemini",
  },
  deepseek: {
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    models: ["deepseek-v4-flash", "deepseek-v4-pro"],
    keyHint: "在 DeepSeek 开放平台（platform.deepseek.com）创建 API Key。",
    kind: "deepseek",
  },
};
export const PROVIDER_ORDER = ["claude", "openai", "gemini", "deepseek"];

const ANTHROPIC_VERSION = "2026-10-21";

function base(cfg) {
  let b = (cfg.baseUrl || PROVIDERS[cfg.provider]?.baseUrl || "").trim().replace(/\/+$/, "");
  if (!b) throw new Error(t("err.noUrl"));
  b = b.replace(/\/(chat\/completions|messages)$/, "");
  // 只填了域名时补上官方路径（如 https://generativelanguage.googleapis.com → …/v1beta/openai）
  if (/^https?:\/\/[^/]+$/.test(b)) {
    const kind = PROVIDERS[cfg.provider]?.kind;
    if (kind === "gemini") b += "/v1beta/openai";
    else if (kind === "openai" || kind === "anthropic") b += "/v1";
  }
  return b;
}

// 输出被长度上限截断：内容不完整，JSON 必然解析失败
function truncated() {
  const e = new Error(t("err.truncated"));
  e.truncated = true;
  return e;
}

function headersFor(cfg) {
  const key = (cfg.apiKey || "").trim();
  if (PROVIDERS[cfg.provider]?.kind === "anthropic") {
    return { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": ANTHROPIC_VERSION, "anthropic-dangerous-direct-browser-access": "true" };
  }
  return { "Content-Type": "application/json", Authorization: "Bearer " + key };
}

async function request(url, opts) {
  let res;
  try { res = await fetch(url, opts); }
  // 原生网络层断网时抛的不是 TypeError，凡是没拿到 HTTP 响应的都按网络问题提示
  catch (e) { throw new Error(t("err.network") + (e?.message ? " (" + String(e.message).slice(0, 120) + ")" : "")); }
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try { let j = JSON.parse(text); if (Array.isArray(j)) j = j[0] || {}; msg = j.error?.message || j.message || text; } catch {}
    const err = new Error(explainStatus(res.status, msg));
    err.status = res.status;
    throw err;
  }
  try { return JSON.parse(text); } catch { throw new Error(t("err.notJsonResp") + text.slice(0, 120)); }
}

function explainStatus(code, msg) {
  const short = String(msg).slice(0, 200);
  if (code === 401) return t("err.s401") + " " + short;
  if (code === 402) return t("err.s402");
  if (code === 403) return t("err.s403") + " " + short;
  if (code === 404) return t("err.s404") + " " + short;
  if (code === 429) return t("err.s429") + " " + short;
  if (code === 529 || code === 503) return t("err.busy", { code });
  return t("err.status", { code }) + " " + short;
}

// Claude 5 系列才支持 effort；Opus 5 / 5.5、Sonnet 5.5、Fable 5.1 支持服务端拒答兜底
const supportsEffort = (m) => /^claude-(opus|sonnet|haiku|fable|mythos)-5/.test(m);
const supportsFallback = (m) => /^claude-(opus-5|sonnet-5-5|fable-5-1)/.test(m);

async function callAnthropic(cfg, messages, { json, maxTokens, effort }) {
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const body = {
    model: cfg.model,
    max_tokens: Math.max(maxTokens, 16000), // 思考也占输出额度，留足空间
    messages: messages.filter((m) => m.role !== "system"),
  };
  if (system) body.system = system;
  if (supportsEffort(cfg.model)) body.output_config = { effort };
  const headers = headersFor(cfg);
  if (supportsFallback(cfg.model)) { body.fallbacks = "default"; headers["anthropic-beta"] = "server-side-fallback-2026-07-01"; }
  const url = base(cfg) + "/messages";
  let data;
  try {
    data = await request(url, { method: "POST", headers, body: JSON.stringify(body) });
  } catch (e) {
    // 中转服务或旧模型不认兜底参数时，去掉后重试一次
    if (e.status !== 400 || !body.fallbacks) throw e;
    delete body.fallbacks; delete headers["anthropic-beta"];
    data = await request(url, { method: "POST", headers, body: JSON.stringify(body) });
  }
  if (data.stop_reason === "refusal") throw new Error(t("err.refusal"));
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  if (data.stop_reason === "max_tokens" && (json || !text)) throw truncated();
  return text;
}

async function callOpenAICompatible(cfg, messages, { json, maxTokens }) {
  const kind = PROVIDERS[cfg.provider]?.kind;
  const body = { model: cfg.model, messages };
  if (kind === "openai") body.max_completion_tokens = Math.max(maxTokens, 16000); // 推理模型不收 temperature，推理也占额度
  else if (kind === "gemini") body.max_tokens = Math.max(maxTokens, 16000);
  else { body.max_tokens = maxTokens; body.temperature = cfg.temperature ?? 0.3; }
  if (json) body.response_format = { type: "json_object" };
  const url = base(cfg) + "/chat/completions";
  const opts = () => ({ method: "POST", headers: headersFor(cfg), body: JSON.stringify(body) });
  let data;
  try {
    data = await request(url, opts());
  } catch (e) {
    // 部分模型不支持 JSON 模式，去掉后重试一次
    if (!(json && e.status === 400)) throw e;
    delete body.response_format;
    data = await request(url, opts());
  }
  const c = data.choices?.[0];
  const text = c?.message?.content || "";
  if (c?.finish_reason === "length" && (json || !text)) throw truncated();
  return text;
}

export async function chat(cfg, messages, { json = false, maxTokens = 8000, effort = "medium", temperature } = {}) {
  if (!PROVIDERS[cfg.provider]) throw new Error(t("err.noProvider"));
  if (!cfg.apiKey) throw new Error(t("err.needKey"));
  if (!cfg.model) throw new Error(t("err.noModel"));
  const c = temperature == null ? cfg : { ...cfg, temperature };
  const content = PROVIDERS[cfg.provider].kind === "anthropic"
    ? await callAnthropic(c, messages, { json, maxTokens, effort })
    : await callOpenAICompatible(c, messages, { json, maxTokens });
  return json ? parseJson(content) : content;
}

export function parseJson(s) {
  const t = String(s).trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try { return JSON.parse(t); } catch {}
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch {} }
  const head = t.replace(/\s+/g, " ").slice(0, 60);
  const e = new Error(head ? t("err.badJson", { head }) : t("err.badJsonEmpty"));
  e.badJson = true;
  throw e;
}

// JSON 坏了或被截断时自动再试一次
const retryable = (e) => e && (e.badJson || e.truncated);
export async function chatJson(cfg, messages, opts) {
  try { return await chat(cfg, messages, { ...opts, json: true }); }
  catch (e) { if (!retryable(e)) throw e; return chat(cfg, messages, { ...opts, json: true }); }
}

export async function testConnection(cfg) {
  const r = await chat(cfg, [{ role: "user", content: "只回复两个字：连通" }], { maxTokens: 20, effort: "low" });
  return r.trim();
}

// 拉取账户里可用的模型列表
export async function listModels(cfg) {
  if (!cfg.apiKey) throw new Error(t("err.needKey"));
  const data = await request(base(cfg) + "/models", { method: "GET", headers: headersFor(cfg) });
  let ids = (data.data || data.models || []).map((m) => String(m.id || m.name || "").replace(/^models\//, "")).filter(Boolean);
  const kind = PROVIDERS[cfg.provider]?.kind;
  if (kind === "openai") ids = ids.filter((id) => /^(gpt|o\d|chat)/.test(id) && !/(audio|realtime|image|tts|transcribe|search|embedding)/.test(id));
  if (kind === "gemini") ids = ids.filter((id) => /^gemini/.test(id) && !/(embedding|image|tts|audio|live)/.test(id));
  return [...new Set(ids)].sort().reverse();
}

// ---------- 结构分析 ----------

const sys = (lang) => `你是一位电影剧作结构分析师，熟悉三幕/四段式结构、多线叙事、伏笔与回收。
只根据用户提供的剧本内容分析，不要编造剧本里没有的情节。
JSON 里所有给人看的文字都使用${aiLangName(lang)}（字数限制按相当篇幅换算），严格按要求的 JSON 结构返回，不要输出任何解释文字。`;

function sceneDigest(scenes, budget) {
  const total = scenes.reduce((a, s) => a + s.text.length, 0);
  const ratio = Math.min(1, budget / Math.max(1, total));
  return scenes
    .map((s) => {
      const keep = Math.max(80, Math.floor(s.text.length * ratio));
      const body = keep < s.text.length ? s.text.slice(0, keep) + "…" : s.text;
      return `【场${s.id}】${s.heading}（估算${s.duration}秒）\n${body}`;
    })
    .join("\n\n");
}

const PASS1 = (n) => `下面是一部剧本的全部 ${n} 场（每场已标注编号和估算时长）。请分析整体结构，返回 JSON：
{
  "title": "剧本标题，若文本中没有则根据内容拟一个不超过10字的暂定名",
  "logline": "180-260字的故事梗概，按情节顺序写，包含结局",
  "lines": [ { "key": "A", "name": "线索名，不超过5字", "desc": "一句话说明，不超过16字" } ],
  "acts": [ { "name": "幕名，如建置/发展/转折/高潮与结局", "from": 起始场号, "to": 结束场号, "desc": "该幕关键词，不超过14字" } ],
  "foreshadow": [ { "name": "伏笔名，不超过6字", "scenes": [按出现顺序排列的场号] } ],
  "checks": [ { "title": "不超过8字", "text": "不超过90字" } ],
  "issues": [ "剧本中的笔误、场景标注错误或前后矛盾，每条不超过40字" ]
}
要求：
1. lines 给 2–5 条，key 依次用 A、B、C、D、E。多时空或多视角交叉叙事时按时空/视角分线；线性叙事时按主题或人物关系分线；梦境、回忆、戏中戏等应单独成线。
2. acts 必须从第1场连续覆盖到第${n}场，不重叠、不遗漏。
3. foreshadow 给 4–12 条，每条至少 2 个场号；第一个场号是埋设处，最后一个是回收处。优先选择贯穿全片的道具、台词、意象和人物关系。
4. checks 给 3–6 条结构层面的观察，最后一条写"若需压缩时长，可合并或删减哪些场"。
5. issues 没有就返回空数组。`;

const PASS2 = (lines) => `以下是同一剧本的一部分场次。已确定的叙事线索为：
${lines.map((l) => `${l.key} ${l.name}：${l.desc}`).join("\n")}
请为每一场返回 JSON：
{ "scenes": [ { "id": 场号, "line": "线索key", "title": "不超过6字的场次标题", "summary": "一句话内容，不超过40字", "role": "该场在结构中的作用，不超过28字；若埋下伏笔以○开头，若回收伏笔以●开头" } ] }
每一场都必须出现且只出现一次，line 只能用上面给出的 key。`;

export async function analyse(cfg, scenes, onProgress = () => {}, lang = "zh-CN") {
  const SYS = sys(lang);
  const n = scenes.length;
  onProgress(t("ana.pass1", { n }));
  const g = await chatJson(cfg, [
    { role: "system", content: SYS },
    { role: "user", content: PASS1(n) + "\n\n" + sceneDigest(scenes, 60000) },
  ], { maxTokens: 8000 });

  const lines = normLines(g.lines);
  const BATCH = 20;
  const ann = new Map();
  // 一批输出被截断或 JSON 坏掉时对半拆开重做，最小拆到 5 场
  const annotate = async (part) => {
    onProgress(t("ana.pass2", { a: part[0].id, b: part[part.length - 1].id, n }));
    const msgs = [
      { role: "system", content: SYS },
      { role: "user", content: PASS2(lines) + "\n\n" + sceneDigest(part, 30000) },
    ];
    let r;
    try { r = await chat(cfg, msgs, { json: true, maxTokens: 8000 }); }
    catch (e) {
      if (!retryable(e)) throw e;
      if (part.length <= 5) r = await chat(cfg, msgs, { json: true, maxTokens: 8000 });
      else { const h = Math.ceil(part.length / 2); await annotate(part.slice(0, h)); await annotate(part.slice(h)); return; }
    }
    (r.scenes || []).forEach((s) => ann.set(Number(s.id), s));
  };
  for (let i = 0; i < n; i += BATCH) await annotate(scenes.slice(i, i + BATCH));

  const keys = new Set(lines.map((l) => l.key));
  const outScenes = scenes.map((s) => {
    const a = ann.get(s.id) || {};
    return {
      ...s,
      line: keys.has(a.line) ? a.line : lines[0].key,
      title: (a.title || s.place || t("common.sceneN", { n: s.id })).slice(0, 16),
      summary: a.summary || "",
      role: a.role || "",
    };
  });
  const missing = scenes.filter((s) => !ann.has(s.id)).length;

  return {
    title: g.title || "",
    logline: g.logline || "",
    lines,
    acts: normActs(g.acts, n),
    foreshadow: (g.foreshadow || [])
      .map((f) => ({ name: String(f.name || "").slice(0, 10), scenes: (f.scenes || []).map(Number).filter((x) => x >= 1 && x <= n) }))
      .filter((f) => f.name && f.scenes.length >= 2),
    checks: (g.checks || []).filter((c) => c && c.title),
    issues: (g.issues || []).filter(Boolean),
    scenes: outScenes,
    warnings: missing ? [t("ana.missing", { n: missing })] : [],
  };
}

function normLines(ls) {
  const arr = (Array.isArray(ls) ? ls : []).filter((l) => l && l.name).slice(0, 6);
  if (!arr.length) return [{ key: "A", name: t("st.mainLine"), desc: "" }];
  return arr.map((l, i) => ({ key: String.fromCharCode(65 + i), name: String(l.name).slice(0, 8), desc: l.desc || "", _old: l.key }))
    .map(({ _old, ...l }) => l);
}

function normActs(acts, n) {
  const a = (Array.isArray(acts) ? acts : [])
    .map((x) => ({ name: x.name || "", from: Number(x.from), to: Number(x.to), desc: x.desc || "" }))
    .filter((x) => x.from >= 1 && x.to >= x.from)
    .sort((p, q) => p.from - q.from);
  if (!a.length) return [{ name: t("st.wholeFilm"), from: 1, to: n, desc: "" }];
  a[0].from = 1;
  for (let i = 1; i < a.length; i++) a[i].from = a[i - 1].to + 1;
  a[a.length - 1].to = n;
  return a.filter((x) => x.from <= x.to && x.from <= n);
}
