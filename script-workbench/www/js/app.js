import { initLang, setLang, getLang, LANGS, t } from "./i18n.js";
import { extractText } from "./extract.js";
import { splitScenes, estimate, DEFAULT_RATES } from "./parser.js";
import { PROVIDERS, PROVIDER_ORDER, analyse, testConnection, listModels } from "./ai.js";
import { CHANNELS, findTrack, trackName, typeName, channelName } from "./skill.js";
import { GENRES, GOALS, LENGTHS, generate, rewrite, review, formatPassage, formatItem, formatBook } from "./dialogue.js";
import { renderPoster, withTimes, fmt } from "./render.js";
import { VERSION, checkUpdate, newerThan } from "./update.js";

initLang();

const $ = (s, r = document) => r.querySelector(s);
const view = $("#view");
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const date = (ms) => new Date(ms).toLocaleDateString(getLang());

// ---------- 本机存储 ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { toast(t("err.storageFull")); return false; } },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
// 每个服务商各存一份地址/模型/Key，切换时互不覆盖
function loadSettings() {
  const s = { provider: "deepseek", keys: {}, rates: { ...DEFAULT_RATES }, ...store.get("stl.settings", {}) };
  if (!s.keys || typeof s.keys !== "object") s.keys = {};
  // 1.0 版只存一组 provider/baseUrl/model/apiKey；通义千问和自定义服务已移除
  if (s.apiKey && PROVIDERS[s.provider] && !s.keys[s.provider]) s.keys[s.provider] = { apiKey: s.apiKey, model: s.model, baseUrl: s.baseUrl };
  delete s.apiKey; delete s.model; delete s.baseUrl;
  if (!PROVIDERS[s.provider]) s.provider = "deepseek";
  for (const k of PROVIDER_ORDER) {
    const v = (s.keys[k] = { apiKey: "", ...s.keys[k] });
    v.baseUrl = v.baseUrl || PROVIDERS[k].baseUrl;
    v.model = v.model || PROVIDERS[k].models[0];
    if (v.model === "deepseek-flash") v.model = "deepseek-v4-flash"; // 1.0 版默认模型名写错了
  }
  return s;
}
let settings = loadSettings();
const saveSettings = () => store.set("stl.settings", settings);
saveSettings();
const ai = () => ({ provider: settings.provider, ...settings.keys[settings.provider] });
const hasKey = () => !!ai().apiKey;
const pname = (k) => t("prov." + k);
const aiName = () => `${pname(settings.provider)} · ${ai().model}`;

const listProjects = () => store.get("stl.index", []);
const loadProject = (id) => store.get("stl.p." + id, null);
function saveProject(p) {
  p.updatedAt = Date.now();
  if (!store.set("stl.p." + p.id, p)) return;
  const idx = listProjects().filter((x) => x.id !== p.id);
  idx.unshift({ id: p.id, title: p.title, scenes: p.scenes.length, total: withTimes(p), ai: p.ai, updatedAt: p.updatedAt });
  store.set("stl.index", idx);
}
function deleteProject(id) { store.del("stl.p." + id); store.set("stl.index", listProjects().filter((x) => x.id !== id)); }

// 台词本
const listBooks = () => store.get("stl.bindex", []);
const loadBook = (id) => {
  const b = store.get("stl.b." + id, null);
  if (b && !b.lang) b.lang = "zh-CN"; // 1.1 版的台词本都是中文
  return b;
};
function saveBook(b) {
  b.updatedAt = Date.now();
  if (!store.set("stl.b." + b.id, b)) return false;
  const idx = listBooks().filter((x) => x.id !== b.id);
  idx.unshift({ id: b.id, title: b.title, genre: b.genre, channel: b.channel, track: b.track, n: b.passages.length, updatedAt: b.updatedAt });
  store.set("stl.bindex", idx);
  return true;
}
function deleteBook(id) { store.del("stl.b." + id); store.set("stl.bindex", listBooks().filter((x) => x.id !== id)); }
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

// ---------- 通用 ----------
let toastTimer;
function toast(msg) { const el = $("#toast"); el.textContent = msg; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => (el.hidden = true), 2800); }
function setBar(title, back) { $("#bartitle").textContent = title; $("#back").hidden = !back; }
$("#back").onclick = () => history.back();
function go(h) { if (location.hash === h) route(); else location.hash = h; }
window.addEventListener("hashchange", route);

// 底部导航
const TABS = [["#/", "tab.write"], ["#/structure", "tab.structure"], ["#/settings", "tab.settings"]];
function tabOf(h) {
  if (h.startsWith("#/structure") || h.startsWith("#/p/") || h === "#/parsed") return "#/structure";
  if (h.startsWith("#/settings") || h === "#/support") return "#/settings";
  return "#/";
}
function renderTabs(h) {
  const on = tabOf(h);
  $("#tabs").innerHTML = TABS.map(([href, key]) => `<a href="${href}" class="${href === on ? "on" : ""}" ${href === on ? 'aria-current="page"' : ""}><i class="ic ic-${key.slice(4)}" aria-hidden="true"></i><span>${esc(t(key))}</span></a>`).join("");
}

let draft = null; // 刚解析、尚未保存的剧本
let busy = false;

function route() {
  closeSheet();
  const h = location.hash || "#/";
  renderTabs(h);
  renderUpdateBanner();
  window.scrollTo(0, 0);
  if (h.startsWith("#/p/")) return showProject(h.slice(4));
  const bw = /^#\/b\/([^/]+)\/write(?:\/([^/]+))?$/.exec(h);
  if (bw) return showWrite(bw[1], bw[2]);
  if (h.startsWith("#/b/")) return showBook(h.slice(4));
  if (h === "#/settings") return showSettings();
  if (h === "#/support") return showSupport();
  if (h === "#/structure") return showStructureHome();
  if (h === "#/parsed" && draft) return showParsed();
  return showWriteHome();
}

const keyNotice = () => (hasKey() ? "" : `<div class="notice">${t("home.noKey")}</div>`);

// ---------- 台词工坊首页 ----------
function showWriteHome() {
  setBar(t("app.name"), false);
  const books = listBooks();
  view.innerHTML = `<div class="stack">
    ${keyNotice()}
    <section class="hero">
      <div><h2>${t("home.title")}</h2><p>${t("home.desc")}</p></div>
      <button class="btn primary" id="newbook">${t("home.new")}</button>
    </section>
    <div class="panel"><h2>${t("home.myBooks")}</h2>
      ${books.length ? `<div class="list">${books.map((b) => `<div class="item"><div class="grow" data-book="${b.id}" role="button" tabindex="0"><b>${esc(b.title || t("book.untitled"))}</b><small>${esc(t("genre." + b.genre + ".short"))} · ${esc(trackLabel(b))} · ${t("home.nPassages", { n: b.n })} · ${date(b.updatedAt)}</small></div><button data-bdel="${b.id}">${t("common.delete")}</button></div>`).join("")}</div>`
        : `<p class="hint">${t("home.emptyBooks")}</p>`}
    </div>
    <p class="hint center-t"><a href="#/support">${t("sup.link")}</a></p>
  </div>`;
  $("#newbook").onclick = () => editBookMeta(null);
  view.querySelectorAll("[data-book]").forEach((el) => { el.onclick = () => go("#/b/" + el.dataset.book); el.onkeydown = (e) => e.key === "Enter" && el.click(); });
  view.querySelectorAll("[data-bdel]").forEach((el) => (el.onclick = () => confirmSheet(t("home.confirmDelBook"), t("common.delete"), () => { deleteBook(el.dataset.bdel); showWriteHome(); })));
}

