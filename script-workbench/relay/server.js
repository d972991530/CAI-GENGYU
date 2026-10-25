// 剧本结构台 · AI 中转服务（部署在阿里云函数计算「Web 函数」上，Node.js 18 及以上，无第三方依赖）
//
// 作用：App 和网页版把请求发到这里，由这里带上你自己的 API Key 转发给上游 AI（默认豆包·火山方舟）。
// Key 只存在函数的环境变量里，用户拿到的是你发给他们的「访问口令」，可以随时作废，并按口令限制每天的次数。
//
// 环境变量：
//   UPSTREAM_KEY     必填，上游的 API Key（火山方舟 / DeepSeek 等）
//   UPSTREAM_BASE    上游地址，默认 https://ark.cn-beijing.volces.com/api/v3（DeepSeek 填 https://api.deepseek.com）
//   MODEL            固定使用的模型名；客户端传 auto 或不传时也用它
//   ACCESS_CODES     访问口令，多个用英文逗号分隔；不填则拒绝所有请求
//   DAILY_LIMIT      每个口令每天最多请求次数，默认 200
//   MAX_TOKENS       单次最多输出 token，默认 8000
//   ALLOWED_ORIGINS  允许调用的网页来源，逗号分隔，默认 *（App 不受此限制）

"use strict";
const http = require("http");
const crypto = require("crypto");

const env = process.env;
const UPSTREAM_BASE = (env.UPSTREAM_BASE || "https://ark.cn-beijing.volces.com/api/v3").replace(/\/+$/, "");
const UPSTREAM_KEY = env.UPSTREAM_KEY || "";
const MODEL = env.MODEL || "";
const CODES = (env.ACCESS_CODES || "").split(",").map((s) => s.trim()).filter(Boolean);
const DAILY_LIMIT = Number(env.DAILY_LIMIT || 200);
const MAX_TOKENS = Number(env.MAX_TOKENS || 8000);
const ORIGINS = (env.ALLOWED_ORIGINS || "*").split(",").map((s) => s.trim()).filter(Boolean);
const PORT = Number(env.FC_SERVER_PORT || env.PORT || 9000);
const MAX_BODY = 2 * 1024 * 1024;

// 每个口令每天的用量。只记在内存里：函数实例重启会清零，多个实例各算各的，
// 所以请在函数配置里把「实例数上限」设为 1，让限额准确。
const usage = new Map();
const today = () => new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10); // 按北京时间换日

const sha = (s) => crypto.createHash("sha256").update(String(s)).digest();
// 日志里只记口令的哈希前几位，不记口令本身
const tag = (code) => sha(code).toString("hex").slice(0, 6);
function codeOf(req) {
  const m = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || "");
  if (!m) return null;
  const given = sha(m[1].trim());
  return CODES.find((c) => crypto.timingSafeEqual(sha(c), given)) || null;
}

function cors(req) {
  const origin = req.headers.origin;
  const allow = ORIGINS.includes("*") ? "*" : ORIGINS.includes(origin) ? origin : "";
  return allow ? {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  } : {};
}

function send(res, req, status, obj) {
  const body = typeof obj === "string" ? obj : JSON.stringify(obj);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...cors(req) });
  res.end(body);
}
const fail = (res, req, status, message) => send(res, req, status, { error: { message } });

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on("data", (c) => { size += c.length; if (size > MAX_BODY) { reject(new Error("too large")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function chat(req, res, code) {
  const key = today() + "|" + code;
  const used = usage.get(key) || 0;
  if (used >= DAILY_LIMIT) return fail(res, req, 429, `今日次数已用完（每天 ${DAILY_LIMIT} 次），明天再来。`);

  let body;
  try { body = JSON.parse(await readBody(req)); } catch { return fail(res, req, 400, "请求内容不是有效的 JSON"); }
  if (!body || !Array.isArray(body.messages)) return fail(res, req, 400, "缺少 messages");

  if (MODEL) body.model = MODEL; // 配了 MODEL 就统一用它，用户改不了模型
  if (!body.model || body.model === "auto") return fail(res, req, 400, "中转没有配置 MODEL，请在请求里指定模型名");
  body.stream = false;
  for (const f of ["max_tokens", "max_completion_tokens"]) if (body[f] != null) body[f] = Math.min(Number(body[f]) || MAX_TOKENS, MAX_TOKENS);
  if (body.max_tokens == null && body.max_completion_tokens == null) body.max_tokens = MAX_TOKENS;

  // 先计数再转发：上游出错也算一次，防止被反复刷
  usage.set(key, used + 1);
  if (usage.size > 5000) for (const k of usage.keys()) if (!k.startsWith(today())) usage.delete(k);

  let up;
  try {
    up = await fetch(UPSTREAM_BASE + "/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + UPSTREAM_KEY },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(280000),
    });
  } catch (e) {
    console.log(`[${tag(code)}] upstream error: ${e.message}`);
    return fail(res, req, 502, "中转连不上上游 AI 服务：" + e.message);
  }
  const text = await up.text();
  console.log(`[${tag(code)}] ${body.model} -> ${up.status} (${used + 1}/${DAILY_LIMIT})`);
  send(res, req, up.status, text);
}

const server = http.createServer(async (req, res) => {
  try {
    const path = (req.url || "/").split("?")[0].replace(/\/+$/, "") || "/";
    if (req.method === "OPTIONS") { res.writeHead(204, cors(req)); return res.end(); }
    if (req.method === "GET" && path === "/") return send(res, req, 200, { ok: true, service: "script-workbench relay" });
    if (!UPSTREAM_KEY) return fail(res, req, 500, "中转还没有配置 UPSTREAM_KEY");

    const code = codeOf(req);
    if (!code) return fail(res, req, 401, "访问口令不对，请向提供者索取口令并填在 API Key 处");

    if (req.method === "GET" && /^(\/v1)?\/models$/.test(path)) return send(res, req, 200, { object: "list", data: [{ id: MODEL || "auto", object: "model" }] });
    if (req.method === "POST" && /^(\/v1)?\/chat\/completions$/.test(path)) return await chat(req, res, code);
    return fail(res, req, 404, "没有这个接口");
  } catch (e) {
    console.log("error:", e.message);
    if (!res.headersSent) fail(res, req, 500, "中转内部错误");
  }
});

server.listen(PORT, () => console.log(`relay listening on ${PORT}, upstream ${UPSTREAM_BASE}, ${CODES.length} access code(s)`));
