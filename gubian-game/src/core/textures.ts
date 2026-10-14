import * as THREE from 'three';
import { imageTexture } from './assets';

// 程序贴图（补足照片贴图），按名字生成并缓存
type Draw = (g: CanvasRenderingContext2D, s: number) => void;
const cache = new Map<string, THREE.Texture>();

function noise(g: CanvasRenderingContext2D, s: number, n: number, a = 0.08) {
  for (let i = 0; i < n; i++) {
    const v = Math.random() * 255;
    g.fillStyle = `rgba(${v},${v},${v},${a})`;
    g.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 3, 1 + Math.random() * 3);
  }
}

function stains(g: CanvasRenderingContext2D, s: number, n: number, color: string) {
  for (let i = 0; i < n; i++) {
    const x = Math.random() * s, y = Math.random() * s, r = 8 + Math.random() * s * 0.14;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, color);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

function veins(g: CanvasRenderingContext2D, s: number, n: number, color: string) {
  g.strokeStyle = color;
  for (let i = 0; i < n; i++) {
    let x = Math.random() * s, y = Math.random() * s;
    g.lineWidth = 1 + Math.random() * 3;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 10; k++) {
      x += (Math.random() - 0.5) * 40;
      y += (Math.random() - 0.3) * 30;
      g.lineTo(x, y);
    }
    g.stroke();
  }
}

