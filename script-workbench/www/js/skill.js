// 短剧编剧知识库：内置「女频男频短剧编剧 skill」的规则文件，按频道/赛道摘出相关章节喂给 AI
// 原文件在 skill/nan、skill/nv 下，未做改动。

import { t } from "./i18n.js";

// 界面显示名（数据里的 id 仍用中文）
export const channelName = (k) => t("ch." + k);
export const typeName = (name) => t("type." + name);
export const trackName = (id) => t("tr." + id);

const FILES = ["ticai-yurenshe.md", "jiegou-kuangjia.md", "shuangdian-sheji.md", "luoji-jiaoyan-qingdan.md"];

export const CHANNELS = {
  nan: {
    name: "男频",
    dir: "skill/nan",
    types: [
      { name: "成长型", keys: ["成长型"], tracks: [
        { id: "逆袭", keys: ["逆袭"], desc: "都市/现实翻身、种田" },
        { id: "修仙", keys: ["修仙"], desc: "修真/仙侠升级" },
        { id: "玄幻", keys: ["玄幻"], desc: "异界/奇幻战力" },
      ] },
      { name: "身份型", keys: ["身份型"], tracks: [
        { id: "战神", keys: ["战神"], desc: "战神/兵王/龙王/神豪" },
        { id: "赘婿", keys: ["赘婿"], desc: "上门女婿" },
        { id: "霸总", keys: ["霸总"], desc: "总裁/隐藏富豪" },
      ] },
      { name: "预知型", keys: ["预知型"], tracks: [
        { id: "重生", keys: ["重生"], desc: "前世记忆复仇" },
        { id: "穿越·降维流", keys: ["降维流", "子型A"], desc: "现代穿古代" },
        { id: "穿越·穿书", keys: ["穿书", "子型B"], desc: "穿书/穿成反派" },
      ] },
    ],
  },
  nv: {
    name: "女频",
    dir: "skill/nv",
    types: [
      { name: "实力逆袭型", keys: ["实力逆袭型"], tracks: [
        { id: "职场", keys: ["职场"], desc: "职场/技术骨干翻身" },
        { id: "学霸", keys: ["学霸"], desc: "高考/应试翻身" },
        { id: "神医", keys: ["神医"], desc: "神医/医术穿越" },
        { id: "修仙穿越", keys: ["修仙穿越"], desc: "修仙穿书/女配逆袭" },
      ] },
      { name: "身份反转型", keys: ["身份反转型"], tracks: [
        { id: "真千金", keys: ["真千金"], desc: "豪门认亲" },
        { id: "马甲", keys: ["马甲"], desc: "多重身份/先婚后爱" },
        { id: "玄幻大女主", keys: ["玄幻大女主"], desc: "无情道/无CP大女主" },
      ] },
      { name: "情感关系型", keys: ["情感关系型"], tracks: [
        { id: "虐恋", keys: ["虐恋"], desc: "嘴硬深情/破镜重圆" },
      ] },
    ],
  },
};

// 不分赛道都要带上的章节（叙事风格、单集节奏、通用清单、台词模板）
const GENERIC = ["通用叙事风格", "单集万能公式", "情绪循环", "通用检查清单", "通用反面清单", "各型审稿口诀", "附录"];
const REVIEW_ONLY = ["命门汇总"];

export function findTrack(channel, trackId) {
  const ch = CHANNELS[channel];
  if (!ch) return null;
  for (const t of ch.types) for (const k of t.tracks) if (k.id === trackId) return { ch, type: t, track: k };
  return null;
}

// ---------- 读取与切分 ----------
const cache = new Map();
async function load(channel) {
  if (cache.has(channel)) return cache.get(channel);
  const dir = CHANNELS[channel].dir;
  const docs = await Promise.all(FILES.map(async (f) => {
    const r = await fetch(`${dir}/${f}`);
    if (!r.ok) throw new Error(t("err.skillFile", { f }));
    return parse(await r.text());
  }));
  cache.set(channel, docs);
  return docs;
}

function parse(md) {
  const root = { level: 0, title: "", body: [], kids: [] };
  const stack = [root];
  for (const ln of md.replace(/^﻿/, "").split(/\r?\n/)) {
    const m = /^(#{1,6})\s+(.*)$/.exec(ln);
    if (m) {
      const n = { level: m[1].length, title: m[2].trim(), body: [], kids: [] };
      while (stack[stack.length - 1].level >= n.level) stack.pop();
      stack[stack.length - 1].kids.push(n);
      stack.push(n);
    } else if (!/^\[.*\]\(.*\)\s*$/.test(ln) && !/^-{3,}\s*$/.test(ln)) {
      stack[stack.length - 1].body.push(ln);
    }
  }
  return root;
}

const has = (t, keys) => keys.some((k) => t.includes(k));
const head = (n) => "#".repeat(n.level) + " " + n.title;
const full = (n) => [head(n), ...n.body, ...n.kids.flatMap(full)];

// sel = { track: [...], others: [...], type: [...], generic: [...] }
function pick(n, sel) {
  const out = [];
  for (const k of n.kids) {
    if (sel.track.length && has(k.title, sel.track)) out.push(...full(k));
    else if (has(k.title, sel.generic)) out.push(...full(k));
    else if (sel.type.length && has(k.title, sel.type)) out.push(head(k), ...k.body, ...pickInType(k, sel));
    else out.push(...pick(k, sel));
  }
  return out;
}
function pickInType(n, sel) {
  const out = [];
  for (const k of n.kids) {
    if (has(k.title, sel.track)) out.push(...full(k));
    else if (has(k.title, sel.others)) continue;
    else out.push(head(k), ...k.body, ...pickInType(k, sel));
  }
  return out;
}

// 返回该频道/赛道的规则摘录（markdown 文本）。channel 为空表示不套短剧规则。
export async function rulesFor(channel, trackId, { review = false } = {}) {
  if (!CHANNELS[channel]) return "";
  const docs = await load(channel);
  const f = findTrack(channel, trackId);
  const allTracks = CHANNELS[channel].types.flatMap((t) => t.tracks);
  const sel = {
    track: f ? f.track.keys : [],
    others: f ? allTracks.filter((t) => t !== f.track).flatMap((t) => t.keys) : [],
    type: f ? f.type.keys : [],
    generic: review ? [...GENERIC, ...REVIEW_ONLY] : GENERIC,
  };
  return docs.map((d) => pick(d, sel).join("\n")).join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}
