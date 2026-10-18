/* 浏览器端素材分析：只做低层信号统计，不调用任何识别模型。
 *   画面：按自适应帧率逐帧 seek → 64 宽缩略图 → 色相/亮度直方图、反差、饱和、冷暖、帧间差（运动代理）
 *   声音：解码为 16kHz 单声道 → 50ms 帧 RMS；FFT 计算语音频带占比与频谱平坦度 → 对白概率
 *   缩略条：约每秒一张 96×54 JPEG，供时间轴和镜头池显示
 * 桌面版可把同一套统计换成 ffmpeg 解码，下游算法不变。 */
(function (g) {
  'use strict';
  const SC = (g.SC = g.SC || {});

  function once(el, ev, timeout) {
    return new Promise((res, rej) => {
      let to;
      const ok = () => { clearTimeout(to); el.removeEventListener('error', bad); res(); };
      const bad = () => { clearTimeout(to); el.removeEventListener(ev, ok); rej(new Error('媒体解码失败')); };
      el.addEventListener(ev, ok, { once: true });
      el.addEventListener('error', bad, { once: true });
      if (timeout) to = setTimeout(() => { el.removeEventListener(ev, ok); el.removeEventListener('error', bad); res('timeout'); }, timeout);
    });
  }

  async function seek(video, t) {
    if (Math.abs(video.currentTime - t) < 1e-3 && video.readyState >= 2) return;
    video.currentTime = t;
    await once(video, 'seeked', 4000);
  }

  /** 单帧统计 */
  function frameStats(data, n) {
    const hue = new Float32Array(12), lum = new Float32Array(8);
    const L = new Float32Array(n);
    let sumL = 0, sumL2 = 0, sumS = 0, sumW = 0;
    for (let p = 0, i = 0; p < n; p++, i += 4) {
      const r = data[i], g2 = data[i + 1], b = data[i + 2];
      const max = Math.max(r, g2, b), min = Math.min(r, g2, b);
      const l = (0.2126 * r + 0.7152 * g2 + 0.0722 * b) / 255;
      L[p] = l;
      sumL += l; sumL2 += l * l;
      const s = max ? (max - min) / max : 0;
      sumS += s;
      sumW += (r - b) / 255;
      lum[Math.min(7, (l * 8) | 0)]++;
      if (max - min > 8) {
        let h;
        const d = max - min;
        if (max === r) h = ((g2 - b) / d + 6) % 6;
        else if (max === g2) h = (b - r) / d + 2;
        else h = (r - g2) / d + 4;
        hue[Math.min(11, (h * 2) | 0)] += s * (max / 255);
      }
    }
    const hist = new Array(20);
    for (let k = 0; k < 12; k++) hist[k] = hue[k] / n;
    for (let k = 0; k < 8; k++) hist[12 + k] = lum[k] / n;
    const mean = sumL / n;
    return { hist, luma: mean, lstd: Math.sqrt(Math.max(0, sumL2 / n - mean * mean)), sat: sumS / n, warm: sumW / n, L };
  }

  /* ---------- 音频 ---------- */

  function fft(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < len / 2; k++) {
          const a = i + k, b = a + len / 2;
          const xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
          re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
          const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
        }
      }
    }
  }

  /** PCM → {rate:20, rms[], speech[]}：语音判据 = 响度高于底噪 + 300–3400Hz 能量占比高 + 频谱不平坦（非噪声/非白噪） */
  SC.audioFeatures = function (pcm, sr) {
    const hop = Math.round(sr / 20), N = 512;
    const frames = Math.floor(pcm.length / hop);
    const rms = new Array(frames), band = new Array(frames), flat = new Array(frames);
    const re = new Float64Array(N), im = new Float64Array(N);
    const win = new Float64Array(N).map((_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)));
    const lo = Math.round((300 * N) / sr), hi = Math.round((3400 * N) / sr);
    for (let f = 0; f < frames; f++) {
      const a = f * hop;
      let s = 0;
      for (let i = 0; i < hop; i++) { const v = pcm[a + i] || 0; s += v * v; }
      rms[f] = Math.sqrt(s / hop);
      const c = a + (hop >> 1) - (N >> 1);
      for (let i = 0; i < N; i++) { re[i] = (pcm[c + i] || 0) * win[i]; im[i] = 0; }
      fft(re, im);
      let tot = 0, inb = 0, logSum = 0, cnt = 0;
      for (let k = 2; k < N / 2; k++) {
        const p = re[k] * re[k] + im[k] * im[k] + 1e-12;
        tot += p;
        if (k >= lo && k <= hi) inb += p;
        logSum += Math.log(p); cnt++;
      }
      band[f] = inb / tot;
      flat[f] = Math.exp(logSum / cnt) / (tot / cnt);
    }
    const floor = Math.max(1e-4, SC.median(rms.slice().sort((x, y) => x - y).slice(0, Math.max(1, frames >> 3))));
    const raw = rms.map((r, f) => (r > floor * 3 && r > 0.004 && band[f] > 0.55 && flat[f] < 0.35 ? 1 : 0));
    // 5 帧中值平滑，去掉孤立误判
    const speech = raw.map((_, f) => {
      let s = 0;
      for (let k = -2; k <= 2; k++) s += raw[SC.clamp(f + k, 0, frames - 1)] || 0;
      return s >= 3 ? 1 : 0;
    });
    return { rate: 20, rms: rms.map((v) => +v.toFixed(4)), speech };
  };

  async function decodeAudio(file) {
    if (file.size > 700 * 1024 * 1024) return null;
    const buf = await file.arrayBuffer();
    const Ctx = g.OfflineAudioContext || g.webkitOfflineAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx(1, 16000, 16000);
    let ab;
    try { ab = await ctx.decodeAudioData(buf); } catch (e) { return null; }
    const len = ab.length, ch = ab.numberOfChannels;
    const pcm = new Float32Array(len);
    for (let c = 0; c < ch; c++) { const d = ab.getChannelData(c); for (let i = 0; i < len; i++) pcm[i] += d[i] / ch; }
    return SC.audioFeatures(pcm, ab.sampleRate);
  }

  /** 读元数据（时长、尺寸）+ 封面 */
  SC.probeMedia = async function (media) {
    const v = document.createElement('video');
    v.muted = true; v.preload = 'metadata'; v.playsInline = true; v.src = media.url;
    await once(v, 'loadedmetadata', 15000);
    media.duration = isFinite(v.duration) ? v.duration : 0;
    media.width = v.videoWidth; media.height = v.videoHeight;
    try {
      await seek(v, Math.min(media.duration * 0.15, 2));
      const c = document.createElement('canvas'); c.width = 160; c.height = 90;
      drawFit(c.getContext('2d'), v, 160, 90);
      media.thumb = c.toDataURL('image/jpeg', 0.7);
    } catch (e) { /* 封面失败不影响分析 */ }
    v.removeAttribute('src'); v.load();
    return media;
  };

  function drawFit(ctx, v, W, H) {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const s = Math.min(W / (v.videoWidth || W), H / (v.videoHeight || H));
    const w = (v.videoWidth || W) * s, h = (v.videoHeight || H) * s;
    ctx.drawImage(v, (W - w) / 2, (H - h) / 2, w, h);
  }

  /** 完整分析。opts: {onProgress(f), signal:{cancelled}} */
  SC.analyzeMedia = async function (media, opts) {
    opts = opts || {};
    const prog = opts.onProgress || (() => {});
    const v = document.createElement('video');
    v.muted = true; v.preload = 'auto'; v.playsInline = true; v.src = media.url;
    await once(v, 'loadedmetadata', 15000);
    const dur = (media.duration = isFinite(v.duration) ? v.duration : media.duration || 0);
    media.width = v.videoWidth; media.height = v.videoHeight;
    const fps = SC.clamp(480 / Math.max(dur, 0.1), 2, 8);
    const dt = 1 / fps;
    const W = 64, H = SC.clamp(Math.round((64 * (v.videoHeight || 9)) / (v.videoWidth || 16)), 16, 64);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const tc = document.createElement('canvas'); tc.width = 96; tc.height = 54;
    const tctx = tc.getContext('2d');
    const S = { t: [], hist: [], luma: [], lstd: [], sat: [], warm: [], motion: [], fps };
    const strip = [];
    let prevL = null, nextThumb = 0;
    const thumbEvery = Math.max(1, dur / 120);
    const n = Math.max(2, Math.floor(dur / dt) + 1);
    for (let i = 0; i < n; i++) {
      if (opts.signal && opts.signal.cancelled) throw new Error('已取消');
      const t = Math.min(i * dt, Math.max(0, dur - 0.04));
      await seek(v, t);
      ctx.drawImage(v, 0, 0, W, H);
      const st = frameStats(ctx.getImageData(0, 0, W, H).data, W * H);
      let motion = 0;
      if (prevL) { let s = 0; for (let p = 0; p < st.L.length; p++) s += Math.abs(st.L[p] - prevL[p]); motion = s / st.L.length / Math.sqrt(dt / 0.25); }
      prevL = st.L;
      S.t.push(+t.toFixed(3)); S.hist.push(st.hist.map((x) => +x.toFixed(4)));
      S.luma.push(+st.luma.toFixed(4)); S.lstd.push(+st.lstd.toFixed(4)); S.sat.push(+st.sat.toFixed(4)); S.warm.push(+st.warm.toFixed(4)); S.motion.push(+motion.toFixed(4));
      if (t >= nextThumb) {
        drawFit(tctx, v, 96, 54);
        strip.push({ t: +t.toFixed(2), src: tc.toDataURL('image/jpeg', 0.6) });
        nextThumb += thumbEvery;
      }
      if (i % 4 === 0) prog((0.8 * i) / n);
    }
    v.removeAttribute('src'); v.load();
    media.samples = S;
    media.strip = strip;
    if (!media.thumb && strip.length) media.thumb = strip[Math.floor(strip.length * 0.15)].src;
    prog(0.82);
    try { media.audio = media.file ? await decodeAudio(media.file) : null; } catch (e) { media.audio = null; }
    prog(1);
    return media;
  };

  /** 取素材某时刻最近的缩略图 */
  SC.thumbAt = function (media, t) {
    const s = media && media.strip;
    if (!s || !s.length) return media ? media.thumb : null;
    let best = s[0];
    for (const x of s) if (Math.abs(x.t - t) < Math.abs(best.t - t)) best = x;
    return best.src;
  };
})(typeof window !== 'undefined' ? window : globalThis);
