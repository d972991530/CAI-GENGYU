// 镜坊后端：所有模型 API 调用都在这里完成，前端只访问同域的 /api
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.ts';
import { safeEqual } from './crypto.ts';
import { getKey, getSettings, HttpError, publicSettings, updateSettings } from './settings.ts';
import { getJob, initJobs, listJobs, resultFile, submitJob } from './jobs.ts';
import { geminiText } from './providers/gemini.ts';
import type { MediaRequest, SettingsPatch, TextRequest } from '../shared/types.ts';

const TEXT_OPS = ['story', 'novel', 'assets', 'storyboard', 'rewrite'];

function send(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readJSON<T>(req: http.IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > config.bodyLimit) { reject(new HttpError(413, '请求体过大')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch { reject(new HttpError(400, '请求体不是合法 JSON')); }
    });
    req.on('error', reject);
  });
}

function authorized(req: http.IncomingMessage) {
  if (!config.token) return true;
  const t = req.headers['x-studio-token'];
  return typeof t === 'string' && safeEqual(t, config.token);
}

async function api(req: http.IncomingMessage, res: http.ServerResponse, url: URL) {
  const { pathname } = url;
  const method = req.method ?? 'GET';

  if (pathname === '/api/health') return send(res, 200, { ok: true, tokenRequired: !!config.token });
  if (!authorized(req)) throw new HttpError(401, '需要访问口令');

  if (pathname === '/api/settings') {
    if (method === 'GET') return send(res, 200, publicSettings());
    if (method === 'PUT') return send(res, 200, updateSettings(await readJSON<SettingsPatch>(req)));
  }

  if (pathname === '/api/text' && method === 'POST') {
    const body = await readJSON<TextRequest>(req);
    if (!TEXT_OPS.includes(body?.op)) throw new HttpError(400, '未知的文本操作');
    const { engines, models } = getSettings();
    if (engines.text !== 'gemini') throw new HttpError(400, '当前剧本引擎为演示模式，无需调用后端');
    return send(res, 200, await geminiText(getKey('gemini'), models, body));
  }

  if (pathname === '/api/jobs') {
    if (method === 'POST') {
      const { job, deduped } = submitJob(await readJSON<MediaRequest>(req));
      return send(res, deduped ? 200 : 202, { job, deduped });
    }
    if (method === 'GET') return send(res, 200, { jobs: listJobs(Number(url.searchParams.get('limit') ?? 100)) });
  }

  const m = pathname.match(/^\/api\/jobs\/([\w-]{8,64})(\/result)?$/);
  if (m && method === 'GET') {
    if (!m[2]) return send(res, 200, { job: getJob(m[1]) });
    const { file, mimeType } = resultFile(m[1]);
    res.writeHead(200, { 'Content-Type': mimeType, 'Content-Length': fs.statSync(file).size, 'Cache-Control': 'private, max-age=86400' });
    fs.createReadStream(file).pipe(res);
    return;
  }

  throw new HttpError(404, '接口不存在');
}

// ---------- 静态前端（生产环境同域托管，避免跨域） ----------
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2',
};
function serveStatic(res: http.ServerResponse, pathname: string) {
  const dist = config.distDir;
  let file = path.join(dist, path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, ''));
  if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, 'index.html');
  if (!fs.existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('前端尚未构建：请先运行 npm run build，开发时请使用 npm run dev');
    return;
  }
  const ext = path.extname(file);
  res.writeHead(200, {
    'Content-Type': MIME[ext] ?? 'application/octet-stream',
    'Cache-Control': file.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  fs.createReadStream(file).pipe(res);
}

initJobs();

const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (!url.pathname.startsWith('/api/')) return serveStatic(res, url.pathname);
  try {
    await api(req, res, url);
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 502;
    const msg = e instanceof Error ? e.message : String(e);
    if (status >= 500) console.error(`[api] ${req.method} ${url.pathname}:`, msg);
    if (!res.headersSent) send(res, status, { error: msg });
  }
});
server.requestTimeout = 10 * 60_000;

server.listen(config.port, config.host, () => {
  console.log(`镜坊后端已启动：http://localhost:${config.port}  数据目录：${config.dataDir}${config.token ? '  （已启用访问口令）' : ''}`);
});
