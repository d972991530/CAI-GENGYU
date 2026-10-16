import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = process.env;

export const config = {
  port: Number(env.PORT ?? 8787),
  host: env.HOST ?? '0.0.0.0',
  dataDir: path.resolve(env.DATA_DIR ?? path.join(root, '.data')),
  distDir: path.join(root, 'dist'),
  /** 加密密钥的主口令；不设置时自动生成并保存到 dataDir/.secret */
  secret: env.STUDIO_SECRET,
  /** 设置后所有 /api 请求都需要携带 x-studio-token */
  token: env.STUDIO_TOKEN,
  jobConcurrency: Number(env.JOB_CONCURRENCY ?? 3),
  /** 单个请求体上限（参考图以 base64 传输） */
  bodyLimit: Number(env.BODY_LIMIT_MB ?? 40) * 1024 * 1024,
  /** 结果文件保留天数 */
  resultTtlDays: Number(env.RESULT_TTL_DAYS ?? 14),
  envKeys: { gemini: env.GEMINI_API_KEY ?? '', fal: env.FAL_KEY ?? '' },
  upstream: {
    falQueue: env.FAL_QUEUE_URL ?? 'https://queue.fal.run',
    geminiBase: env.GEMINI_BASE_URL,
  },
};
