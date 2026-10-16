// 临时公开参考图：部分第三方平台只接受公网 URL 形式的参考图。
// 设置 PUBLIC_BASE_URL 后，参考图写入 .data/public/ 并以不可猜测的随机地址提供，过期自动删除。
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.ts';
import { HttpError } from './settings.ts';
import type { RefImage } from '../shared/types.ts';

const DIR = () => path.join(config.dataDir, 'public');
const EXT: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
const MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };

export function initPublicRefs() {
  fs.mkdirSync(DIR(), { recursive: true });
  const sweep = () => {
    const ttl = config.publicRefTtlMin * 60_000;
    for (const f of fs.readdirSync(DIR())) {
      const full = path.join(DIR(), f);
      if (Date.now() - fs.statSync(full).mtimeMs > ttl) fs.rmSync(full, { force: true });
    }
  };
  sweep();
  setInterval(sweep, 5 * 60_000).unref();
}

/** 返回第三方平台可访问的参考图地址；未配置 PUBLIC_BASE_URL 时返回 data URI */
export function refToUrl(r: RefImage): string {
  if (!config.publicBaseUrl) return `data:${r.mimeType};base64,${r.data}`;
  const name = `${crypto.randomBytes(24).toString('hex')}.${EXT[r.mimeType] ?? 'png'}`;
  fs.writeFileSync(path.join(DIR(), name), Buffer.from(r.data, 'base64'));
  return `${config.publicBaseUrl}/api/public/refs/${name}`;
}

export function publicRefFile(name: string): { file: string; mimeType: string } {
  if (!/^[a-f0-9]{48}\.(png|jpg|webp)$/.test(name)) throw new HttpError(404, '不存在');
  const file = path.join(DIR(), name);
  if (!fs.existsSync(file) || Date.now() - fs.statSync(file).mtimeMs > config.publicRefTtlMin * 60_000) throw new HttpError(404, '已过期');
  return { file, mimeType: MIME[name.split('.').pop()!] };
}