// ---------- 结构台首页 ----------
function showStructureHome() {
  setBar(t("tab.structure"), false);
  const list = listProjects();
  view.innerHTML = `<div class="stack">
    ${keyNotice()}
    <div class="drop">
      <strong>${t("st.upload")}</strong>
      <p class="hint">${t("st.uploadDesc")}</p>
      <button class="btn primary" id="pick">${t("st.pick")}</button>
    </div>
    <div class="panel"><h2>${t("st.myScripts")}</h2>
      ${list.length ? `<div class="list">${list.map((p) => `<div class="item"><div class="grow" data-open="${p.id}" role="button" tabindex="0"><b>${esc(p.title || t("st.untitled"))}</b><small>${t("st.nScenes", { n: p.scenes })} · ${fmt(p.total)} · ${p.ai ? t("st.aiDone") : t("st.localOnly")} · ${date(p.updatedAt)}</small></div><button data-del="${p.id}">${t("common.delete")}</button></div>`).join("")}</div>`
        : `<p class="hint">${t("st.empty")}</p>`}
    </div>
  </div>`;
  $("#pick").onclick = () => $("#file").click();
  view.querySelectorAll("[data-open]").forEach((el) => { el.onclick = () => go("#/p/" + el.dataset.open); el.onkeydown = (e) => e.key === "Enter" && el.click(); });
  view.querySelectorAll("[data-del]").forEach((el) => (el.onclick = () => confirmSheet(t("st.confirmDel"), t("common.delete"), () => { deleteProject(el.dataset.del); showStructureHome(); })));
}

$("#file").onchange = async (e) => {
  const f = e.target.files[0]; e.target.value = "";
  if (!f) return;
  view.innerHTML = `<div class="center"><div class="spin"></div><p>${t("st.reading", { name: esc(f.name) })}</p></div>`;
  try {
    const text = await extractText(f);
    const { scenes, preamble } = splitScenes(text);
    const durs = estimate(scenes, settings.rates);
    scenes.forEach((s, i) => (s.duration = durs[i]));
    const guessTitle = (preamble.find((l) => l.length <= 20 && !/编剧|作者|导演|written by|[:：]/i.test(l)) || f.name.replace(/\.[^.]+$/, "")).replace(/\s+/g, " ").trim();
    draft = { fileName: f.name, title: guessTitle, scenes, textLength: text.length };
    go("#/parsed");
  } catch (err) {
    view.innerHTML = `<div class="stack"><div class="notice err">${esc(err.message || String(err))}</div><div class="btns"><button class="btn" id="home">${t("common.back")}</button></div></div>`;
    $("#home").onclick = () => showStructureHome();
  }
};

// ---------- 解析结果 ----------
function showParsed() {
  setBar(t("parsed.title"), true);
  const d = draft;
  if (!d.scenes.length) {
    view.innerHTML = `<div class="stack"><div class="notice err">${t("parsed.none")}</div>
      <div class="panel"><h2>${t("parsed.formats")}</h2><p class="hint">${t("parsed.formatsDesc")}</p></div>
      <div class="btns"><button class="btn" id="re">${t("parsed.repick")}</button></div></div>`;
    $("#re").onclick = () => $("#file").click();
    return;
  }
  const total = d.scenes.reduce((a, s) => a + s.duration, 0);
  view.innerHTML = `<div class="stack">
    <div class="panel">
      <h2>${esc(d.fileName)}</h2>
      <p>${t("parsed.found", { n: d.scenes.length, total: fmt(total) })}</p>
      <div class="row2">
        <div class="field"><label for="ptitle">${t("parsed.scriptTitle")}</label><input id="ptitle" value="${esc(d.title)}"></div>
        <div class="field"><label for="target">${t("parsed.target")}</label><input id="target" type="number" min="1" step="0.5" inputmode="decimal" placeholder="${esc(t("parsed.targetPh"))}"></div>
      </div>
      <p class="hint">${t("parsed.targetHint")}</p>
      <div class="btns">
        <button class="btn primary" id="doai" ${hasKey() ? "" : "disabled"}>${t("parsed.ai")}</button>
        <button class="btn" id="dolocal">${t("parsed.local")}</button>
      </div>
      <p class="hint">${hasKey() ? t("parsed.willUse", { ai: esc(aiName()) }) : t("parsed.needKey")}</p>
    </div>
    <div class="panel"><h2>${t("parsed.preview")}</h2><p class="hint">${t("parsed.previewHint")}</p>
      <div class="tbl"><table><thead><tr><th>${t("parsed.colScene")}</th><th>${t("parsed.colPlace")}</th><th>${t("parsed.colTime")}</th><th>${t("parsed.colCast")}</th><th>${t("parsed.colDur")}</th></tr></thead><tbody>
      ${d.scenes.map((s) => `<tr><td>${s.id}</td><td class="wrap">${esc(s.interior)} ${esc(s.place)}</td><td>${esc(s.time)}</td><td class="wrap">${esc(s.cast.slice(0, 4).join(", "))}</td><td>${s.duration}″</td></tr>`).join("")}
      </tbody></table></div></div>
  </div>`;
  const applyForm = () => {
    d.title = $("#ptitle").value.trim();
    const m = parseFloat($("#target").value);
    const durs = estimate(d.scenes, settings.rates, m > 0 ? m * 60 : 0);
    d.scenes.forEach((s, i) => (s.duration = durs[i]));
  };
  $("#dolocal").onclick = () => { applyForm(); const p = localProject(d); saveProject(p); draft = null; go("#/p/" + p.id); };
  $("#doai").onclick = () => { applyForm(); runAI(d); };
}

function localProject(d) {
  return {
    id: Date.now().toString(36), fileName: d.fileName, title: d.title, ai: false, logline: "",
    lines: [{ key: "A", name: t("st.allScenes"), desc: "" }],
    acts: [{ name: t("st.wholeFilm"), from: 1, to: d.scenes.length, desc: "" }],
    scenes: d.scenes.map((s) => ({ ...s, line: "A", title: (s.place || t("common.sceneN", { n: s.id })).slice(0, 12), summary: "", role: "" })),
    foreshadow: [], checks: [], issues: [],
  };
}

async function runAI(d, existingId) {
  if (busy) return; busy = true;
  setBar(t("ana.running"), false);
  view.innerHTML = `<div class="center"><div class="spin"></div><p id="prog">${t("ana.connecting")}</p><p class="hint">${t("ana.longHint")}</p></div>`;
  try {
    const r = await analyse(ai(), d.scenes, (m) => { const el = $("#prog"); if (el) el.textContent = m; }, getLang());
    const p = { id: existingId || Date.now().toString(36), fileName: d.fileName, ai: true, ...r, title: d.title || r.title };
    saveProject(p);
    draft = null;
    busy = false;
    if (r.warnings.length) toast(r.warnings[0]);
    location.replace("#/p/" + p.id);
  } catch (err) {
    busy = false;
    setBar(t("ana.failed"), true);
    view.innerHTML = `<div class="stack"><div class="notice err">${esc(err.message || String(err))}</div>
      <div class="btns"><button class="btn primary" id="retry">${t("common.retry")}</button><button class="btn" id="tolocal">${t("ana.toLocal")}</button><button class="btn" id="toset">${t("common.checkSettings")}</button></div></div>`;
    $("#retry").onclick = () => runAI(d, existingId);
    $("#tolocal").onclick = () => { const p = localProject(d); if (existingId) p.id = existingId; saveProject(p); draft = null; go("#/p/" + p.id); };
    $("#toset").onclick = () => { if (!existingId) draft = d; go("#/settings"); };
  }
}

