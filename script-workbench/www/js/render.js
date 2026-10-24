// 结构时间线渲染：项目数据 → 版面
export const fmt = (x) => {
  const m = Math.floor(x / 60), s = Math.round(x % 60);
  return m + "'" + String(s).padStart(2, "0") + '"';
};
import { t } from "./i18n.js";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function withTimes(p) {
  let t = 0;
  p.scenes.forEach((s) => { s.start = t; t += s.duration; });
  return t;
}

export function lineColor(p, key) {
  const i = Math.max(0, p.lines.findIndex((l) => l.key === key));
  return { c: `var(--l${i % 6})`, s: `var(--l${i % 6}s)` };
}

export function renderPoster(root, p, { editable = false } = {}) {
  const TOT = withTimes(p) || 1;
  const pct = (x) => (x / TOT) * 100 + "%";
  const byId = (n) => p.scenes.find((s) => s.id === n);
  const mid = (n) => { const s = byId(n); return s ? s.start + s.duration / 2 : 0; };

  const legend = p.lines.map((l) => { const c = lineColor(p, l.key); return `<span><i style="background:${c.c}"></i>${esc(l.key)} ${esc(l.name)}${l.desc ? `（${esc(l.desc)}）` : ""}</span>`; }).join("");

  let tl = "";
  tl += `<div class="row acts"><div class="lab">${t("poster.acts")}</div><div class="track">`;
  p.acts.forEach((a) => {
    const f = byId(a.from), t = byId(a.to); if (!f || !t) return;
    const st = f.start, en = t.start + t.duration;
    tl += `<div class="act" style="left:${pct(st)};width:${pct(en - st)}"><b>${esc(a.name)}</b><span>S${a.from}–${a.to}${a.desc ? " · " + esc(a.desc) : ""} · ${fmt(st)}–${fmt(en)}</span></div>`;
  });
  tl += `</div></div>`;
  p.lines.forEach((l) => {
    const c = lineColor(p, l.key);
    tl += `<div class="row labels"><div class="lab"></div><div class="track" data-line="${esc(l.key)}"></div></div>`;
    tl += `<div class="row lane"><div class="lab" style="color:${c.c}">${esc(l.key)} ${esc(l.name)}</div><div class="track">`;
    p.scenes.filter((s) => s.line === l.key).forEach((s) => {
      tl += `<div class="blk" data-id="${s.id}" title="S${s.id} ${esc(s.title)}" style="left:${pct(s.start)};width:${pct(s.duration)};background:${c.c}">${s.duration / TOT > 0.018 ? s.id : ""}</div>`;
    });
    tl += `</div></div>`;
  });
  tl += `<div class="row axis"><div class="lab"></div><div class="track">`;
  const step = TOT > 3600 ? 10 : TOT > 1800 ? 5 : TOT > 600 ? 2 : 1;
  for (let m = 0; m * 60 < TOT - 30; m += step) tl += `<div class="tick" style="left:${pct(m * 60)}">${m}'</div>`;
  tl += `<div class="tick end" style="left:100%">${fmt(TOT)}</div></div></div>`;
  if (p.foreshadow.length) {
    tl += `<div class="fs">`;
    p.foreshadow.forEach((f) => {
      const ids = f.scenes.filter(byId); if (ids.length < 2) return;
      const xs = ids.map(mid);
      tl += `<div class="row"><div class="lab">${esc(f.name)}</div><div class="track"><div class="fline" style="left:${pct(Math.min(...xs))};width:${pct(Math.max(...xs) - Math.min(...xs))}"></div>`;
      ids.forEach((a, i) => { const cls = i === 0 ? "" : i === ids.length - 1 ? "end" : "mid"; tl += `<div class="dot ${cls}" style="left:${pct(mid(a))}"><span>${a}</span></div>`; });
      tl += `</div></div>`;
    });
    tl += `</div>`;
  }

  const fsList = p.foreshadow.map((f) => {
    const ids = f.scenes.filter(byId);
    return `<div><b>${esc(f.name)}</b><span>${ids.map((a, i) => (i === 0 ? "○" : i === ids.length - 1 ? "●" : "") + "S" + a + " " + esc(byId(a).title)).join(" → ")}</span></div>`;
  }).join("");

  const cols = p.lines.map((l) => {
    const c = lineColor(p, l.key);
    const list = p.scenes.filter((s) => s.line === l.key);
    const sum = list.reduce((a, s) => a + s.duration, 0);
    return `<div class="col"><h3 style="color:${c.c}">${esc(l.key)} ${esc(l.name)}<small>${t("st.nScenes", { n: list.length })} · ${fmt(sum)} · ${Math.round((sum / TOT) * 100)}%</small></h3><div class="cards">` +
      list.map((s) => `<div class="card${editable ? " tap" : ""}" data-id="${s.id}" style="background:${c.s}"><div class="t"><em style="background:${c.c}">S${s.id}</em><b>${esc(s.title)}</b><span>${fmt(s.start)}–${fmt(s.start + s.duration)}</span></div>${s.summary ? `<p>${esc(s.summary)}</p>` : `<p class="dim">${esc(s.heading)}</p>`}${s.role ? `<div class="n">↳ ${esc(s.role)}</div>` : ""}</div>`).join("") +
      `</div></div>`;
  }).join("");

  const checks = (p.checks || []).map((c, i) => `<div><i>${i + 1}</i><b>${esc(c.title)}</b><p>${esc(c.text)}</p></div>`).join("");
  const issues = (p.issues || []).length ? `<p class="foot">${t("poster.issues")}${p.issues.map(esc).join("；")}</p>` : "";

  root.innerHTML = `
  <header class="phead">
    <div><h1>${t("poster.title", { title: esc(p.title || t("st.untitled")) })}</h1>
    <div class="meta">${t("poster.meta", { n: p.scenes.length, total: fmt(TOT), l: p.lines.length })}</div></div>
    <div class="legend">${legend}</div>
  </header>
  ${p.logline ? `<section class="logline"><b>${t("struct.logline")}</b><p>${esc(p.logline)}</p></section>` : ""}
  <section><h2>${t("poster.timeline")} <small>${t("poster.timelineHint")}${editable ? t("poster.tapEdit") : ""}</small></h2>
    <div class="scroll"><div class="tl">${tl}</div></div></section>
  ${fsList ? `<section><h2>${t("poster.fs")} <small>${t("poster.fsHint")}</small></h2><div class="fsgrid">${fsList}</div></section>` : ""}
  <section><h2>${t("poster.index")} <small>${t("poster.indexHint")}</small></h2><div class="cols">${cols}</div></section>
  ${checks ? `<section><h2>${t("poster.checks")}</h2><div class="check">${checks}</div></section>` : ""}
  ${issues}`;
  placeLabels(root, p, TOT);
}

export function placeLabels(root, p, TOT) {
  root.querySelectorAll(".labels .track").forEach((tr) => {
    const k = tr.dataset.line, W = tr.offsetWidth, c = lineColor(p, k);
    if (!W) return;
    tr.innerHTML = "";
    const rows = [];
    p.scenes.filter((s) => s.line === k).forEach((s) => {
      const x = (s.start / TOT) * W;
      const el = document.createElement("div");
      el.className = "chip"; el.style.left = x + "px"; el.style.color = c.c;
      el.innerHTML = `<em style="background:${c.c}">S${s.id}</em><span>${esc(s.title)}</span>`;
      tr.appendChild(el);
      const w = el.offsetWidth; let r = 0;
      while (rows[r] !== undefined && rows[r] > x - 4) r++;
      rows[r] = x + w; el.dataset.r = r;
    });
    const n = rows.length; tr.style.height = n * 20 + 4 + "px";
    tr.querySelectorAll(".chip").forEach((el) => { const r = +el.dataset.r; el.style.top = r * 20 + "px"; el.style.setProperty("--drop", (n - r - 1) * 20 + 4 + "px"); });
  });
}
