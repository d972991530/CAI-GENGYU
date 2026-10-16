// K-Cinema 后端：所有 Gemini 请求都在服务端完成，前端只访问同域 /api
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  analyzeScript, generateProductionTip, generateStoryboardDescription,
  breakdownScriptToComicPanels, generateComicPanelImage, generateKeyframeImage, generateMotionPrevis,
} from './gemini.ts';
import type { ComicPanel, PrevisConfig, PrevisJob } from '../shared/types.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// 沿用原来的 .env.local 约定：GEMINI_API_KEY 只在服务端读取
for (const f of ['.env.local', '.env']) {
  try { process.loadEnvFile(path.join(root, f)); } catch { /* 文件不存在 */ }
}

const PORT = Number(process.env.PORT ?? 8788);
const TOKEN = process.env.APP_TOKEN ?? '';
const DIST = path.join(root, 'dist');
const BODY_LIMIT = 25 * 1024 * 1024;

class HttpError extends Error { constructor(public status: number, msg: string) { super(msg); } }

const send = (res: http.ServerResponse, status: number, body: unknown) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
};

function readJSON<T>(req: http.IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []; let size = 0;
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > BODY_LIMIT) { reject(new HttpError(413, '请求体过大')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { reject(new HttpError(400, '请求体不是合法 JSON')); } });
    req.on('error', reject);
  });
}

const str = (v: unknown, name: string, max = 50_000) => {
  if (typeof v !== 'string' || !v.trim()) throw new HttpError(400, `缺少参数 ${name}`);
  return v.slice(0, max);
};

function authorized(req: http.IncomingMessage) {
  if (!TOKEN) return true;
  const t = req.headers['x-app-token'];
  if (typeof t !== 'string') return false;
  const a = crypto.createHash('sha256').update(t).digest(), b = crypto.createHash('sha256').update(TOKEN).digest();
  return crypto.timingSafeEqual(a, b);
}

// 视频预演耗时数分钟，用异步任务 + 轮询
const previs = new Map<string, PrevisJob & { video?: { data: Buffer; mimeType: string }; createdAt: number }>();
setInterval(() => { for (const [id, j] of previs) if (Date.now() - j.createdAt > 3600_000) previs.delete(id); }, 600_000).unref();

async function api(req: http.IncomingMessage, res: http.ServerResponse, pathname: string) {
  const method = req.method ?? 'GET';
  if (pathname === '/api/health') return send(res, 200, { ok: true, tokenRequired: !!TOKEN, keyConfigured: !!(process.env.GEMINI_API_KEY || process.env.API_KEY) });
  if (!authorized(req)) throw new HttpError(401, '需要访问口令');

  if (method === 'POST') {
    const b = await readJSON<Record<string, unknown>>(req);
    switch (pathname) {
      case '/api/analyze': return send(res, 200, { text: await analyzeScript(str(b.script, 'script')) });
      case '/api/tip': return send(res, 200, { text: await generateProductionTip(str(b.stage, 'stage', 200)) });
      case '/api/storyboard':
        return send(res, 200, { text: await generateStoryboardDescription(str(b.prompt, 'prompt'), b.mode === 'optimize' ? 'optimize' : 'create') });
      case '/api/comic/panels':
        return send(res, 200, { panels: await breakdownScriptToComicPanels(str(b.script, 'script'), Math.min(12, Math.max(1, Number(b.panelCount) || 6))) });
      case '/api/comic/image':
        return send(res, 200, { image: await generateComicPanelImage(b.panel as ComicPanel, str(b.style, 'style', 200)) });
      case '/api/keyframe':
        return send(res, 200, { image: await generateKeyframeImage(str(b.prompt, 'prompt', 4000), str(b.style, 'style', 200)) });
      case '/api/previs': {
        const id = crypto.randomUUID();
        const job = { id, status: 'running' as const, createdAt: Date.now() };
        previs.set(id, job);
        generateMotionPrevis(str(b.prompt, 'prompt', 4000), typeof b.imageBase64 === 'string' ? b.imageBase64 : undefined, b.config as PrevisConfig)
          .then((video) => Object.assign(job, { status: 'done', video }))
          .catch((e: Error) => { Object.assign(job, { status: 'error', error: e.message }); console.error('[previs]', e.message); });
        return send(res, 202, { id, status: 'running' });
      }
    }
  }

  const m = pathname.match(/^\/api\/previs\/([\w-]{36})(\/video)?$/);
  if (m && method === 'GET') {
    const job = previs.get(m[1]);
    if (!job) throw new HttpError(404, '任务不存在或已过期');
    if (!m[2]) return send(res, 200, { id: job.id, status: job.status, error: job.error });
    if (!job.video) throw new HttpError(409, '视频尚未生成完成');
    res.writeHead(200, { 'Content-Type': job.video.mimeType, 'Content-Length': job.video.data.length });
    return res.end(job.video.data);
  }
  throw new HttpError(404, '接口不存在');
}

const MIME: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
function serveStatic(res: http.ServerResponse, pathname: string) {
  let file = path.join(DIST, path.normalize(decodeURIComponent(pathname)));
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('前端尚未构建：请先运行 npm run build'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  if (!pathname.startsWith('/api/')) return serveStatic(res, pathname);
  try { await api(req, res, pathname); }
  catch (e) {
    const status = e instanceof HttpError ? e.status : 502;
    const msg = e instanceof Error ? e.message : String(e);
    if (status >= 500) console.error(`[api] ${pathname}:`, msg);
    if (!res.headersSent) send(res, status, { error: msg });
  }
}).listen(PORT, () => console.log(`K-Cinema 后端已启动：http://localhost:${PORT}${TOKEN ? '（已启用访问口令）' : ''}`));
