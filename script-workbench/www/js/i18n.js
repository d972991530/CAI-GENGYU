// 界面多语言：t("key", {变量}) 取当前语言的文案，缺失时回退到简体中文
import zhCN from "./i18n/zh-CN.js";
import zhTW from "./i18n/zh-TW.js";
import en from "./i18n/en.js";
import ja from "./i18n/ja.js";
import ko from "./i18n/ko.js";
import fr from "./i18n/fr.js";
import es from "./i18n/es.js";
import ar from "./i18n/ar.js";

const DICTS = { "zh-CN": zhCN, "zh-TW": zhTW, en, ja, ko, fr, es, ar };

// [代码, 自称, 写进 AI 提示词时用的语言名]
export const LANGS = [
  ["zh-CN", "简体中文", "简体中文"],
  ["zh-TW", "繁體中文", "繁體中文（台灣/香港用語）"],
  ["en", "English", "English"],
  ["ja", "日本語", "日本語"],
  ["ko", "한국어", "한국어"],
  ["fr", "Français", "français"],
  ["es", "Español", "español"],
  ["ar", "العربية", "العربية الفصحى"],
];

const KEY = "stl.lang";
let cur = "zh-CN";

function detect() {
  const n = (navigator.language || "zh-CN").toLowerCase();
  if (n.startsWith("zh")) return /tw|hk|mo|hant/.test(n) ? "zh-TW" : "zh-CN";
  const short = n.slice(0, 2);
  return DICTS[short] ? short : "en";
}

export function initLang() {
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch {}
  apply(DICTS[saved] ? saved : detect());
}

export function setLang(code) {
  if (!DICTS[code]) return;
  try { localStorage.setItem(KEY, code); } catch {}
  apply(code);
}

function apply(code) {
  cur = code;
  document.documentElement.lang = code;
  document.documentElement.dir = code === "ar" ? "rtl" : "ltr";
}

export const getLang = () => cur;
export const isZh = (code = cur) => code === "zh-CN" || code === "zh-TW";
export const aiLangName = (code) => (LANGS.find((l) => l[0] === code) || LANGS[0])[2];

export function t(key, vars) {
  let s = DICTS[cur][key];
  if (s == null) s = zhCN[key];
  if (s == null) return key;
  return vars ? s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? "")) : s;
}
