import * as THREE from 'three';

// 美术资源加载：贴图、透明立绘（附带用于像素级命中判定的 alpha 蒙版）、头像、过场画面
const SPRITES = [
  'lin', 'zhou', 'su', 'man', 'chen', 'apo', 'xu', 'zhong',
  'water_gu', 'ore_gu', 'mandrill', 'steelbone', 'butcher', 'bride', 'coffin',
  'coffin_hang', 'tank_body',
  // 用户资产包（独立单体）
  'infected', 'miner', 'nuo_mask', 'bride2', 'scare_nuo',
];
const TEX = [
  'frost_door', 'tank_wall', 'ship_wall', 'frost_shelf', 'wood_panel', 'carpet', 'wet_tile', 'hold_wall',
  'sluice_wall', 'factory_wall', 'banquet_wall', 'village_wall',
  'm_ch1', 'm_ch2', 'm_ch3', 'm_ch4', 'm_ch5', 'm_ch6', 'm_ch7', 'm_ch8', 'm_coffin', 'm_terminal',
];
const HUD = ['h_pistol_b', 'h_bell_b', 'w_mg', 'w_cryo', 'w_pistol2', 'w_cryo2'];
const PROPS = ['ammo', 'bell', 'medkit', 'serum'];
export const PORTRAITS = ['lin', 'su', 'zhou', 'chen', 'man', 'apo', 'xu', 'zhong'];

export interface SpriteInfo {
  name: string;
  tex: THREE.Texture;
  aspect: number; // 宽/高
  mask: { w: number; h: number; data: Uint8Array };
}

const images = new Map<string, HTMLImageElement>();
const textures = new Map<string, THREE.Texture>();
const sprites = new Map<string, SpriteInfo>();

export const artUrl = (path: string) => `./art/${path}`;

function loadImage(key: string, url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      images.set(key, img);
      resolve();
    };
    img.onerror = () => {
      console.warn('missing art', url);
      resolve();
    };
    img.src = url;
  });
}

export async function loadAll(onProgress: (k: number) => void) {
  const jobs: [string, string][] = [
    ...SPRITES.map((n) => [`sprite:${n}`, artUrl(`sprites/${n}.webp`)] as [string, string]),
    ...TEX.map((n) => [`tex:${n}`, artUrl(`tex/${n}.webp`)] as [string, string]),
    ...HUD.map((n) => [`hud:${n}`, artUrl(`hud/${n}.webp`)] as [string, string]),
    ...PROPS.map((n) => [`prop:${n}`, artUrl(`props/${n}.webp`)] as [string, string]),
    ['sky:f01', artUrl('sky/f01.jpg')],
    ['sky:f25', artUrl('sky/f25.jpg')],
    ['sky:village', artUrl('sky/village.jpg')],
  ];
  let done = 0;
  await Promise.all(jobs.map(([k, u]) => loadImage(k, u).then(() => onProgress(++done / jobs.length))));
}

export function imageTexture(key: string, repeat = 1): THREE.Texture | null {
  const id = `${key}@${repeat}`;
  if (textures.has(id)) return textures.get(id)!;
  const img = images.get(key);
  if (!img) return null;
  const t = new THREE.Texture(img);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  t.needsUpdate = true;
  textures.set(id, t);
  return t;
}

export function sprite(name: string): SpriteInfo {
  const cached = sprites.get(name);
  if (cached) return cached;
  const img = images.get(`sprite:${name}`);
  if (!img) throw new Error(`sprite ${name} not loaded`);
  const tex = new THREE.Texture(img);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  // 缩小的 alpha 蒙版，用于命中判定
  const mh = 96;
  const mw = Math.max(8, Math.round((img.width / img.height) * mh));
  const c = document.createElement('canvas');
  c.width = mw;
  c.height = mh;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.drawImage(img, 0, 0, mw, mh);
  const px = g.getImageData(0, 0, mw, mh).data;
  const data = new Uint8Array(mw * mh);
  for (let i = 0; i < mw * mh; i++) data[i] = px[i * 4 + 3];
  const info = { name, tex, aspect: img.width / img.height, mask: { w: mw, h: mh, data } };
  sprites.set(name, info);
  return info;
}

export function hasImage(key: string) {
  return images.has(key);
}

export function hudUrl(name: string) {
  return artUrl(`hud/${name}.webp`);
}

export function portraitUrl(name: string) {
  return artUrl(`portraits/${name}.jpg`);
}