// ---------- 项目页 ----------
let current = null, editMode = false;
function showProject(id) {
  const p = loadProject(id);
  if (!p) return go("#/structure");
  current = p;
  setBar(p.title || t("st.untitled"), true);
  view.innerHTML = `<div class="toolbar">
      <button class="btn" id="tedit">${editMode ? t("proj.doneEdit") : t("common.edit")}</button>
      ${editMode ? `<button class="btn" id="tstruct">${t("proj.editStruct")}</button>` : ""}
      <button class="btn" id="tdlg">${t("proj.writeDialogue")}</button>
      <button class="btn" id="tpng">${t("proj.exportPng")}</button>
      <button class="btn" id="tjson">${t("proj.exportJson")}</button>
      <button class="btn" id="tre" ${hasKey() ? "" : "disabled"}>${p.ai ? t("proj.reanalyse") : t("parsed.ai")}</button>
    </div>
    ${editMode ? `<p class="hint" style="margin:-4px 0 12px">${t("proj.editHint")}</p>` : ""}
    <div class="poster" id="poster"></div>`;
  renderPoster($("#poster"), p, { editable: editMode });
  $("#tedit").onclick = () => { editMode = !editMode; showProject(id); };
  if (editMode) {
    $("#tstruct").onclick = () => editStructure(p);
    $("#poster").addEventListener("click", (e) => { const el = e.target.closest("[data-id]"); if (el) editScene(p, +el.dataset.id); });
  }
  $("#tpng").onclick = () => exportPng(p);
  $("#tjson").onclick = () => exportJson(p);
  $("#tdlg").onclick = () => {
    // 已有关联台词本就直接打开，否则新建一个并关联到这部剧本
    const b = listBooks().map((x) => loadBook(x.id)).find((x) => x && x.projectId === p.id);
    if (b) go("#/b/" + b.id); else editBookMeta(null, { title: p.title, projectId: p.id });
  };
  $("#tre").onclick = () => confirmSheet(p.ai ? t("proj.confirmRe") : t("proj.confirmAi"), t("proj.start"), () => runAI({ fileName: p.fileName, title: p.title, scenes: p.scenes }, p.id));
}

// 屏幕旋转或宽度变化时重排标签
let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { const el = $("#poster"); if (el && current) renderPoster(el, current, { editable: editMode }); }, 200); });

// ---------- 编辑面板 ----------
function openSheet(html, { lock = false } = {}) { const s = $("#sheet"); s.innerHTML = `<div role="dialog" aria-modal="true">${html}</div>`; s.hidden = false; s.onclick = lock ? null : (e) => { if (e.target === s) closeSheet(); }; }
function closeSheet() { const s = $("#sheet"); s.hidden = true; s.innerHTML = ""; }
function confirmSheet(msg, ok, fn) {
  openSheet(`<h3>${esc(msg)}</h3><div class="btns"><button class="btn primary" id="cok">${esc(ok)}</button><button class="btn" id="ccancel">${t("common.cancel")}</button></div>`);
  $("#cok").onclick = () => { closeSheet(); fn(); };
  $("#ccancel").onclick = closeSheet;
}
const saveCancel = (save, cancel) => `<div class="btns"><button class="btn primary" id="${save}">${t("common.save")}</button><button class="btn" id="${cancel}">${t("common.cancel")}</button></div>`;

function editScene(p, id) {
  const s = p.scenes.find((x) => x.id === id); if (!s) return;
  openSheet(`<h3>${t("common.sceneN", { n: s.id })}</h3><p class="hint">${esc(s.heading)}</p>
    <div class="row2">
      <div class="field"><label for="es-title">${t("scene.title")}</label><input id="es-title" value="${esc(s.title)}"></div>
      <div class="field"><label for="es-dur">${t("scene.dur")}</label><input id="es-dur" type="number" min="1" inputmode="numeric" value="${s.duration}"></div>
    </div>
    <div class="field"><label for="es-line">${t("scene.line")}</label><select id="es-line">${p.lines.map((l) => `<option value="${esc(l.key)}" ${l.key === s.line ? "selected" : ""}>${esc(l.key)} ${esc(l.name)}</option>`).join("")}</select></div>
    <div class="field"><label for="es-sum">${t("scene.summary")}</label><textarea id="es-sum">${esc(s.summary)}</textarea></div>
    <div class="field"><label for="es-role">${t("scene.role")}</label><input id="es-role" value="${esc(s.role)}"></div>
    ${saveCancel("es-save", "es-cancel")}`);
  $("#es-cancel").onclick = closeSheet;
  $("#es-save").onclick = () => {
    s.title = $("#es-title").value.trim() || s.title;
    s.duration = Math.max(1, parseInt($("#es-dur").value, 10) || s.duration);
    s.line = $("#es-line").value;
    s.summary = $("#es-sum").value.trim();
    s.role = $("#es-role").value.trim();
    saveProject(p); closeSheet(); renderPoster($("#poster"), p, { editable: true }); toast(t("common.saved"));
  };
}

