// 程序化音效：全部由 WebAudio 合成（江水、低频氛围、枪声、嘶吼、铜铃、心跳……）
export class Audio {
  ctx: AudioContext | null = null;
  master!: GainNode;
  sfx!: GainNode;
  amb!: GainNode;
  private noiseBuf!: AudioBuffer;
  private heartTimer = 0;
  private ambientStarted = false;
  volume = 0.8;

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    const comp = this.ctx.createDynamicsCompressor();
    this.master.connect(comp).connect(this.ctx.destination);
    this.sfx = this.ctx.createGain();
    this.sfx.connect(this.master);
    this.amb = this.ctx.createGain();
    this.amb.gain.value = 0.55;
    this.amb.connect(this.master);
    const len = this.ctx.sampleRate * 2;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.ctx) this.master.gain.value = v;
  }

  setListener(x: number, y: number, z: number, fx: number, fz: number) {
    if (!this.ctx) return;
    const l = this.ctx.listener;
    if (l.positionX) {
      l.positionX.value = x; l.positionY.value = y; l.positionZ.value = z;
      l.forwardX.value = fx; l.forwardY.value = 0; l.forwardZ.value = fz;
      l.upX.value = 0; l.upY.value = 1; l.upZ.value = 0;
    } else {
      l.setPosition(x, y, z);
      l.setOrientation(fx, 0, fz, 0, 1, 0);
    }
  }

  out(pos?: { x: number; y: number; z: number }): AudioNode {
    if (!pos || !this.ctx) return this.sfx;
    const p = this.ctx.createPanner();
    p.panningModel = 'HRTF';
    p.distanceModel = 'inverse';
    p.refDistance = 2;
    p.maxDistance = 60;
    p.rolloffFactor = 1.4;
    p.positionX.value = pos.x; p.positionY.value = pos.y; p.positionZ.value = pos.z;
    p.connect(this.sfx);
    return p;
  }

  noise(dur: number, dest: AudioNode, filterType: BiquadFilterType, freq: number, gain: number, q = 1, attack = 0.002) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = filterType; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(dest);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
    return f;
  }

  tone(type: OscillatorType, f0: number, f1: number, dur: number, gain: number, dest: AudioNode, delay = 0) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = type;
    const g = ctx.createGain();
    const t = ctx.currentTime + delay;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  startAmbient() {
    if (!this.ctx || this.ambientStarted) return;
    this.ambientStarted = true;
    const ctx = this.ctx;
    // 江水：低通噪声 + 缓慢起伏
    const water = ctx.createBufferSource();
    water.buffer = this.noiseBuf; water.loop = true;
    const wf = ctx.createBiquadFilter(); wf.type = 'lowpass'; wf.frequency.value = 420;
    const wg = ctx.createGain(); wg.gain.value = 0.25;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.13;
    const lg = ctx.createGain(); lg.gain.value = 0.12;
    lfo.connect(lg).connect(wg.gain);
    water.connect(wf).connect(wg).connect(this.amb);
    water.start(); lfo.start();
    // 不协和低频嗡鸣
    for (const [f, v] of [[41.2, 0.18], [43.6, 0.12], [61.7, 0.06], [92.5, 0.03]] as const) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
      const flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 180;
      const g = ctx.createGain(); g.gain.value = v;
      o.connect(flt).connect(g).connect(this.amb);
      o.start();
    }
    // 船体金属呻吟，随机出现
    const creak = () => {
      if (!this.ctx) return;
      this.tone('triangle', 70 + Math.random() * 60, 40 + Math.random() * 30, 2.5, 0.05, this.amb);
      setTimeout(creak, 7000 + Math.random() * 12000);
    };
    setTimeout(creak, 5000);
  }

  setAmbientLevel(v: number) {
    if (this.ctx) this.amb.gain.setTargetAtTime(v, this.ctx.currentTime, 0.8);
  }

  gunshot() {
    if (!this.ctx) return;
    this.noise(0.35, this.sfx, 'lowpass', 2600, 1.0, 0.7);
    this.noise(0.08, this.sfx, 'highpass', 3000, 0.5);
    this.tone('sine', 140, 40, 0.25, 0.9, this.sfx);
  }

  dryFire() {
    if (!this.ctx) return;
    this.noise(0.04, this.sfx, 'bandpass', 3500, 0.4, 4);
  }

  reload() {
    if (!this.ctx) return;
    this.noise(0.05, this.sfx, 'bandpass', 2000, 0.4, 5);
    setTimeout(() => this.ctx && this.noise(0.06, this.sfx, 'bandpass', 1400, 0.5, 5), 450);
    setTimeout(() => this.ctx && this.noise(0.05, this.sfx, 'bandpass', 2600, 0.5, 6), 1000);
  }

  step(exterior: boolean) {
    if (!this.ctx) return;
    this.noise(0.12, this.sfx, 'lowpass', exterior ? 500 : 750, 0.13, 1);
  }

  groan(pos: { x: number; y: number; z: number }, pitch = 1, loud = 0.5) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const dest = this.out(pos);
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    const base = (70 + Math.random() * 40) * pitch;
    const t = ctx.currentTime, dur = 1.2 + Math.random() * 1.2;
    o.frequency.setValueAtTime(base, t);
    o.frequency.linearRampToValueAtTime(base * (0.7 + Math.random() * 0.5), t + dur);
    const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 500 + Math.random() * 300; f1.Q.value = 6;
    const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1100 + Math.random() * 400; f2.Q.value = 8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(loud, t + 0.25);
    g.gain.linearRampToValueAtTime(0, t + dur);
    const vib = ctx.createOscillator(); vib.frequency.value = 5 + Math.random() * 6;
    const vg = ctx.createGain(); vg.gain.value = base * 0.06;
    vib.connect(vg).connect(o.frequency);
    o.connect(f1).connect(g);
    o.connect(f2).connect(g);
    g.connect(dest);
    o.start(t); vib.start(t);
    o.stop(t + dur + 0.1); vib.stop(t + dur + 0.1);
    this.noise(dur * 0.8, dest, 'bandpass', 900, loud * 0.25, 2, 0.2);
  }

  roar(pos: { x: number; y: number; z: number }) {
    this.groan(pos, 0.5, 1.0);
    this.groan(pos, 0.7, 0.7);
  }

  hitFlesh(pos?: { x: number; y: number; z: number }) {
    if (!this.ctx) return;
    this.noise(0.15, this.out(pos), 'lowpass', 900, 0.6, 2);
  }

  playerHurt() {
    if (!this.ctx) return;
    this.tone('sawtooth', 180, 90, 0.3, 0.25, this.sfx);
    this.noise(0.25, this.sfx, 'lowpass', 600, 0.5);
  }

  // 铜铃：非谐波泛音叠加，长衰减
  bell(pos?: { x: number; y: number; z: number }, gain = 0.6) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const dest = this.out(pos);
    const base = 1180;
    for (const [ratio, amp, dur] of [[1, 1, 3], [2.32, 0.5, 2.2], [4.25, 0.3, 1.4], [5.4, 0.18, 1], [0.5, 0.25, 3.5]] as const) {
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.value = base * ratio * (1 + (Math.random() - 0.5) * 0.004);
      const g = ctx.createGain();
      const t = ctx.currentTime;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain * amp * 0.3, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(dest);
      o.start(t); o.stop(t + dur + 0.05);
    }
  }

  bellRing(pos?: { x: number; y: number; z: number }) {
    for (let i = 0; i < 4; i++) setTimeout(() => this.bell(pos, 0.7 - i * 0.12), i * 220);
  }

  // 惊吓音效：不协和弦 + 高频嘶声
  stinger() {
    if (!this.ctx) return;
    for (const f of [233, 247, 349, 370]) this.tone('sawtooth', f, f * 0.96, 2.2, 0.06, this.sfx);
    this.noise(1.5, this.sfx, 'highpass', 4000, 0.15, 1, 0.6);
  }

  scan() {
    if (!this.ctx) return;
    this.tone('sine', 400, 1600, 0.4, 0.15, this.sfx);
    this.tone('sine', 800, 3200, 0.4, 0.06, this.sfx, 0.05);
  }

  flash() {
    if (!this.ctx) return;
    this.noise(0.4, this.sfx, 'highpass', 5000, 0.25, 1, 0.02);
    this.tone('square', 2400, 900, 0.15, 0.05, this.sfx);
  }

  pickup() {
    if (!this.ctx) return;
    this.tone('triangle', 660, 990, 0.18, 0.18, this.sfx);
  }

  door() {
    if (!this.ctx) return;
    this.tone('sawtooth', 90, 60, 1.6, 0.08, this.sfx);
    this.noise(1.4, this.sfx, 'lowpass', 300, 0.3, 1, 0.2);
  }

  explosion(pos?: { x: number; y: number; z: number }) {
    if (!this.ctx) return;
    const d = this.out(pos);
    this.noise(1.8, d, 'lowpass', 900, 1.2, 0.5);
    this.noise(1.2, d, 'highpass', 3000, 0.4, 1, 0.01);
    this.tone('sine', 90, 25, 1.2, 1.0, d);
  }

  impact() {
    if (!this.ctx) return;
    this.tone('sine', 55, 20, 2.5, 1.2, this.sfx);
    this.noise(2.5, this.sfx, 'lowpass', 400, 1.0, 0.5);
  }

  radio() {
    if (!this.ctx) return;
    this.noise(0.25, this.sfx, 'bandpass', 2200, 0.12, 3);
  }

  heartbeat(dt: number, intensity: number) {
    if (!this.ctx || intensity <= 0) return;
    this.heartTimer -= dt;
    if (this.heartTimer <= 0) {
      this.heartTimer = 1.1 - intensity * 0.5;
      this.tone('sine', 62, 40, 0.18, 0.5 * intensity, this.sfx);
      this.tone('sine', 55, 36, 0.18, 0.35 * intensity, this.sfx, 0.22);
    }
  }

  // ---------- 采样音效（用户提供的 wav）----------
  private samples = new Map<string, AudioBuffer>();
  async loadSamples(names: string[], base: string) {
    if (!this.ctx) return;
    await Promise.all(names.map(async (n) => {
      try {
        const r = await fetch(`${base}${n}.wav`);
        const buf = await this.ctx!.decodeAudioData(await r.arrayBuffer());
        this.samples.set(n, buf);
      } catch {
        /* 缺失时回退到合成音效 */
      }
    }));
  }

  sample(name: string, gain = 0.8, rate = 1, pos?: { x: number; y: number; z: number }) {
    if (!this.ctx) return false;
    const b = this.samples.get(name);
    if (!b) return false;
    const src = this.ctx.createBufferSource();
    src.buffer = b;
    src.playbackRate.value = rate;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    src.connect(g).connect(this.out(pos));
    src.start();
    return true;
  }

  // 跳脸惊吓：撕裂尖叫 + 低频冲击
  scream() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    for (const [f, v] of [[620, 0.35], [910, 0.25], [1400, 0.15]] as const) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 0.55, t + 1.1);
      const vib = ctx.createOscillator();
      vib.frequency.value = 23;
      const vg = ctx.createGain();
      vg.gain.value = f * 0.08;
      vib.connect(vg).connect(o.frequency);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(v, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
      o.connect(g).connect(this.sfx);
      o.start(t); vib.start(t);
      o.stop(t + 1.3); vib.stop(t + 1.3);
    }
    this.noise(1.0, this.sfx, 'highpass', 2500, 0.6, 0.7, 0.01);
    this.tone('sine', 70, 25, 0.9, 1.2, this.sfx);
  }

  whisper() {
    if (!this.ctx) return;
    for (let i = 0; i < 3; i++) setTimeout(() => this.ctx && this.noise(0.6, this.amb, 'bandpass', 1800 + Math.random() * 1500, 0.12, 8, 0.2), i * 380);
  }
}

export const audio = new Audio();