const DRAW: Record<string, Draw> = {
  deck: (g, s) => {
    g.fillStyle = '#3d3024'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? '#463523' : '#382a1e';
      g.fillRect(0, (i * s) / 8, s, s / 8 - 3);
      g.fillStyle = '#140e08'; g.fillRect(0, ((i + 1) * s) / 8 - 3, s, 3);
    }
    noise(g, s, 4000, 0.06); stains(g, s, 5, 'rgba(10,20,25,0.5)');
  },
  wallpaper: (g, s) => {
    g.fillStyle = '#3a2f22'; g.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x += 32) { g.fillStyle = 'rgba(150,110,60,0.2)'; g.fillRect(x, 0, 4, s); }
    g.fillStyle = '#21180f'; g.fillRect(0, s * 0.7, s, s * 0.3);
    g.fillStyle = 'rgba(190,150,80,0.5)'; g.fillRect(0, s * 0.7, s, 5);
    noise(g, s, 4000, 0.06); stains(g, s, 6, 'rgba(0,0,0,0.45)'); stains(g, s, 2, 'rgba(130,10,5,0.55)');
  },
  metal: (g, s) => {
    g.fillStyle = '#41484b'; g.fillRect(0, 0, s, s);
    g.strokeStyle = '#1e2326'; g.lineWidth = 5; g.strokeRect(3, 3, s - 6, s - 6);
    g.strokeRect(3, s / 2, s - 6, 1);
    g.fillStyle = '#6a7276';
    for (const [x, y] of [[12, 12], [s - 16, 12], [12, s - 16], [s - 16, s - 16]]) { g.beginPath(); g.arc(x + 2, y + 2, 4, 0, 7); g.fill(); }
    noise(g, s, 5000, 0.08); stains(g, s, 10, 'rgba(110,55,20,0.35)');
  },
  rust: (g, s) => {
    g.fillStyle = '#4a3326'; g.fillRect(0, 0, s, s);
    stains(g, s, 30, 'rgba(140,70,25,0.45)'); stains(g, s, 20, 'rgba(20,15,10,0.5)');
    g.fillStyle = 'rgba(0,0,0,0.5)'; for (let y = 0; y < s; y += 64) g.fillRect(0, y, s, 4);
    noise(g, s, 5000, 0.1);
  },
  tile: (g, s) => {
    g.fillStyle = '#8d9496'; g.fillRect(0, 0, s, s);
    g.strokeStyle = '#3c4243'; g.lineWidth = 3;
    for (let i = 0; i <= 4; i++) {
      g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, s); g.stroke();
      g.beginPath(); g.moveTo(0, i * 64); g.lineTo(s, i * 64); g.stroke();
    }
    noise(g, s, 4000, 0.08); stains(g, s, 6, 'rgba(120,8,4,0.55)'); stains(g, s, 6, 'rgba(0,0,0,0.4)');
  },
  frost: (g, s) => {
    g.fillStyle = '#9fb6c0'; g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 160; i++) {
      const x = Math.random() * s, y = Math.random() * s, l = 4 + Math.random() * 18, a = Math.random() * 3.14;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    noise(g, s, 3000, 0.1);
  },
  ceiling: (g, s) => {
    g.fillStyle = '#1f1e1c'; g.fillRect(0, 0, s, s);
    g.strokeStyle = '#0d0d0c'; g.lineWidth = 4; g.strokeRect(0, 0, s, s);
    g.fillStyle = 'rgba(255,240,200,0.06)'; g.fillRect(s * 0.4, s * 0.4, s * 0.2, s * 0.2);
    noise(g, s, 2000, 0.05);
  },
  concrete: (g, s) => {
    g.fillStyle = '#55595a'; g.fillRect(0, 0, s, s);
    noise(g, s, 9000, 0.09); stains(g, s, 14, 'rgba(20,25,25,0.35)'); stains(g, s, 4, 'rgba(60,80,60,0.3)');
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, s * 0.5, s, 3); g.fillRect(s * 0.5, 0, 3, s);
  },
  stone: (g, s) => {
    g.fillStyle = '#4b4a44'; g.fillRect(0, 0, s, s);
    g.strokeStyle = '#26251f'; g.lineWidth = 4;
    for (let y = 0; y < s; y += 48) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(s, y); g.stroke();
      for (let x = (y / 48) % 2 ? 0 : 40; x < s; x += 80) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 48); g.stroke(); }
    }
    noise(g, s, 6000, 0.1); stains(g, s, 10, 'rgba(40,70,40,0.35)');
  },
  mud: (g, s) => {
    g.fillStyle = '#2f2a20'; g.fillRect(0, 0, s, s);
    stains(g, s, 30, 'rgba(60,50,30,0.5)'); stains(g, s, 12, 'rgba(20,30,20,0.5)'); noise(g, s, 8000, 0.08);
  },
  temple: (g, s) => {
    g.fillStyle = '#5a1712'; g.fillRect(0, 0, s, s);
    g.fillStyle = '#2a0c08'; g.fillRect(0, s * 0.82, s, s * 0.18);
    g.strokeStyle = 'rgba(210,160,70,0.55)'; g.lineWidth = 4;
    for (let x = 16; x < s; x += 64) { g.strokeRect(x, 20, 40, s * 0.7); }
    noise(g, s, 5000, 0.08); stains(g, s, 8, 'rgba(0,0,0,0.4)');
  },
  lattice: (g, s) => {
    g.fillStyle = '#3a2416'; g.fillRect(0, 0, s, s);
    g.strokeStyle = '#140a05'; g.lineWidth = 6;
    for (let i = 0; i <= s; i += 32) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i, s); g.stroke();
      g.beginPath(); g.moveTo(0, i); g.lineTo(s, i); g.stroke();
    }
    g.fillStyle = 'rgba(255,190,90,0.08)'; g.fillRect(0, 0, s, s);
    noise(g, s, 4000, 0.07);
  },
  neon: (g, s) => {
    g.fillStyle = '#1b1d24'; g.fillRect(0, 0, s, s);
    noise(g, s, 6000, 0.08);
    g.fillStyle = 'rgba(220,40,60,0.8)'; g.fillRect(20, 40, s - 40, 6);
    g.fillStyle = 'rgba(40,200,220,0.6)'; g.fillRect(40, 70, s - 120, 3);
    g.fillStyle = 'rgba(0,0,0,0.5)';
    for (let y = 120; y < s; y += 40) for (let x = 16; x < s; x += 56) g.fillRect(x, y, 36, 24);
    g.fillStyle = 'rgba(255,220,140,0.25)'; g.fillRect(72, 160, 36, 24); g.fillRect(184, 200, 36, 24);
  },
  water: (g, s) => {
    g.fillStyle = '#0b1c1c'; g.fillRect(0, 0, s, s);
    stains(g, s, 20, 'rgba(30,70,70,0.4)'); stains(g, s, 6, 'rgba(110,10,5,0.25)');
    g.strokeStyle = 'rgba(160,220,220,0.15)';
    for (let i = 0; i < 40; i++) { const x = Math.random() * s, y = Math.random() * s; g.beginPath(); g.ellipse(x, y, 20, 5, 0, 0, 7); g.stroke(); }
  },
  grass: (g, s) => {
    g.fillStyle = '#26281b'; g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(80,90,50,0.6)';
    for (let i = 0; i < 900; i++) { const x = Math.random() * s, y = Math.random() * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 4, y - 6 - Math.random() * 6); g.stroke(); }
    stains(g, s, 12, 'rgba(10,10,5,0.5)');
  },
  flesh: (g, s) => {
    g.fillStyle = '#3a0d0b'; g.fillRect(0, 0, s, s);
    stains(g, s, 20, 'rgba(120,20,15,0.5)');
    veins(g, s, 40, 'rgba(230,50,30,0.8)');
    noise(g, s, 3000, 0.1);
  },
  rail: (g, s) => {
    g.fillStyle = '#2b2722'; g.fillRect(0, 0, s, s);
    noise(g, s, 6000, 0.1);
    g.fillStyle = '#4a3220';
    for (let y = 8; y < s; y += 42) g.fillRect(10, y, s - 20, 18);
    g.fillStyle = '#9a9a92'; g.fillRect(s * 0.25, 0, 10, s); g.fillRect(s * 0.72, 0, 10, s);
  },
  door: (g, s) => {
    g.fillStyle = '#4c4036'; g.fillRect(0, 0, s, s);
    g.strokeStyle = '#1b140f'; g.lineWidth = 8; g.strokeRect(8, 8, s - 16, s - 16);
    g.strokeRect(30, 30, s - 60, s * 0.35); g.strokeRect(30, s * 0.5, s - 60, s * 0.4);
    g.fillStyle = '#b89a5a'; g.fillRect(s * 0.8, s * 0.47, 14, 30);
    noise(g, s, 4000, 0.08); stains(g, s, 6, 'rgba(0,0,0,0.4)');
  },
  carpet: (g, s) => {
    g.fillStyle = '#3d0f12'; g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(170,130,60,0.4)'; g.lineWidth = 3;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const x = i * 64 + 32, y = j * 64 + 32;
      g.beginPath(); g.moveTo(x, y - 22); g.lineTo(x + 22, y); g.lineTo(x, y + 22); g.lineTo(x - 22, y); g.closePath(); g.stroke();
    }
    noise(g, s, 5000, 0.07); stains(g, s, 6, 'rgba(10,0,0,0.6)');
  },
};

