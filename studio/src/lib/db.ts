// 极简 IndexedDB 封装：projects 存 JSON，media 存图片/视频/音频 Blob
const DB_NAME = 'jingfang-studio';
const VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects');
        if (!db.objectStoreNames.contains('media')) db.createObjectStore('media');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = fn(t.objectStore(store));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const idb = {
  get: <T>(store: string, key: string) => tx<T | undefined>(store, 'readonly', (s) => s.get(key)),
  set: (store: string, key: string, value: unknown) => tx(store, 'readwrite', (s) => s.put(value, key)),
  del: (store: string, key: string) => tx(store, 'readwrite', (s) => s.delete(key)),
  all: <T>(store: string) => tx<T[]>(store, 'readonly', (s) => s.getAll()),
};

// ---- media helpers ----
const urlCache = new Map<string, string>();

export async function putMedia(blob: Blob): Promise<string> {
  const key = `m_${crypto.randomUUID()}`;
  await idb.set('media', key, blob);
  return key;
}

export async function getMedia(key: string): Promise<Blob | undefined> {
  return idb.get<Blob>('media', key);
}

export async function mediaUrl(key: string): Promise<string | undefined> {
  const hit = urlCache.get(key);
  if (hit) return hit;
  const blob = await getMedia(key);
  if (!blob) return undefined;
  const url = URL.createObjectURL(blob);
  urlCache.set(key, url);
  return url;
}

export async function deleteMedia(key?: string) {
  if (!key) return;
  const url = urlCache.get(key);
  if (url) URL.revokeObjectURL(url);
  urlCache.delete(key);
  await idb.del('media', key);
}

export function blobToBase64(blob: Blob): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result);
      resolve({ data: s.slice(s.indexOf(',') + 1), mimeType: blob.type || 'image/png' });
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export function base64ToBlob(data: string, mimeType: string): Blob {
  const bin = atob(data);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mimeType });
}