function editStructure(p) {
  const total = withTimes(p);
  const del = `<button class="btn danger rm" type="button" aria-label="${esc(t("common.delete"))}">×</button>`;
  const lineRow = (l) => `<div class="edrow" data-k="${esc(l.key)}"><div class="field"><label>${t("struct.lineName", { k: esc(l.key) })}</label><input class="ln" value="${esc(l.name)}"></div><div class="field"><label>${t("struct.desc")}</label><input class="ld" value="${esc(l.desc)}"></div>${del}</div>`;
  const actRow = (a) => `<div class="edrow act-e"><div class="field"><label>${t("struct.actName")}</label><input class="an" value="${esc(a.name)}"></div><div class="field"><label>${t("struct.actRange")}</label><input class="ar" value="${a.from}-${a.to}"></div>${del}</div>`;
  const fsRow = (f) => `<div class="edrow fs-e"><div class="field"><label>${t("struct.fsName")}</label><input class="fn" value="${esc(f.name)}"></div><div class="field"><label>${t("struct.fsScenes")}</label><input class="fv" value="${f.scenes.join(",")}"></div>${del}</div>`;
  openSheet(`<h3>${t("proj.editStruct")}</h3>
    <div class="field"><label for="st-title">${t("parsed.scriptTitle")}</label><input id="st-title" value="${esc(p.title)}"></div>
    <div class="field"><label for="st-log">${t("struct.logline")}</label><textarea id="st-log">${esc(p.logline)}</textarea></div>
    <div class="field"><label for="st-target">${t("struct.scaleTo", { cur: fmt(total) })}</label><input id="st-target" type="number" min="1" step="0.5" inputmode="decimal" placeholder="${esc(t("struct.scalePh"))}"></div>
    <h3>${t("struct.lines")}</h3><div id="st-lines" class="stack">${p.lines.map(lineRow).join("")}</div><button class="btn" id="st-addl" type="button">${t("struct.addLine")}</button>
    <h3>${t("struct.acts")}</h3><div id="st-acts" class="stack">${p.acts.map(actRow).join("")}</div><button class="btn" id="st-adda" type="button">${t("struct.addAct")}</button>
    <h3>${t("struct.fs")}</h3><div id="st-fs" class="stack">${p.foreshadow.map(fsRow).join("")}</div><button class="btn" id="st-addf" type="button">${t("struct.addFs")}</button>
    ${saveCancel("st-save", "st-cancel")}`);
  const sh = $("#sheet");
  sh.addEventListener("click", (e) => { if (e.target.classList.contains("rm")) e.target.closest(".edrow").remove(); });
  $("#st-addl").onclick = () => {
    const used = [...sh.querySelectorAll("#st-lines .edrow")].map((r) => r.dataset.k);
    let k = "A"; for (let i = 0; i < 26; i++) { k = String.fromCharCode(65 + i); if (!used.includes(k)) break; }
    if (used.length >= 6) return toast(t("struct.max6"));
    $("#st-lines").insertAdjacentHTML("beforeend", lineRow({ key: k, name: "", desc: "" }));
  };
  $("#st-adda").onclick = () => $("#st-acts").insertAdjacentHTML("beforeend", actRow({ name: "", from: 1, to: p.scenes.length }));
  $("#st-addf").onclick = () => $("#st-fs").insertAdjacentHTML("beforeend", fsRow({ name: "", scenes: [] }));
  $("#st-cancel").onclick = closeSheet;
  $("#st-save").onclick = () => {
    const n = p.scenes.length;
    const lines = [...sh.querySelectorAll("#st-lines .edrow")].map((r) => ({ key: r.dataset.k, name: $(".ln", r).value.trim(), desc: $(".ld", r).value.trim() })).filter((l) => l.name);
    if (!lines.length) return toast(t("struct.keepOne"));
    const keys = new Set(lines.map((l) => l.key));
    const acts = [...sh.querySelectorAll(".act-e")].map((r) => { const m = $(".ar", r).value.match(/(\d+)\D+(\d+)/); return m ? { name: $(".an", r).value.trim(), from: +m[1], to: +m[2], desc: "" } : null; })
      .filter((a) => a && a.name && a.from >= 1 && a.to <= n && a.from <= a.to).sort((a, b) => a.from - b.from);
    const fs = [...sh.querySelectorAll(".fs-e")].map((r) => ({ name: $(".fn", r).value.trim(), scenes: ($(".fv", r).value.match(/\d+/g) || []).map(Number).filter((x) => x >= 1 && x <= n) })).filter((f) => f.name && f.scenes.length >= 2);
    const oldActs = new Map(p.acts.map((a) => [a.name, a.desc]));
    p.title = $("#st-title").value.trim();
    p.logline = $("#st-log").value.trim();
    p.lines = lines;
    p.scenes.forEach((s) => { if (!keys.has(s.line)) s.line = lines[0].key; });
    p.acts = acts.length ? acts.map((a) => ({ ...a, desc: oldActs.get(a.name) || "" })) : [{ name: t("st.wholeFilm"), from: 1, to: n, desc: "" }];
    p.foreshadow = fs;
    const m = parseFloat($("#st-target").value);
    if (m > 0) { const sum = p.scenes.reduce((a, s) => a + s.duration, 0); p.scenes.forEach((s) => (s.duration = Math.max(5, Math.round((s.duration * m * 60) / sum / 5) * 5))); }
    saveProject(p); closeSheet(); showProject(p.id); toast(t("common.saved"));
  };
}

// ---------- 导出 ----------
const isNative = () => !!window.Capacitor?.isNativePlatform?.();
const safeName = (s) => (s || "script").replace(/[\\/:*?"<>|\s]+/g, "_").slice(0, 40);

async function saveOrShare(fileName, base64, mime) {
  if (isNative()) {
    const { Filesystem, Share } = window.Capacitor.Plugins;
    const r = await Filesystem.writeFile({ path: fileName, data: base64, directory: "CACHE" });
    await Share.share({ title: fileName, files: [r.uri] });
    return;
  }
  const a = document.createElement("a");
  a.href = `data:${mime};base64,${base64}`; a.download = fileName;
  document.body.appendChild(a); a.click(); a.remove();
}
const exportFailed = (e) => { if (!/cancel/i.test(String(e?.message))) toast(t("err.export", { msg: e.message || e })); };

async function exportPng(p) {
  toast(t("proj.makingPng"));
  const box = document.createElement("div");
  box.className = "poster export";
  document.body.appendChild(box);
  try {
    renderPoster(box, p);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const scale = box.scrollHeight > 6000 ? 1.25 : 2;
    const canvas = await window.html2canvas(box, { scale, backgroundColor: getComputedStyle(box).backgroundColor, logging: false });
    const b64 = canvas.toDataURL("image/png").split(",")[1];
    await saveOrShare(`${safeName(p.title)}_timeline.png`, b64, "image/png");
  } catch (e) { exportFailed(e); } finally { box.remove(); }
}

async function exportJson(p) {
  withTimes(p);
  const out = {
    title: p.title, unit: "seconds", logline: p.logline,
    lines: p.lines, acts: p.acts,
    scenes: p.scenes.map((s) => ({ id: s.id, heading: s.heading, start: s.start, duration: s.duration, line: s.line, title: s.title, summary: s.summary, role: s.role, cast: s.cast })),
    foreshadow: p.foreshadow, checks: p.checks, issues: p.issues,
  };
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(out, null, 2))));
  try { await saveOrShare(`${safeName(p.title)}_structure.json`, b64, "application/json"); } catch (e) { exportFailed(e); }
}

// ---------- 台词工坊 ----------
function trackLabel(b) {
  const f = findTrack(b.channel, b.track);
  if (f) return `${channelName(b.channel)}·${trackName(f.track.id)}`;
  return CHANNELS[b.channel] ? `${channelName(b.channel)}·${t("track.general")}` : t("track.none");
}

function trackOptions(channel, track) {
  const ch = CHANNELS[channel];
  if (!ch) return `<option value="">—</option>`;
  return `<option value="">${t("track.unset", { ch: esc(channelName(channel)) })}</option>` + ch.types.map((ty) => `<optgroup label="${esc(typeName(ty.name))}">${ty.tracks.map((k) => `<option value="${esc(k.id)}" ${k.id === track ? "selected" : ""}>${esc(trackName(k.id))}（${esc(t("trdesc." + k.id))}）</option>`).join("")}</optgroup>`).join("");
}
const langOptions = (sel) => LANGS.map(([c, n]) => `<option value="${c}" ${c === sel ? "selected" : ""}>${esc(n)}</option>`).join("");

function editBookMeta(b, preset = {}) {
  const isNew = !b;
  const d = b || { title: preset.title || "", genre: "script", channel: "nan", track: "", lang: getLang(), chars: [], passages: [], projectId: preset.projectId || "" };
  openSheet(`<h3>${isNew ? t("home.new") : t("book.meta")}</h3>
    <div class="field"><label for="bm-title">${t("book.name")}</label><input id="bm-title" value="${esc(d.title)}" placeholder="${esc(t("book.namePh"))}"></div>
    <div class="row2">
      <div class="field"><label for="bm-genre">${t("book.genre")}</label><select id="bm-genre">${Object.keys(GENRES).map((k) => `<option value="${k}" ${k === d.genre ? "selected" : ""}>${esc(t("genre." + k))}</option>`).join("")}</select></div>
      <div class="field"><label for="bm-lang">${t("book.lang")}</label><select id="bm-lang">${langOptions(d.lang)}</select></div>
    </div>
    <div class="row2">
      <div class="field"><label for="bm-ch">${t("book.channel")}</label><select id="bm-ch">${Object.keys(CHANNELS).map((k) => `<option value="${k}" ${k === d.channel ? "selected" : ""}>${esc(channelName(k))}</option>`).join("")}<option value="" ${d.channel ? "" : "selected"}>${t("track.none")}</option></select></div>
      <div class="field"><label for="bm-tr">${t("book.track")}</label><select id="bm-tr">${trackOptions(d.channel, d.track)}</select></div>
    </div>
    <p class="hint">${t("book.trackHint")}</p>
    <div class="btns"><button class="btn primary" id="bm-ok">${isNew ? t("common.create") : t("common.save")}</button><button class="btn" id="bm-cancel">${t("common.cancel")}</button></div>`);
  $("#bm-ch").onchange = (e) => ($("#bm-tr").innerHTML = trackOptions(e.target.value, ""));
  $("#bm-cancel").onclick = closeSheet;
  $("#bm-ok").onclick = () => {
    d.title = $("#bm-title").value.trim() || t("book.untitled");
    d.genre = $("#bm-genre").value; d.lang = $("#bm-lang").value; d.channel = $("#bm-ch").value; d.track = $("#bm-tr").value;
    if (isNew) d.id = newId();
    if (!saveBook(d)) return;
    closeSheet();
    if (isNew) go("#/b/" + d.id); else refreshBook(d);
  };
}