export function proc(name: string): THREE.Texture {
  if (cache.has(name)) return cache.get(name)!;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  (DRAW[name] ?? DRAW.concrete)(g, 256);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  cache.set(name, t);
  return t;
}

// 'tex:xxx' → 照片贴图；'p:xxx' → 程序贴图
export function texture(ref: string): THREE.Texture {
  if (ref.startsWith('tex:')) return imageTexture(ref) ?? proc('concrete');
  return proc(ref.replace(/^p:/, ''));
}

// 小物件图标（拾取物、钥匙）
export function iconTexture(kind: string): THREE.Texture {
  const id = `icon:${kind}`;
  if (cache.has(id)) return cache.get(id)!;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const glow = (color: string) => {
    const grd = g.createRadialGradient(64, 70, 4, 64, 70, 60);
    grd.addColorStop(0, color);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
  };
  if (kind.startsWith('key_')) {
    const col = kind === 'key_red' ? '#e0302a' : kind === 'key_blue' ? '#2f7cff' : '#f0c030';
    glow(col.replace(')', '') + '66');
    g.fillStyle = col; g.fillRect(34, 50, 60, 38);
    g.fillStyle = '#111'; g.fillRect(40, 58, 26, 6); g.fillRect(40, 70, 40, 4);
    g.fillStyle = '#ddd'; g.fillRect(74, 56, 12, 12);
  } else if (kind === 'ammo' || kind === 'mg_ammo' || kind === 'cryo_ammo') {
    glow('rgba(255,200,80,0.35)');
    g.fillStyle = kind === 'cryo_ammo' ? '#2a6f80' : '#3f4a2c'; g.fillRect(28, 66, 72, 40);
    g.fillStyle = kind === 'cryo_ammo' ? '#7ff' : '#d8b048';
    for (let i = 0; i < 5; i++) g.fillRect(34 + i * 13, kind === 'mg_ammo' ? 44 : 50, 8, 18);
    g.fillStyle = '#111'; g.font = 'bold 14px sans-serif'; g.fillText(kind === 'mg_ammo' ? '7.62' : kind === 'cryo_ammo' ? 'CRYO' : '9mm', 40, 92);
  } else if (kind === 'herb') {
    glow('rgba(90,220,90,0.35)');
    g.fillStyle = '#6a4a30'; g.fillRect(48, 86, 32, 22);
    g.fillStyle = '#3c9a3a';
    for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(64 + Math.cos(i) * 14, 70 - i * 4, 8, 20, Math.cos(i) * 0.6, 0, 7); g.fill(); }
  } else if (kind === 'medkit') {
    glow('rgba(255,255,255,0.3)');
    g.fillStyle = '#e8e8e8'; g.fillRect(30, 56, 68, 48);
    g.fillStyle = '#d02020'; g.fillRect(58, 62, 12, 36); g.fillRect(46, 74, 36, 12);
  } else if (kind === 'armor') {
    glow('rgba(80,160,255,0.35)');
    g.fillStyle = '#2b3440'; g.beginPath(); g.moveTo(36, 40); g.lineTo(92, 40); g.lineTo(98, 104); g.lineTo(30, 104); g.closePath(); g.fill();
    g.fillStyle = '#ccd'; g.font = 'bold 13px sans-serif'; g.fillText('NBER', 47, 76);
  } else if (kind === 'weapon_mg' || kind === 'weapon_cryo') {
    glow(kind === 'weapon_mg' ? 'rgba(255,170,60,0.4)' : 'rgba(80,240,255,0.45)');
    g.fillStyle = '#333'; g.fillRect(14, 64, 100, 16); g.fillRect(40, 78, 16, 26);
    g.fillStyle = kind === 'weapon_mg' ? '#a08040' : '#5ff'; g.fillRect(64, 58, 30, 10);
  } else if (kind === 'proj_red' || kind === 'proj_rock' || kind === 'proj_bug' || kind === 'proj_blue') {
    const col = kind === 'proj_red' ? '255,60,30' : kind === 'proj_blue' ? '90,220,255' : kind === 'proj_bug' ? '200,40,30' : '120,100,80';
    const grd = g.createRadialGradient(64, 64, 2, 64, 64, 60);
    grd.addColorStop(0, `rgba(255,240,220,1)`);
    grd.addColorStop(0.25, `rgba(${col},0.95)`);
    grd.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  } else if (kind === 'blood') {
    const grd = g.createRadialGradient(64, 64, 4, 64, 64, 60);
    grd.addColorStop(0, 'rgba(90,0,0,0.95)');
    grd.addColorStop(0.6, 'rgba(60,0,0,0.6)');
    grd.addColorStop(1, 'rgba(30,0,0,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  } else if (kind === 'shadow') {
    const grd = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    grd.addColorStop(0, 'rgba(0,0,0,0.7)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  } else if (kind === 'warn') {
    g.strokeStyle = 'rgba(255,40,20,0.9)'; g.lineWidth = 6; g.beginPath(); g.arc(64, 64, 56, 0, 7); g.stroke();
    g.fillStyle = 'rgba(255,40,20,0.25)'; g.beginPath(); g.arc(64, 64, 56, 0, 7); g.fill();
  } else if (kind === 'mask') {
    glow('rgba(255,200,120,0.35)');
    g.fillStyle = '#c8a070'; g.beginPath(); g.ellipse(64, 64, 34, 44, 0, 0, 7); g.fill();
    g.fillStyle = '#5a1a10'; g.beginPath(); g.ellipse(50, 56, 8, 5, 0, 0, 7); g.ellipse(78, 56, 8, 5, 0, 0, 7); g.fill();
    g.fillStyle = '#a02010'; g.fillRect(52, 84, 24, 6);
  } else if (kind === 'serum') {
    glow('rgba(255,40,40,0.5)');
    g.fillStyle = '#ddd'; g.fillRect(56, 30, 16, 10);
    g.fillStyle = '#c01818'; g.fillRect(52, 40, 24, 56);
  } else if (kind === 'doc') {
    glow('rgba(255,230,160,0.35)');
    g.fillStyle = '#d8cfb0'; g.fillRect(36, 36, 56, 72);
    g.fillStyle = '#555'; for (let y = 48; y < 100; y += 9) g.fillRect(42, y, 44, 3);
  } else {
    glow('rgba(255,255,255,0.4)');
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  cache.set(id, t);
  return t;
}
