// 桌面版 / 安卓版的 Claude 连接：页面在 claude.ai 外运行时没有 window.claude，
// 这里用用户自己的 API 密钥直接调用 Claude API，并提供与页面约定相同的 sample.json() 接口。
// 密钥只保存在本机（localStorage），不会上传到别处。
import Anthropic from "@anthropic-ai/sdk";

const SETTINGS_KEY = "sbp-claude-settings";
const MODELS = [
  ["claude-opus-5-5", "Claude Opus 5.5（默认，镜头设计最细）"],
  ["claude-sonnet-5-5", "Claude Sonnet 5.5（更快、更省）"],
  ["claude-haiku-5-5", "Claude Haiku 5.5（最快、最省）"],
];
// 服务端拒答回退（fallbacks: "default"）只对这两个模型开启
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-sonnet-5-5"]);

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch { return {}; }
}
function saveSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); return true; } catch { return false; }
}

// 与页面里 sample.json 的容错读法一致：整段 JSON → 代码块 → 第一个 { 到最后一个 }
function parseJSON(text) {
  try { return JSON.parse(text); } catch {}
  const fence = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  if (fence) { try { return JSON.parse(fence[1]); } catch {} }
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(text.slice(a, b + 1)); } catch {} }
  throw { code: "invalid_json", message: "reply is not JSON", text };
}

function toSampleError(e) {
  if (e && typeof e.code === "string" && !(e instanceof Error)) return e;
  if (e instanceof Anthropic.APIUserAbortError) return { code: "cancelled", message: "cancelled" };
  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError)
    return { code: "auth_error", message: e.message };
  if (e instanceof Anthropic.RateLimitError) return { code: "rate_limited", message: e.message };
  if (e instanceof Anthropic.BadRequestError) return { code: "bad_request", message: e.message };
  if (e instanceof Anthropic.APIConnectionError) return { code: "network", message: e.message };
  if (e instanceof Anthropic.APIError) return { code: "upstream_error", message: e.message };
  return { code: "upstream_error", message: String((e && e.message) || e) };
}

async function sampleText(prompt, opts = {}) {
  const s = loadSettings();
  if (!s.apiKey) throw { code: "no_key", message: "no API key" };
  const client = new Anthropic({ apiKey: s.apiKey, dangerouslyAllowBrowser: true });
  const model = s.model || "claude-opus-5-5";
  const params = {
    model,
    max_tokens: 64000,
    thinking: { type: "adaptive" },
    output_config: { effort: s.effort || "medium" },
    messages: [{ role: "user", content: prompt }],
  };
  if (FALLBACK_MODELS.has(model)) {
    params.betas = ["server-side-fallback-2026-07-01"];
    params.fallbacks = "default";
  }
  try {
    const stream = client.beta.messages.stream(params, { signal: opts.signal });
    stream.on("text", (delta, snapshot) => {
      try { opts.onText && opts.onText({ text: snapshot, delta }); } catch {}
    });
    const msg = await stream.finalMessage();
    if (msg.stop_reason === "refusal") throw { code: "refused", message: "refused" };
    const text = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    return { text, truncated: msg.stop_reason === "max_tokens" };
  } catch (e) {
    throw toSampleError(e);
  }
}

const sample = (prompt, opts) => sampleText(prompt, opts);
sample.json = async (prompt, opts) => {
  const { text, truncated } = await sampleText(prompt, opts);
  if (truncated) throw { code: "invalid_json", message: "reply was cut off", text };
  return parseJSON(text);
};

window.sbpNative = { sample, loadSettings, saveSettings };

/* ---------- 「Claude 设置」对话框 ---------- */
function injectSettingsUI() {
  const opts = document.querySelector(".opts");
  if (!opts || document.getElementById("btn-claude-settings")) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "btn-claude-settings";
  btn.textContent = "Claude 设置";
  opts.appendChild(btn);

  const dlg = document.createElement("dialog");
  dlg.id = "claude-settings";
  dlg.innerHTML = `
    <form method="dialog" class="cs-form">
      <h3>Claude 设置</h3>
      <p class="hint">「Claude 拆镜」会用你自己的 Claude API 密钥直接调用 Claude，费用记在你的 Anthropic 账户上。密钥只保存在这台设备上。</p>
      <label for="cs-key">API 密钥</label>
      <input id="cs-key" type="password" autocomplete="off" spellcheck="false" placeholder="sk-ant-…">
      <label for="cs-model">模型</label>
      <select id="cs-model">${MODELS.map(([v, n]) => `<option value="${v}">${n}</option>`).join("")}</select>
      <label for="cs-effort">思考深度</label>
      <select id="cs-effort">
        <option value="low">低（最快）</option>
        <option value="medium">中（默认）</option>
        <option value="high">高（镜头设计更细，更慢更贵）</option>
      </select>
      <p class="hint">在 console.anthropic.com 的 API Keys 页面创建密钥。</p>
      <p class="msg" id="cs-msg" role="status"></p>
      <div class="row">
        <button class="primary" id="cs-save" type="button">保存</button>
        <button id="cs-clear" type="button">清除密钥</button>
        <button id="cs-close" type="button">关闭</button>
      </div>
    </form>`;
  document.body.appendChild(dlg);
  const style = document.createElement("style");
  style.textContent = `
    #claude-settings{background:var(--panel);color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:0;width:min(460px,calc(100vw - 32px))}
    #claude-settings::backdrop{background:rgba(0,0,0,.6)}
    .cs-form{display:flex;flex-direction:column;gap:6px;padding:18px}
    .cs-form h3{margin:0 0 4px;font-family:var(--f-display);font-size:18px}
    .cs-form label{font-size:12px;color:var(--muted);margin-top:6px}
    .cs-form input,.cs-form select{font:inherit;color:var(--fg);background:#0b0e0d;border:1px solid var(--line);border-radius:4px;padding:7px 10px}`;
  document.head.appendChild(style);

  const $ = (id) => document.getElementById(id);
  const fill = () => {
    const s = loadSettings();
    $("cs-key").value = s.apiKey || "";
    $("cs-model").value = s.model || "claude-opus-5-5";
    $("cs-effort").value = s.effort || "medium";
    $("cs-msg").textContent = s.apiKey ? "已保存密钥。" : "还没有保存密钥。";
    $("cs-msg").className = "msg " + (s.apiKey ? "ok" : "err");
  };
  btn.addEventListener("click", () => { fill(); dlg.showModal(); });
  $("cs-close").addEventListener("click", () => dlg.close());
  $("cs-save").addEventListener("click", () => {
    const key = $("cs-key").value.trim();
    const ok = saveSettings({ apiKey: key, model: $("cs-model").value, effort: $("cs-effort").value });
    $("cs-msg").textContent = !ok ? "保存失败：本机存储不可用。" : key ? "已保存。" : "已保存设置，但还没有填密钥。";
    $("cs-msg").className = "msg " + (ok && key ? "ok" : "err");
  });
  $("cs-clear").addEventListener("click", () => {
    const s = loadSettings(); delete s.apiKey; saveSettings(s); fill();
  });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", injectSettingsUI);
else injectSettingsUI();