function editChars(b) {
  const row = (c) => `<div class="edrow ch-e"><div class="field"><label>${t("char.name")}</label><input class="cn" value="${esc(c.name)}"></div><div class="field"><label>${t("char.role")}</label><input class="cr" value="${esc(c.role)}" placeholder="${esc(t("char.rolePh"))}"></div><button class="btn danger rm" type="button" aria-label="${esc(t("common.delete"))}">×</button><div class="field span"><label>${t("char.voice")}</label><input class="cv" value="${esc(c.voice)}" placeholder="${esc(t("char.voicePh"))}"></div></div>`;
  openSheet(`<h3>${t("char.title")}</h3><p class="hint">${t("char.hint")}</p>
    <div id="ch-list" class="stack">${(b.chars.length ? b.chars : [{ name: "", role: "", voice: "" }]).map(row).join("")}</div>
    <button class="btn" id="ch-add" type="button">${t("char.add")}</button>
    ${saveCancel("ch-save", "ch-cancel")}`);
  const sh = $("#sheet");
  sh.addEventListener("click", (e) => { if (e.target.classList.contains("rm")) e.target.closest(".edrow").remove(); });
  $("#ch-add").onclick = () => $("#ch-list").insertAdjacentHTML("beforeend", row({ name: "", role: "", voice: "" }));
  $("#ch-cancel").onclick = closeSheet;
  $("#ch-save").onclick = () => {
    b.chars = [...sh.querySelectorAll(".ch-e")].map((r) => ({ name: $(".cn", r).value.trim(), role: $(".cr", r).value.trim(), voice: $(".cv", r).value.trim() })).filter((c) => c.name);
    saveBook(b); closeSheet(); refreshBook(b); toast(t("common.saved"));
  };
}

// AI 调用期间锁住界面；失败时把原因留在面板里
async function withBusy(msg, fn) {
  if (busy) return false;
  if (!hasKey()) { toast(t("err.needKey")); return false; }
  busy = true;
  openSheet(`<div class="center"><div class="spin"></div><p>${esc(msg)}</p><p class="hint">${esc(aiName())}</p></div>`, { lock: true });
  try { await fn(); closeSheet(); return true; }
  catch (e) {
    openSheet(`<h3>${t("err.notDone")}</h3><div class="notice err">${esc(e.message || String(e))}</div><div class="btns"><button class="btn" id="e-close">${t("common.close")}</button><button class="btn" id="e-set">${t("common.checkSettings")}</button></div>`);
    $("#e-close").onclick = closeSheet; $("#e-set").onclick = () => go("#/settings");
    return false;
  } finally { busy = false; }
}

let pendingScroll = null;
function refreshBook(b) { const y = window.scrollY; showBook(b.id); window.scrollTo(0, y); }

function itemHtml(b, it, pi, j) {
  const at = `data-it="${pi}:${j}" role="button" tabindex="0"`;
  const f = formatItem(it, b.genre, b.lang);
  if (it.t === "act") return `<p class="dl act-l" ${at}>${esc(f.text)}</p>`;
  return `<p class="dl" ${at}>${f.parts.map(([k, s]) => (k === "who" ? `<b>${esc(s)}</b>` : k === "cue" ? `<i>${esc(s)}</i>` : esc(s))).join("")}</p>`;
}

function reviewHtml(p, pi) {
  const rv = p.review;
  return `<div class="rv"><div class="rvh"><b class="score">${rv.score}</b><span>${esc(rv.verdict)}</span></div>
    ${rv.good.length ? `<p class="hint">${t("rv.good")}${rv.good.map(esc).join("；")}</p>` : ""}
    ${rv.issues.length ? `<ol class="issues">${rv.issues.map((x, k) => `<li><b>${x.n ? t("rv.itemN", { n: x.n }) + " · " : ""}${esc(x.rule)}</b> ${esc(x.problem)}${x.fix ? `<br><span class="fix">${t("rv.fix")}${esc(x.fix)}</span>` : ""}${x.n && p.items[x.n - 1] ? ` <button class="lnk" data-fix="${pi}:${k}">${t("rv.applyFix")}</button>` : ""}</li>`).join("")}</ol>` : `<p class="hint">${t("rv.clean")}</p>`}</div>`;
}

function passageHtml(b, p, i) {
  return `<section class="panel psg" id="psg-${p.id}">
    <div class="phd"><h2>${i + 1}. ${esc(p.title || t("book.untitledPassage"))}</h2><small>${t("book.nLines", { n: p.items.filter((x) => x.t === "line").length })}</small></div>
    ${p.beats ? `<p class="hint">${t("book.beats")}${esc(p.beats)}</p>` : ""}
    <div class="dlg ${b.genre}" dir="${b.lang === "ar" ? "rtl" : "auto"}">${p.items.map((it, j) => itemHtml(b, it, i, j)).join("")}</div>
    ${p.hook ? `<p class="hook">${t("book.hook")}${esc(p.hook)}</p>` : ""}
    ${p.review ? reviewHtml(p, i) : ""}
    <div class="btns sm"><button class="btn" data-act="review" data-p="${i}" ${hasKey() ? "" : "disabled"}>${p.review ? t("book.reReview") : t("book.review")}</button><button class="btn" data-act="cont" data-p="${i}">${t("book.continue")}</button><button class="btn" data-act="copy" data-p="${i}">${t("common.copy")}</button><button class="btn" data-act="up" data-p="${i}" ${i ? "" : "disabled"}>${t("book.up")}</button><button class="btn danger" data-act="del" data-p="${i}">${t("common.delete")}</button></div>
  </section>`;
}

