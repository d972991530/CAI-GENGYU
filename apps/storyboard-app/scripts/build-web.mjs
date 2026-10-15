// 把 tools/storyboard-previewer/index.html 打包成离线可用的 www/：
// 补全文档骨架、去掉在线字体、把 JSZip / pdf.js 换成本地文件，并注入 Claude 连接脚本。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const src = path.resolve(root, "../../tools/storyboard-previewer/index.html");
const www = path.join(root, "www");
const nm = path.join(root, "node_modules");

fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(path.join(www, "vendor/pdfjs"), { recursive: true });

let html = fs.readFileSync(src, "utf8");
const must = (re, label) => { if (!re.test(html)) throw new Error(`build-web: 没找到 ${label}，页面结构变了，请更新 build-web.mjs`); };

must(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/, "Google Fonts 链接");
html = html
  .replace(/<link rel="preconnect"[^>]*>\s*/g, "")
  .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/, "");

must(/<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/jszip\/[^"]+"><\/script>/, "JSZip 脚本");
html = html.replace(
  /<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/jszip\/[^"]+"><\/script>/,
  `<script>window.SBP_VENDOR={pdfjs:"vendor/pdfjs/"};</script>\n<script src="claude-bridge.js"></script>\n<script src="vendor/jszip.min.js"></script>`
);

// 与 claude.ai Artifact 发布时外层骨架相同的最小重置
const head = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
`;
fs.writeFileSync(path.join(www, "index.html"), head + html + "\n</body>\n</html>\n");

fs.copyFileSync(path.join(nm, "jszip/dist/jszip.min.js"), path.join(www, "vendor/jszip.min.js"));
for (const f of ["pdf.min.js", "pdf.worker.min.js"]) {
  fs.copyFileSync(path.join(nm, "pdfjs-dist/build", f), path.join(www, "vendor/pdfjs", f));
}

await build({
  entryPoints: [path.join(root, "src/claude-bridge.js")],
  outfile: path.join(www, "claude-bridge.js"),
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["chrome110"],
  minify: true,
  legalComments: "none",
});

console.log("www/ 已生成：", fs.readdirSync(www).join(", "));
