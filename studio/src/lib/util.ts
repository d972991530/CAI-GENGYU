export const uid = (p = '') => p + Math.random().toString(36).slice(2, 10);

export function download(filename: string, data: Blob | string, type = 'text/plain;charset=utf-8') {
  const blob = typeof data === 'string' ? new Blob([data], { type }) : data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function srtTime(sec: number) {
  const ms = Math.round(sec * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const r = ms % 1000;
  const p = (n: number, l = 2) => String(n).padStart(l, '0');
  return `${p(h)}:${p(m)}:${p(s)},${p(r, 3)}`;
}

export function aspectRatio(a: string) {
  const [w, h] = a.split(':').map(Number);
  return w / h;
}

export function timeAgo(t: number) {
  const d = (Date.now() - t) / 1000;
  if (d < 60) return '刚刚';
  if (d < 3600) return `${Math.floor(d / 60)} 分钟前`;
  if (d < 86400) return `${Math.floor(d / 3600)} 小时前`;
  return new Date(t).toLocaleDateString('zh-CN');
}

/** 宽松解析模型返回的 JSON（去掉 ```json 围栏） */
export function parseJSON<T>(text: string): T {
  const cleaned = text.replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/, '').trim();
  return JSON.parse(cleaned) as T;
}