function showBook(id) {
  const b = loadBook(id);
  if (!b) return go("#/");
  setBar(b.title || t("book.untitled"), true);
  const chars = b.chars.filter((c) => c.name);
  const any = b.passages.length ? "" : "disabled";
  view.innerHTML = `<div class="toolbar">
      <button class="btn primary" id="b-write">${t("book.writeNew")}</button>
      <button class="btn" id="b-chars">${t("book.chars", { n: chars.length })}</button>
      <button class="btn" id="b-meta">${t("book.meta")}</button>
      <button class="btn" id="b-copy" ${any}>${t("book.copyAll")}</button>
      <button class="btn" id="b-txt" ${any}>${t("book.exportTxt")}</button>
    </div>
    <p class="hint bmeta">${esc(t("genre." + b.genre))} · ${esc(trackLabel(b))} · ${esc(LANGS.find((l) => l[0] === b.lang)?.[1] || "")}${hasKey() ? " · " + esc(aiName()) : ""} · ${t("book.tapHint")}</p>
    ${keyNotice()}
    ${chars.length ? `<div class="cast">${chars.map((c) => `<span><b>${esc(c.name)}</b>${esc(c.role)}</span>`).join("")}</div>`
      : `<div class="notice">${t("book.addCharsFirst")}<div class="btns" style="margin-top:8px"><button class="btn" id="b-chars2">${t("char.add")}</button></div></div>`}
    <div class="stack" id="psgs" style="margin-top:14px">${b.passages.length ? b.passages.map((p, i) => passageHtml(b, p, i)).join("")
      : `<p class="hint">${t("book.empty")}</p>`}</div>`;
  $("#b-write").onclick = () => go(`#/b/${id}/write`);
  $("#b-chars").onclick = () => editChars(b);
  if ($("#b-chars2")) $("#b-chars2").onclick = () => editChars(b);
  $("#b-meta").onclick = () => editBookMeta(b);
  $("#b-copy").onclick = () => copyText(formatBook(b));
  $("#b-txt").onclick = () => exportBookTxt(b);
  const psgs = $("#psgs");
  psgs.onkeydown = (e) => { if (e.key === "Enter" && e.target.dataset.it) e.target.click(); };
  psgs.onclick = async (e) => {
    const it = e.target.closest("[data-it]");
    if (it) { const [pi, j] = it.dataset.it.split(":").map(Number); return editItem(b, pi, j); }
    const fx = e.target.closest("[data-fix]");
    if (fx) {
      const [pi, k] = fx.dataset.fix.split(":").map(Number);
      const x = b.passages[pi].review.issues[k];
      return aiRewrite(b, pi, x.n - 1, `${x.rule}：${x.problem}。${x.fix}`);
    }
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const pi = +btn.dataset.p, p = b.passages[pi];
    if (btn.dataset.act === "review") {
      if (await withBusy(t("busy.review"), async () => { p.review = await review(ai(), b, p, getLang()); })) { saveBook(b); refreshBook(b); }
    } else if (btn.dataset.act === "cont") go(`#/b/${id}/write/${p.id}`);
    else if (btn.dataset.act === "copy") copyText(formatPassage(p, b.genre, b.lang));
    else if (btn.dataset.act === "up") { b.passages.splice(pi - 1, 0, b.passages.splice(pi, 1)[0]); saveBook(b); refreshBook(b); }
    else if (btn.dataset.act === "del") confirmSheet(t("book.confirmDelPassage", { title: p.title || "" }), t("common.delete"), () => { b.passages.splice(pi, 1); saveBook(b); refreshBook(b); });
  };
  if (pendingScroll) { const el = $("#psg-" + pendingScroll); pendingScroll = null; if (el) requestAnimationFrame(() => el.scrollIntoView({ block: "start" })); }
}

function editItem(b, pi, j) {
  const p = b.passages[pi], it = p.items[j];
  const names = b.chars.filter((c) => c.name).map((c) => c.name);
  const actName = t(b.genre === "novel" ? "item.narration" : "item.action");
  openSheet(`<h3>${t("item.title", { n: j + 1, kind: it.t === "act" ? actName : t("item.line") })}</h3>
    ${it.t === "line" ? `<div class="row2"><div class="field"><label for="ei-who">${t("item.who")}</label><input id="ei-who" list="ei-names" value="${esc(it.who)}"><datalist id="ei-names">${names.map((n) => `<option value="${esc(n)}">`).join("")}</datalist></div><div class="field"><label for="ei-cue">${t(b.genre === "novel" ? "item.cueNovel" : "item.cueScript")}</label><input id="ei-cue" value="${esc(it.cue)}"></div></div>` : ""}
    <div class="field"><label for="ei-text">${t("item.text")}</label><textarea id="ei-text" dir="auto">${esc(it.text)}</textarea></div>
    ${saveCancel("ei-save", "ei-cancel")}
    <h3>${t("item.aiTitle")}</h3>
    <div class="chips">${["sharper", "shorter", "subtext", "casual", "subtle", "inChar"].map((k) => `<button class="chip-b" type="button" data-ask="${esc(t("ask." + k))}">${t("ask." + k)}</button>`).join("")}</div>
    <div class="field"><label for="ei-ask">${t("item.askLabel")}</label><input id="ei-ask" placeholder="${esc(t("item.askPh"))}"></div>
    <div class="btns"><button class="btn" id="ei-ai" ${hasKey() ? "" : "disabled"}>${t("item.give3")}</button></div>
    <h3>${t("item.other")}</h3>
    <div class="btns"><button class="btn" id="ei-addl">${t("item.addLine")}</button><button class="btn" id="ei-adda">${t("item.addAct", { kind: actName })}</button><button class="btn danger" id="ei-del">${t("item.del")}</button></div>`);
  $("#sheet").querySelectorAll("[data-ask]").forEach((c) => (c.onclick = () => { const a = $("#ei-ask"); a.value = a.value ? a.value + ", " + c.dataset.ask : c.dataset.ask; }));
  const keep = () => {
    if (it.t === "line") { it.who = $("#ei-who").value.trim() || it.who; it.cue = $("#ei-cue").value.trim(); }
    it.text = $("#ei-text").value.trim() || it.text;
  };
  $("#ei-cancel").onclick = closeSheet;
  $("#ei-save").onclick = () => { keep(); saveBook(b); closeSheet(); refreshBook(b); };
  $("#ei-ai").onclick = () => { keep(); saveBook(b); aiRewrite(b, pi, j, $("#ei-ask").value.trim()); };
  const insert = (kind) => {
    keep();
    p.items.splice(j + 1, 0, kind === "line" ? { t: kind, who: it.t === "line" ? it.who : names[0] || "", cue: "", text: t("item.newLine") } : { t: kind, who: "", cue: "", text: t("item.newAct") });
    p.review = null; saveBook(b); refreshBook(b); editItem(b, pi, j + 1);
  };
  $("#ei-addl").onclick = () => insert("line");
  $("#ei-adda").onclick = () => insert("act");
  $("#ei-del").onclick = () => { p.items.splice(j, 1); p.review = null; saveBook(b); closeSheet(); refreshBook(b); };
}

async function aiRewrite(b, pi, j, ask) {
  const p = b.passages[pi];
  let opts;
  if (!(await withBusy(t("busy.rewrite", { n: j + 1 }), async () => { opts = await rewrite(ai(), b, p, j, ask); }))) return;
  const it = p.items[j];
  openSheet(`<h3>${t("opt.title", { n: j + 1 })}</h3><p class="hint">${t("opt.orig")}${esc(it.text)}</p>
    <div class="opts" dir="auto">${opts.map((o, k) => `<button class="opt" type="button" data-o="${k}">${esc(formatItem({ ...it, cue: o.cue, text: o.text }, b.genre, b.lang).text)}</button>`).join("")}</div>
    <div class="btns"><button class="btn" id="op-again">${t("opt.again")}</button><button class="btn" id="op-cancel">${t("opt.keep")}</button></div>`);
  $("#sheet").querySelectorAll("[data-o]").forEach((el) => (el.onclick = () => {
    const o = opts[+el.dataset.o];
    it.text = o.text; if (it.t === "line") it.cue = o.cue;
    p.review = null; saveBook(b); closeSheet(); refreshBook(b); toast(t("opt.replaced"));
  }));
  $("#op-again").onclick = () => aiRewrite(b, pi, j, ask);
  $("#op-cancel").onclick = closeSheet;
}

