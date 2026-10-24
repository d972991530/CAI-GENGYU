// 从 Word / PDF / TXT 中提取纯文本
import * as pdfjsLib from "../lib/pdf.min.mjs";
import { matchHeading } from "./parser.js";
import { t } from "./i18n.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("../lib/pdf.worker.min.mjs", import.meta.url).href;

export async function extractText(file) {
  const name = file.name.toLowerCase();
  const buf = await file.arrayBuffer();
  if (name.endsWith(".docx")) {
    const r = await window.mammoth.extractRawText({ arrayBuffer: buf });
    return r.value;
  }
  if (name.endsWith(".pdf")) return extractPdf(buf);
  if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".fountain")) {
    return new TextDecoder("utf-8").decode(buf);
  }
  if (name.endsWith(".doc")) throw new Error(t("err.doc"));
  throw new Error(t("err.fileType"));
}

async function extractPdf(buf) {
  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(buf),
    cMapUrl: new URL("../lib/cmaps/", import.meta.url).href,
    cMapPacked: true,
  }).promise;
  const out = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    let lastY = null, line = "";
    for (const it of tc.items) {
      if (!("str" in it)) continue;
      const y = Math.round(it.transform[5]);
      if (lastY !== null && Math.abs(y - lastY) > 2) { out.push(line); line = ""; }
      line += it.str;
      lastY = y;
      if (it.hasEOL) { out.push(line); line = ""; lastY = null; }
    }
    if (line) out.push(line);
    out.push("");
  }
  const text = out.join("\n");
  if (text.replace(/\s/g, "").length < 50) {
    throw new Error(t("err.pdfScan"));
  }
  return mergePdfLines(text);
}

// PDF 常把一段话折成多行：句子未结束且下一行不像标题/人名时，合并为一段
function mergePdfLines(text) {
  const lines = text.split("\n").map((l) => l.trim());
  const res = [];
  for (const l of lines) {
    if (!l) { res.push(""); continue; }
    if (/^\d+$/.test(l)) continue; // 页码
    const prev = res[res.length - 1];
    if (prev && prev.length > 20 && !/[。！？…”」）)：:]$/.test(prev) && l.length > 1 && !matchHeading(prev) && !matchHeading(l)) {
      res[res.length - 1] = prev + l;
    } else res.push(l);
  }
  return res.join("\n");
}
