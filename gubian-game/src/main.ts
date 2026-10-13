import './style.css';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { audio } from './core/audio';
import { Game, Settings } from './game/game';
import { chapterOne } from './game/story';

const SETTINGS_KEY = 'gubian.settings';
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (isTouch) document.body.classList.add('touch');

function loadSettings(): Settings {
  const defaults: Settings = { quality: isTouch ? 'low' : 'mid', sensitivity: 1, volume: 0.8, aimAssist: isTouch };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
}

function saveSettings(s: Settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* 隐私模式下忽略 */
  }
}

if (Capacitor.isNativePlatform()) {
  StatusBar.hide().catch(() => {});
}

const settings = loadSettings();
const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const game = new Game(canvas, settings);
audio.volume = settings.volume;

const screens = ['menu', 'pause', 'dead', 'ended', 'settings', 'controls'] as const;
type Screen = (typeof screens)[number];
let settingsReturn: Screen = 'menu';

function show(name: Screen | null) {
  for (const s of screens) document.getElementById(s)!.classList.toggle('on', s === name);
}

game.onStateChange = (s) => {
  if (s === 'paused') show('pause');
  else if (s === 'dead') show('dead');
  else if (s === 'ended') {
    const st = game.stats;
    const secs = Math.round((performance.now() - st.start) / 1000);
    document.getElementById('stats')!.innerHTML =
      `通关用时　${Math.floor(secs / 60)} 分 ${secs % 60} 秒<br>` +
      `击倒蛊化者　${st.kills}<br>` +
      `爆头　${st.headshots}<br>` +
      `命中率　${st.shots ? Math.round((st.hits / st.shots) * 100) : 0}%`;
    show('ended');
  } else if (s === 'playing') show(null);
};

// ---------- 设置 ----------
const q = document.querySelector<HTMLSelectElement>('#s-quality')!;
const sens = document.querySelector<HTMLInputElement>('#s-sens')!;
const vol = document.querySelector<HTMLInputElement>('#s-vol')!;
const assist = document.querySelector<HTMLInputElement>('#s-assist')!;
q.value = settings.quality;
sens.value = String(settings.sensitivity);
vol.value = String(settings.volume);
assist.checked = settings.aimAssist;
const onSettings = () => {
  settings.quality = q.value as Settings['quality'];
  settings.sensitivity = Number(sens.value);
  settings.volume = Number(vol.value);
  settings.aimAssist = assist.checked;
  saveSettings(settings);
  game.applySettings();
};
[q, sens, vol, assist].forEach((el) => el.addEventListener('input', onSettings));

// ---------- 按钮 ----------
let started = false;
document.querySelectorAll<HTMLButtonElement>('.screen button').forEach((b) => {
  b.addEventListener('click', () => {
    const act = b.dataset.act;
    const from = b.closest('.screen')!.id as Screen;
    audio.init();
    switch (act) {
      case 'start':
        if (started) return;
        started = true;
        show(null);
        startGame();
        break;
      case 'settings':
        settingsReturn = from;
        show('settings');
        break;
      case 'controls':
        settingsReturn = from;
        show('controls');
        break;
      case 'back':
        show(settingsReturn);
        break;
      case 'resume':
        game.resume();
        break;
      case 'checkpoint':
        show(null);
        game.respawn();
        break;
      case 'quit':
        location.reload();
        break;
    }
  });
});

async function startGame() {
  audio.init();
  audio.startAmbient();
  if (isTouch) {
    // 安卓浏览器中尝试全屏横屏（App 内已由原生层锁定）
    try {
      await document.documentElement.requestFullscreen?.();
      await (screen.orientation as unknown as { lock?: (o: string) => Promise<void> }).lock?.('landscape');
    } catch {
      /* 不支持时忽略 */
    }
  }
  game.stats.start = performance.now();
  game.setState('playing');
  chapterOne(game).catch((e) => console.error(e));
}

game.start();
document.getElementById('loading')!.remove();

// 调试：?debug 时暴露游戏对象，便于自动化测试
if (location.search.includes('debug')) (window as unknown as { __game: Game }).__game = game;