function showWrite(id, pid) {
  const b = loadBook(id);
  if (!b) return go("#/");
  const prev = pid ? b.passages.find((x) => x.id === pid) : null;
  if (pid && !prev) return go("#/b/" + id);
  setBar(prev ? t("book.continue") : t("book.writeNew"), true);
  const last = b.passages[b.passages.length - 1];
  const before = prev || !last ? "" : t("write.prevAuto", { title: last.title, hook: last.hook || "" });
  const projects = listProjects();
  view.innerHTML = `<div class="stack">
    ${keyNotice()}
    ${projects.length && !prev ? `<div class="panel"><h2>${t("write.importTitle")}</h2>
      <div class="row2"><div class="field"><label for="w-proj">${t("write.script")}</label><select id="w-proj"><option value="">${t("write.noImport")}</option>${projects.map((x) => `<option value="${x.id}" ${x.id === b.projectId ? "selected" : ""}>${esc(x.title || t("st.untitled"))}</option>`).join("")}</select></div>
      <div class="field"><label for="w-scene">${t("write.scene")}</label><select id="w-scene" disabled></select></div></div>
      <p class="hint">${t("write.importHint")}</p></div>` : ""}
    <div class="panel">
      ${prev ? `<p class="hint">${t("write.contHint", { title: esc(prev.title) })}</p>` : ""}
      <div class="field"><label for="w-before">${t("write.before")}</label><textarea id="w-before" dir="auto" placeholder="${esc(t("write.beforePh"))}">${esc(before)}</textarea></div>
      <div class="field"><label for="w-what">${prev ? t("write.whatNext") : t("write.what")}</label><textarea id="w-what" class="tall" dir="auto" placeholder="${esc(t("write.whatPh"))}">${prev ? esc(prev.hook || "") : ""}</textarea></div>
      <div class="field"><label>${t("write.goals")}</label><div class="chips">${GOALS.map((g) => `<label class="chip-c"><input type="checkbox" value="${g}">${esc(t("goal." + g))}</label>`).join("")}</div></div>
      <div class="row2">
        <div class="field"><label for="w-len">${t("write.len")}</label><select id="w-len">${LENGTHS.map((n) => `<option value="${n}" ${n === 15 ? "selected" : ""}>${t("write.lenN", { n })}</option>`).join("")}</select></div>
        <div class="field"><label for="w-style">${t("write.style")}</label><input id="w-style" dir="auto" placeholder="${esc(t("write.stylePh"))}"></div>
      </div>
      <div class="btns"><button class="btn primary" id="w-go" ${hasKey() ? "" : "disabled"}>${prev ? t("book.continue") : t("write.go")}</button><button class="btn" id="w-chars">${t("book.chars", { n: b.chars.filter((c) => c.name).length })}</button></div>
      <p class="hint">${esc(t("genre." + b.genre))} · ${esc(trackLabel(b))} · ${esc(LANGS.find((l) => l[0] === b.lang)?.[1] || "")}${hasKey() ? " · " + esc(aiName()) : ""}</p>
    </div></div>`;
  $("#w-chars").onclick = () => editChars(b);
  const ps = $("#w-proj"), ss = $("#w-scene");
  if (ps) {
    const loadScenes = () => {
      const p = ps.value && loadProject(ps.value);
      ss.disabled = !p;
      ss.innerHTML = p ? `<option value="">${t("write.pickScene")}</option>` + p.scenes.map((s) => `<option value="${s.id}">${esc(`${s.id}. ${s.title || ""} ${s.heading}`.slice(0, 40))}</option>`).join("") : "";
    };
    ps.onchange = loadScenes; loadScenes();
    ss.onchange = () => {
      const p = loadProject(ps.value), s = p?.scenes.find((x) => x.id === +ss.value);
      if (!s) return;
      const i = p.scenes.indexOf(s);
      $("#w-what").value = `${t("common.sceneN", { n: s.id })} ${s.heading}\n${s.summary ? t("write.impSummary") + s.summary + "\n" : ""}${s.role ? t("write.impRole") + s.role + "\n" : ""}${t("write.impText")}\n${(s.text || "").slice(0, 1500)}`;
      $("#w-before").value = p.scenes.slice(Math.max(0, i - 2), i).map((x) => `${t("common.sceneN", { n: x.id })} ${x.title || x.heading}: ${x.summary || (x.text || "").slice(0, 80)}`).join("\n");
      const have = new Set(b.chars.map((c) => c.name));
      const add = (s.cast || []).filter((n) => n && !have.has(n));
      b.projectId = p.id;
      if (add.length) { b.chars.push(...add.map((name) => ({ name, role: "", voice: "" }))); toast(t("write.castAdded", { names: add.join(", ") })); $("#w-chars").textContent = t("book.chars", { n: b.chars.length }); }
      saveBook(b);
    };
  }
  $("#w-go").onclick = async () => {
    const brief = {
      before: $("#w-before").value.trim(), what: $("#w-what").value.trim(),
      goals: [...view.querySelectorAll(".chip-c input:checked")].map((x) => x.value),
      count: +$("#w-len").value, style: $("#w-style").value.trim(),
    };
    if (!brief.what) return toast(t("write.needWhat"));
    let r;
    if (!(await withBusy(prev ? t("busy.continue") : t("busy.write"), async () => { r = await generate(ai(), b, brief, { prev }); }))) return;
    let target;
    if (prev) { prev.items.push(...r.items); prev.hook = r.hook || prev.hook; prev.review = null; target = prev.id; }
    else { const p = { id: newId(), title: r.title || t("book.passageN", { n: b.passages.length + 1 }), beats: r.beats, hook: r.hook, items: r.items, brief, createdAt: Date.now() }; b.passages.push(p); target = p.id; }
    if (!saveBook(b)) return;
    pendingScroll = target;
    location.replace(`#/b/${id}`);
  };
}

async function copyText(s) {
  try { await navigator.clipboard.writeText(s); toast(t("common.copied")); return; } catch {}
  const ta = document.createElement("textarea");
  ta.value = s; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  let ok = false; try { ok = document.execCommand("copy"); } catch {}
  ta.remove(); toast(ok ? t("common.copied") : t("err.copy"));
}

async function exportBookTxt(b) {
  const b64 = btoa(unescape(encodeURIComponent(formatBook(b))));
  try { await saveOrShare(`${safeName(b.title)}_dialogue.txt`, b64, "text/plain"); } catch (e) { exportFailed(e); }
}

// ---------- 支持作者 ----------
function showSupport() {
  setBar(t("sup.title"), true);
  view.innerHTML = `<div class="stack">
    <div class="panel sup">
      <h2>${t("sup.title")}</h2>
      <p>${t("sup.desc")}</p>
      <img src="img/support-qr.png" alt="${esc(t("sup.qrAlt"))}" class="qr">
      <div class="btns"><button class="btn primary" id="sup-save">${t("sup.save")}</button></div>
      <p class="hint">${t("sup.note")}</p>
    </div></div>`;
  $("#sup-save").onclick = async () => {
    try {
      const blob = await (await fetch("img/support-qr.png")).blob();
      const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1]); r.onerror = rej; r.readAsDataURL(blob); });
      await saveOrShare("support-qr.png", b64, "image/png");
    } catch (e) { exportFailed(e); }
  };
}

