import * as THREE from 'three';

// 全部贴图在运行时用 Canvas 程序化生成，不依赖外部美术资源。
function canvasTex(size: number, draw: (g: CanvasRenderingContext2D, s: number) => void, repeat = 1) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function noise(g: CanvasRenderingContext2D, s: number, amount: number, alpha = 0.08) {
  for (let i = 0; i < amount; i++) {
    const v = Math.random() * 255;
    g.fillStyle = `rgba(${v},${v},${v},${alpha})`;
    g.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 3, 1 + Math.random() * 3);
  }
}

function stains(g: CanvasRenderingContext2D, s: number, n: number, color: string) {
  for (let i = 0; i < n; i++) {
    const x = Math.random() * s, y = Math.random() * s, r = 6 + Math.random() * s * 0.12;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, color);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

export function makeTextures() {
  const deck = canvasTex(256, (g, s) => {
    g.fillStyle = '#3a2c20';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? '#41311f' : '#36281c';
      g.fillRect(0, (i * s) / 8, s, s / 8 - 2);
      g.fillStyle = '#1b130c';
      g.fillRect(0, ((i + 1) * s) / 8 - 2, s, 2);
    }
    noise(g, s, 3000, 0.06);
    stains(g, s, 4, 'rgba(20,30,30,0.5)');
  });

  const carpet = canvasTex(256, (g, s) => {
    g.fillStyle = '#3d0f12';
    g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(160,120,50,0.35)';
    g.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const x = i * 64 + 32, y = j * 64 + 32;
        g.beginPath();
        g.moveTo(x, y - 20); g.lineTo(x + 20, y); g.lineTo(x, y + 20); g.lineTo(x - 20, y); g.closePath();
        g.stroke();
      }
    }
    noise(g, s, 5000, 0.07);
    stains(g, s, 5, 'rgba(10,0,0,0.6)');
  });

  const wallpaper = canvasTex(256, (g, s) => {
    g.fillStyle = '#2e2a22';
    g.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x += 32) {
      g.fillStyle = 'rgba(120,100,60,0.18)';
      g.fillRect(x, 0, 3, s);
    }
    g.fillStyle = '#1a1510';
    g.fillRect(0, s * 0.72, s, s * 0.28);
    g.fillStyle = 'rgba(150,120,60,0.4)';
    g.fillRect(0, s * 0.72, s, 4);
    noise(g, s, 4000, 0.06);
    stains(g, s, 6, 'rgba(0,0,0,0.45)');
    // 血手印般的朱砂污迹
    stains(g, s, 2, 'rgba(120,10,5,0.5)');
  });

  const metal = canvasTex(256, (g, s) => {
    g.fillStyle = '#3b4143';
    g.fillRect(0, 0, s, s);
    g.strokeStyle = '#22272a';
    g.lineWidth = 4;
    g.strokeRect(2, 2, s - 4, s - 4);
    g.fillStyle = '#5b6164';
    for (const [x, y] of [[10, 10], [s - 14, 10], [10, s - 14], [s - 14, s - 14]]) {
      g.beginPath(); g.arc(x + 2, y + 2, 4, 0, Math.PI * 2); g.fill();
    }
    noise(g, s, 4000, 0.08);
    stains(g, s, 8, 'rgba(90,50,20,0.35)');
  });

  const tile = canvasTex(256, (g, s) => {
    g.fillStyle = '#8b9192';
    g.fillRect(0, 0, s, s);
    g.strokeStyle = '#3e4344';
    g.lineWidth = 3;
    for (let i = 0; i <= 4; i++) {
      g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, s); g.stroke();
      g.beginPath(); g.moveTo(0, i * 64); g.lineTo(s, i * 64); g.stroke();
    }
    noise(g, s, 4000, 0.08);
    stains(g, s, 6, 'rgba(110,8,4,0.55)');
    stains(g, s, 6, 'rgba(0,0,0,0.4)');
  });

  const frost = canvasTex(256, (g, s) => {
    g.fillStyle = '#9fb6c0';
    g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * s, y = Math.random() * s, l = 4 + Math.random() * 18, a = Math.random() * Math.PI;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    noise(g, s, 3000, 0.1);
  });

  const ceiling = canvasTex(128, (g, s) => {
    g.fillStyle = '#1d1d1b';
    g.fillRect(0, 0, s, s);
    g.strokeStyle = '#111';
    g.strokeRect(0, 0, s, s);
    noise(g, s, 1500, 0.05);
  });

  // 蛊化者皮肤：苍白皮肤 + 朱砂色脉络
  const infectedSkin = canvasTex(256, (g, s) => {
    g.fillStyle = '#8c8577';
    g.fillRect(0, 0, s, s);
    noise(g, s, 3000, 0.1);
    g.strokeStyle = 'rgba(200,30,20,0.9)';
    for (let i = 0; i < 28; i++) {
      let x = Math.random() * s, y = Math.random() * s;
      g.lineWidth = 1 + Math.random() * 2.5;
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 8; k++) {
        x += (Math.random() - 0.5) * 30; y += (Math.random() - 0.3) * 24;
        g.lineTo(x, y);
      }
      g.stroke();
    }
  });

  // 只有脉络的发光贴图（勘察镜下高亮）
  const veinsEmissive = canvasTex(256, (g, s) => {
    g.fillStyle = '#000';
    g.fillRect(0, 0, s, s);
    g.strokeStyle = '#ff3a1a';
    for (let i = 0; i < 28; i++) {
      let x = Math.random() * s, y = Math.random() * s;
      g.lineWidth = 1 + Math.random() * 2.5;
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 8; k++) {
        x += (Math.random() - 0.5) * 30; y += (Math.random() - 0.3) * 24;
        g.lineTo(x, y);
      }
      g.stroke();
    }
  });

  const suit = canvasTex(128, (g, s) => {
    g.fillStyle = '#16171b';
    g.fillRect(0, 0, s, s);
    noise(g, s, 1500, 0.08);
    stains(g, s, 3, 'rgba(110,10,5,0.7)');
  });

  return { deck, carpet, wallpaper, metal, tile, frost, ceiling, infectedSkin, veinsEmissive, suit };
}

export type Textures = ReturnType<typeof makeTextures>;
