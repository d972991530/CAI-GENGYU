// 版本号与更新检查。发布流程（GitHub Actions）会校验这里的版本号与 version.json 一致。
export const VERSION = "1.2.1";

// 先查 GitHub Pages，打不开再查仓库里的原文件
const SOURCES = [
  "https://d972991530.github.io/CAI-GENGYU/version.json",
  "https://raw.githubusercontent.com/d972991530/CAI-GENGYU/main/script-workbench/version.json",
];

export function newerThan(a, b) {
  const pa = String(a).split(".").map(Number), pb = String(b).split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0;
  }
  return false;
}

const timeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms));

// 返回 { version, notes, apk, page } 或 null
export async function checkUpdate() {
  let lastErr;
  for (const url of SOURCES) {
    try {
      const res = await Promise.race([fetch(url + "?t=" + Date.now(), { cache: "no-store" }), timeout(8000)]);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const j = JSON.parse(await res.text());
      if (j && j.version) return j;
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("update check failed");
}