// ---------- 版本更新 ----------
let updateInfo = store.get("stl.update", null);
function renderUpdateBanner() {
  const el = $("#update");
  const u = updateInfo && newerThan(updateInfo.version, VERSION) && store.get("stl.updateSkip", "") !== updateInfo.version ? updateInfo : null;
  el.hidden = !u;
  if (!u) return;
  el.innerHTML = `<div><b>${t("upd.found", { v: esc(u.version) })}</b>${u.notes ? `<span>${esc(u.notes[getLang()] || u.notes.en || u.notes["zh-CN"] || "")}</span>` : ""}</div><div class="btns"><button class="btn primary" id="upd-go">${t("upd.download")}</button><button class="btn" id="upd-later">${t("upd.later")}</button></div>`;
  $("#upd-go").onclick = () => openDownload(u);
  $("#upd-later").onclick = () => { store.set("stl.updateSkip", u.version); renderUpdateBanner(); };
}
function openDownload(u) {
  toast(t("upd.opening"));
  // App 内跳转到外部网址时，系统会用浏览器打开并下载
  location.href = u.apk || u.page;
}
async function runUpdateCheck(manual) {
  try {
    const u = await checkUpdate();
    store.set("stl.updateAt", Date.now());
    if (u) { updateInfo = u; store.set("stl.update", u); }
    if (manual) {
      if (u && newerThan(u.version, VERSION)) { store.set("stl.updateSkip", ""); renderUpdateBanner(); window.scrollTo(0, 0); }
      else toast(t("upd.latest", { v: VERSION }));
    } else renderUpdateBanner();
  } catch (e) { if (manual) toast(t("upd.failed")); }
}

// ---------- 设置 ----------
function showSettings() {
  setBar(t("tab.settings"), false);
  const cur = settings.keys[settings.provider];
  const r = settings.rates;
  view.innerHTML = `<div class="stack">
    <div class="panel"><h2>${t("set.language")}</h2>
      <div class="field"><label for="s-lang">${t("set.uiLang")}</label><select id="s-lang">${langOptions(getLang())}</select></div>
      <p class="hint">${t("set.langHint")}</p>
    </div>
    <div class="panel"><h2>${t("set.ai")}</h2>
      <div class="field"><label for="s-prov">${t("set.current")}</label><select id="s-prov">${PROVIDER_ORDER.map((k) => `<option value="${k}" ${k === settings.provider ? "selected" : ""}>${esc(pname(k))}${settings.keys[k].apiKey ? " · " + t("set.hasKey") : ""}</option>`).join("")}</select></div>
      <p class="hint" id="s-hint">${t("keyhint." + settings.provider)}</p>
      <div class="field"><label for="s-url">${t("set.url")}</label><input id="s-url" value="${esc(cur.baseUrl)}" autocomplete="off" autocapitalize="off" spellcheck="false" dir="ltr"></div>
      <div class="field"><label for="s-model">${t("set.model")}</label><input id="s-model" list="s-models" value="${esc(cur.model)}" autocapitalize="off" spellcheck="false" dir="ltr"><datalist id="s-models">${PROVIDERS[settings.provider].models.map((m) => `<option value="${esc(m)}">`).join("")}</datalist></div>
      <div class="field"><label for="s-key">API Key</label><input id="s-key" type="password" value="${esc(cur.apiKey)}" autocomplete="off" autocapitalize="off" spellcheck="false" dir="ltr" placeholder="${esc(t("set.keyPh"))}"></div>
      <label class="hint"><input type="checkbox" id="s-show"> ${t("set.showKey")}</label>
      <div class="btns"><button class="btn primary" id="s-save">${t("common.save")}</button><button class="btn" id="s-test">${t("set.test")}</button><button class="btn" id="s-list">${t("set.listModels")}</button></div>
      <p class="hint" id="s-res" aria-live="polite"></p>
      <p class="hint">${t("set.keyNote")}</p>
    </div>
    <div class="panel"><h2>${t("set.rates")}</h2>
      <p class="hint">${t("set.ratesHint")}</p>
      <div class="row2">
        <div class="field"><label for="r-base">${t("set.rBase")}</label><input id="r-base" type="number" step="1" value="${r.base}"></div>
        <div class="field"><label for="r-act">${t("set.rAct")}</label><input id="r-act" type="number" step="0.01" value="${r.action}"></div>
        <div class="field"><label for="r-dia">${t("set.rDia")}</label><input id="r-dia" type="number" step="0.01" value="${r.dialogue}"></div>
        <div class="field"><label for="r-line">${t("set.rLine")}</label><input id="r-line" type="number" step="0.1" value="${r.perLine}"></div>
      </div>
      <div class="btns"><button class="btn" id="r-save">${t("common.save")}</button><button class="btn" id="r-reset">${t("set.reset")}</button></div>
    </div>
    <div class="panel"><h2>${t("set.about")}</h2>
      <p class="hint">${t("set.aboutText", { v: VERSION })}</p>
      <div class="btns"><button class="btn" id="s-upd">${t("set.checkUpdate")}</button><a class="btn" href="#/support">${t("sup.title")}</a></div>
    </div>
  </div>`;
  $("#s-lang").onchange = (e) => { setLang(e.target.value); route(); toast(t("common.saved")); };
  // 表单里正在编辑的各家配置；切换下拉框时先把当前这家的输入暂存
  const edits = JSON.parse(JSON.stringify(settings.keys));
  let shown = settings.provider;
  const stash = () => { edits[shown] = { baseUrl: $("#s-url").value.trim(), model: $("#s-model").value.trim(), apiKey: $("#s-key").value.trim() }; };
  const fillModels = (ids) => ($("#s-models").innerHTML = ids.map((m) => `<option value="${esc(m)}">`).join(""));
  $("#s-prov").onchange = (e) => {
    stash();
    shown = e.target.value;
    const v = PROVIDERS[shown], c = edits[shown];
    $("#s-hint").textContent = t("keyhint." + shown);
    $("#s-url").value = c.baseUrl || v.baseUrl; $("#s-model").value = c.model || v.models[0]; $("#s-key").value = c.apiKey || "";
    fillModels(v.models);
    $("#s-res").textContent = "";
  };
  $("#s-show").onchange = (e) => ($("#s-key").type = e.target.checked ? "text" : "password");
  const current = () => { stash(); return { provider: shown, ...edits[shown] }; };
  $("#s-save").onclick = () => {
    stash();
    for (const k of PROVIDER_ORDER) settings.keys[k] = { ...edits[k], baseUrl: edits[k].baseUrl || PROVIDERS[k].baseUrl, model: edits[k].model || PROVIDERS[k].models[0] };
    settings.provider = shown;
    saveSettings(); toast(t("set.savedUsing", { name: pname(shown) }));
    if (draft) go("#/parsed");
  };
  $("#s-test").onclick = async () => {
    const res = $("#s-res"); res.textContent = t("set.testing");
    try { const s = await testConnection(current()); res.textContent = t("set.testOk", { reply: s.slice(0, 20) }); }
    catch (e) { res.textContent = e.message || String(e); }
  };
  $("#s-list").onclick = async () => {
    const res = $("#s-res"); res.textContent = t("set.listing");
    try {
      const ids = await listModels(current());
      if (!ids.length) { res.textContent = t("set.listNone"); return; }
      fillModels(ids);
      res.textContent = t("set.listFound", { n: ids.length, ids: ids.slice(0, 8).join(", ") + (ids.length > 8 ? "…" : "") });
    } catch (e) { res.textContent = e.message || String(e); }
  };
  $("#r-save").onclick = () => {
    settings.rates = { base: +$("#r-base").value || 0, action: +$("#r-act").value || 0, dialogue: +$("#r-dia").value || 0, perLine: +$("#r-line").value || 0 };
    saveSettings(); toast(t("common.saved"));
  };
  $("#r-reset").onclick = () => { $("#r-base").value = DEFAULT_RATES.base; $("#r-act").value = DEFAULT_RATES.action; $("#r-dia").value = DEFAULT_RATES.dialogue; $("#r-line").value = DEFAULT_RATES.perLine; };
  $("#s-upd").onclick = () => runUpdateCheck(true);
}

route();
// 启动后静默检查更新，最多每 12 小时一次
if (Date.now() - store.get("stl.updateAt", 0) > 12 * 3600e3) setTimeout(() => runUpdateCheck(false), 1500);
