// 密钥加密存储：AES-256-GCM，主密钥来自 STUDIO_SECRET 或本地自动生成的 .secret 文件
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.ts';

export interface Sealed { iv: string; tag: string; data: string }

let master: Buffer | undefined;
function masterKey(): Buffer {
  if (master) return master;
  if (config.secret) {
    master = crypto.createHash('sha256').update(config.secret).digest();
  } else {
    const file = path.join(config.dataDir, '.secret');
    if (!fs.existsSync(file)) {
      fs.mkdirSync(config.dataDir, { recursive: true });
      fs.writeFileSync(file, crypto.randomBytes(32).toString('base64'), { mode: 0o600 });
    }
    master = Buffer.from(fs.readFileSync(file, 'utf8').trim(), 'base64');
  }
  return master;
}

export function seal(plain: string): Sealed {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', masterKey(), iv);
  const data = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return { iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), data: data.toString('base64') };
}

export function unseal(s: Sealed): string {
  const d = crypto.createDecipheriv('aes-256-gcm', masterKey(), Buffer.from(s.iv, 'base64'));
  d.setAuthTag(Buffer.from(s.tag, 'base64'));
  return Buffer.concat([d.update(Buffer.from(s.data, 'base64')), d.final()]).toString('utf8');
}

/** 常量时间比较，用于访问口令 */
export function safeEqual(a: string, b: string) {
  const x = crypto.createHash('sha256').update(a).digest();
  const y = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(x, y);
}
