import './style.css';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { audio } from './core/audio';
import { loadAll, artUrl } from './core/assets';
import { Game, Settings, ChapterStats } from './game/game';
import { CHAPTERS, SIDE, Chapter } from './chapters';
import { IS_MOBILE, SAVE_KEY } from './platform';

document.body.classList.add(IS_MOBILE ? 'mobile' : 'desktop');

interface Save {
  unlocked: number; // 已解锁的最高章节（1 起）
  current: number;
  side: number; // 联动支线已解锁到第几幕
  sideCur: number;
  choices: Record<string, number>;
  settings: Settings;
}

const defaults: Settings = { quality: IS_MOBILE ? 'low' : 'mid', sensitivity: 1, volume: 0.8, aimAssist: IS_MOBILE, easyQte: IS_MOBILE, subtitleSize: 1 };

function loadSave(): Save {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as Save;
      return { ...{ unlocked: 1, current: 1, side: 1, sideCur: 1, choices: {} }, ...s, settings: { ...defaults, ...s.settings } };
    }
  } catch { /* 忽略损坏的存档 */ }
  return { unlocked: 1, current: 1, side: 1, sideCur: 1, choices: {}, settings: { ...defaults } };
}
const save = loadSave();
const persist = () => {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* 隐私模式 */ }
};

if (Capacitor.isNativePlatform()) StatusBar.hide().catch(() => {});

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const game = new Game(canvas, save.settings);
game.applySettings();

const SCREENS = ['menu', 'chapters', 'side', 'pause', 'dead', 'inter', 'ending', 'settings', 'controls'] as const;
type Screen = (typeof SCREENS)[number];
let back: Screen = 'menu';
const show = (n: Screen | null) => SCREENS.forEach((s) => document.getElementById(s)!.classList.toggle('on', s === n));
const $ = (id: string) => document.getElementById(id)!;

// 版本名称：安卓 App / Windows·Mac 安装版 / 网页版（Mac、iPhone、iPad 等）
const ua = navigator.userAgent;
const isMac = /Macintosh|Mac OS X/.test(ua);
const isIOS = /iPhone|iPad|iPod/.test(ua) || (isMac && navigator.maxTouchPoints > 1);
const PLATFORM_NAME = IS_MOBILE
  ? (Capacitor.isNativePlatform() ? '安卓手机版' : isIOS ? 'iPhone / iPad 网页版' : '手机网页版')
  : /Electron/.test(ua) ? (isMac ? 'Mac 电脑版' : 'Windows 电脑版') : (isMac ? 'Mac 网页版' : '电脑网页版');
$('platform-label').textContent = PLATFORM_NAME;
$('ctl').innerHTML = IS_MOBILE
  ? `<h4>手机版操作</h4>
     <p>左半屏任意位置按下：浮动摇杆移动（推到底小跑，消耗体力）</p>
     <p>右半屏滑动：转动视角　·　按住「开火」时也能拖动瞄准</p>
     <p>「互动」开门 / 拾取 / 对话　·　「换弹」「换枪」「闪避」</p>
     <p>「强光」手电爆闪使蛊化者硬直　·　「勘察」扫描弱点与暗门</p>
     <p>「铜铃」小满摇铃驱散　·　「镇音」三长两短定住蛊群</p>
     <p>「草药」恢复生命　·　「地图」自动地图　·　右上角暂停</p>`
  : `<h4>电脑版操作（键鼠 / Xbox 手柄）</h4>
     <p>WASD 移动　Shift 小跑（耗体力）　鼠标 视角　空格 闪避</p>
     <p>左键 射击　R 换弹　1 / 2 / 3 或滚轮 切换武器</p>
     <p>E 互动 / 开门 / 推开暗门　F 或右键 手电强光</p>
     <p>C 勘察镜　Q 小满的铜铃　Z 镇音（三长两短）　H 草药</p>
     <p>Tab 自动地图　Esc 暂停　F11 全屏</p>`;

// ---------- 设置 ----------
const sq = $('s-quality') as HTMLSelectElement, ss = $('s-sens') as HTMLInputElement, sv = $('s-vol') as HTMLInputElement;
const sa = $('s-assist') as HTMLInputElement, se = $('s-easy') as HTMLInputElement, sb = $('s-sub') as HTMLInputElement;
sq.value = save.settings.quality; ss.value = String(save.settings.sensitivity); sv.value = String(save.settings.volume);
sa.checked = save.settings.aimAssist; se.checked = save.settings.easyQte; sb.value = String(save.settings.subtitleSize);
const onSettings = () => {
  Object.assign(save.settings, {
    quality: sq.value, sensitivity: Number(ss.value), volume: Number(sv.value), aimAssist: sa.checked, easyQte: se.checked, subtitleSize: Number(sb.value),
  });
  game.settings = save.settings;
  game.applySettings();
  persist();
};
[sq, ss, sv, sa, se, sb].forEach((e) => e.addEventListener('input', onSettings));

// ---------- 章节选择 ----------
function renderChapters() {
  $('chapter-grid').innerHTML = CHAPTERS.map((c, i) => {
    const locked = i + 1 > save.unlocked;
    return `<button class="ch-card ${locked ? 'locked' : ''}" data-ch="${i + 1}" ${locked ? 'disabled' : ''}>
      <div class="ch-img" style="background-image:url(${artUrl(`tex/${c.data.mural.slice(4)}.webp`)})"></div>
      <b>第${'一二三四五六七八'[i]}章　${c.data.title}</b><small>${locked ? '未解锁' : c.data.place}</small></button>`;
  }).join('');
  $('chapter-grid').querySelectorAll<HTMLButtonElement>('.ch-card').forEach((b) => b.addEventListener('click', () => {
    audio.init();
    show(null);
    runFrom(Number(b.dataset.ch));
  }));
}

// ---------- 联动支线 ----------
const ACTS = ['第一幕', '第二幕', '第三幕'];
function renderSide() {
  $('side-grid').innerHTML = SIDE.map((c, i) => {
    const locked = i + 1 > save.side;
    return `<button class="ch-card ${locked ? 'locked' : ''}" data-act-n="${i + 1}" ${locked ? 'disabled' : ''}>
      <div class="ch-img" style="background-image:url(${artUrl(`tex/${c.data.mural.slice(4)}.webp`)})"></div>
      <b>${ACTS[i]}　${c.data.title}</b><small>${locked ? '未解锁' : c.data.place}</small></button>`;
  }).join('');
  $('side-grid').querySelectorAll<HTMLButtonElement>('.ch-card').forEach((b) => b.addEventListener('click', () => {
    audio.init();
    audio.startAmbient();
    show(null);
    runSide(Number(b.dataset.actN));
  }));
}

async function runSide(n: number) {
  const token = ++running;
  sideMode = true;
  for (let i = n; i <= SIDE.length; i++) {
    if (token !== running) return;
    save.sideCur = i;
    persist();
    if (!(await playOne(SIDE[i - 1], token))) return;
    save.side = Math.max(save.side, Math.min(SIDE.length, i + 1));
    persist();
    const goOn = await intermission(i, game.stats, true);
    if (!goOn || token !== running) return;
  }
  if (token === running) sideEnding();
}

async function playOne(ch: Chapter, token: number) {
  game.choices = save.choices;
  game.loadChapter(ch.data);
  game.setState('playing');
  game.hud.setFade(0, 600);
  audio.setAmbientLevel(0.55);
  try {
    await ch.run(game);
  } catch (e) {
    console.error(e);
    if (token !== running) return false;
  }
  return token === running;
}

// ---------- 章节流程 ----------
let running = 0;
let sideMode = false;
async function runFrom(n: number) {
  const token = ++running;
  sideMode = false;
  for (let i = n; i <= CHAPTERS.length; i++) {
    if (token !== running) return;
    save.current = i;
    persist();
    const ch = CHAPTERS[i - 1];
    game.choices = save.choices;
    game.loadChapter(ch.data);
    game.setState('playing');
    game.hud.setFade(0, 600);
    audio.setAmbientLevel(0.55);
    try {
      await ch.run(game);
    } catch (e) {
      console.error(e);
      if (token !== running) return;
    }
    if (token !== running) return;
    save.choices = game.choices;
    save.unlocked = Math.max(save.unlocked, Math.min(CHAPTERS.length, i + 1));
    persist();
    const goOn = await intermission(i, game.stats);
    if (!goOn || token !== running) return;
  }
  if (token === running) ending();
}

function fmt(sec: number) {
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Doom 式章节结算
function intermission(n: number, st: ChapterStats, side = false): Promise<boolean> {
  game.setState('inter');
  const list = side ? SIDE : CHAPTERS;
  const ch = list[n - 1].data;
  $('inter-bg').style.backgroundImage = `url(${artUrl(`tex/${ch.mural.slice(4)}.webp`)})`;
  $('inter-ch').textContent = side ? `联动支线 · ${ACTS[n - 1]}　完成` : `第${'一二三四五六七八'[n - 1]}章　完成`;
  $('inter-title').textContent = ch.title;
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 100);
  const rows: [string, number, string][] = [
    ['击杀', pct(st.kills, st.totalKills), `${st.kills} / ${st.totalKills}`],
    ['物品', pct(st.items, st.totalItems), `${st.items} / ${st.totalItems}`],
    ['隐藏区域', pct(st.secrets, st.totalSecrets), `${st.secrets} / ${st.totalSecrets}`],
    ['命中率', pct(st.hits, st.shots), `爆头 ${st.headshots}`],
  ];
  $('inter-rows').innerHTML = rows.map(([k, , d]) => `<div class="ir"><span>${k}</span><b data-v="0">0%</b><small>${d}</small></div>`).join('') +
    `<div class="ir"><span>用时</span><b>${fmt(st.time)}</b><small>参考 ${fmt(st.par)}</small></div>`;
  const score = (rows[0][1] + rows[1][1] + rows[2][1]) / 3 + (st.time < st.par ? 15 : 0);
  const grade = score >= 95 ? 'S' : score >= 80 ? 'A' : score >= 60 ? 'B' : 'C';
  $('inter-grade').textContent = '';
  $('btn-next').textContent = n >= list.length ? '观看结局' : side ? '下一幕' : '下一章';
  show('inter');
  // 数字滚动
  const els = [...$('inter-rows').querySelectorAll<HTMLElement>('.ir b')];
  rows.forEach(([, v], i) => {
    let cur = 0;
    const iv = setInterval(() => {
      cur = Math.min(v, cur + 3);
      els[i].textContent = `${cur}%`;
      audio.dryFire();
      if (cur >= v) clearInterval(iv);
    }, 30 + i * 6);
  });
  setTimeout(() => { $('inter-grade').textContent = `评级 ${grade}`; audio.stinger(); }, 1600);
  return new Promise((res) => { interResolve = res; });
}
let interResolve: ((v: boolean) => void) | null = null;

function ending() {
  game.setState('menu');
  $('credits').innerHTML = `<h2>蛊变：长江启示录</h2><p>第一季　完</p>
    <p class="cr">原作剧本 · 美术设定：CAI-GENGYU</p><p class="cr">游戏开发：Claude Code</p>
    <p class="cr">${PLATFORM_NAME} · 通关总用时 ${fmt(game.totalTime)}</p>
    <p class="tease">黑屏。一辆冷链卡车驶过夜色中的山路。<br>车厢内，一支标着「CG-7 · 备份」的样本管，在黑暗中微微发出红光。</p>`;
  show('ending');
}

function sideEnding() {
  game.setState('menu');
  $('credits').innerHTML = `<h2>丹字档案</h2><p>《侠客行1971》 × 《蛊变：长江启示录》 联动支线　完</p>
    <p class="cr">《侠客行1971》角色与美术：唐武男（二代无常）、能面众、土蜘蛛 —— 取自《侠客行1971》v0.4 美术资源</p>
    <p class="cr">《蛊变：长江启示录》原作剧本 · 美术设定：CAI-GENGYU</p><p class="cr">游戏开发：Claude Code</p>
    <p class="cr">丹字班、能面众及本支线情节均为虚构；七三一部队的罪行是真实的历史。谨以此支线纪念所有无名的受害者。</p>
    <p class="tease">1976 年 11 月，丰都下游。一支考古队在一座“新发现”的楚国崖墓里，<br>挖出了一管在 37℃ 下自主增殖的朱砂样本。<br>领队名单上，有两个年轻的名字：苏明远，方鹤年。</p>`;
  show('ending');
}

game.onStateChange = (s) => {
  if (s === 'paused') show('pause');
  else if (s === 'dead') {
    $('dead-tip').textContent = ['蛊化者畏光——手电强光能让它们硬直。', '勘察镜能看到首领的弱点。', '小跑会消耗体力，留一点用来闪避。', '铜铃声能驱散成群的蛊化者。', '被包围时用镇音：三长两短。'][Math.floor(Math.random() * 5)];
    show('dead');
  } else if (s === 'playing' || s === 'cine') show(null);
  updateClickLock();
};

function updateClickLock() {
  const need = !IS_MOBILE && game.state === 'playing' && document.pointerLockElement !== canvas && !game.mg.active && !game.hud.documentOpen;
  $('clicklock').style.display = need ? 'flex' : 'none';
}
document.addEventListener('pointerlockchange', updateClickLock);
setInterval(updateClickLock, 500);
$('clicklock').addEventListener('click', () => game.input.lock());

document.querySelectorAll<HTMLButtonElement>('.screen button[data-act]').forEach((b) => {
  b.addEventListener('click', async () => {
    const act = b.dataset.act;
    const from = b.closest('.screen')!.id as Screen;
    audio.init();
    audio.startAmbient();
    switch (act) {
      case 'new':
        save.unlocked = Math.max(save.unlocked, 1);
        save.choices = {};
        game.totalTime = 0;
        show(null);
        runFrom(1);
        break;
      case 'continue':
        show(null);
        runFrom(save.current || 1);
        break;
      case 'side':
        renderSide();
        back = from;
        show('side');
        break;
      case 'chapters':
        renderChapters();
        back = from;
        show('chapters');
        break;
      case 'trailer':
        show(null);
        await game.cineP.play([{ video: 'opening', from: 0, to: 31 }]);
        show('menu');
        break;
      case 'settings':
      case 'controls':
        back = from;
        show(act);
        break;
      case 'back':
        show(back);
        break;
      case 'resume':
        game.resume();
        break;
      case 'checkpoint':
        show(null);
        game.respawn();
        break;
      case 'restart':
        show(null);
        if (sideMode) runSide(save.sideCur);
        else runFrom(save.current);
        break;
      case 'next':
        interResolve?.(true);
        interResolve = null;
        break;
      case 'quit':
        running++;
        interResolve?.(false);
        interResolve = null;
        location.reload();
        break;
    }
  });
});

// ---------- 启动 ----------
(async () => {
  await loadAll((k) => {
    ($('ld-fill') as HTMLElement).style.width = `${Math.round(k * 100)}%`;
  });
  audio.init();
  await audio.loadSamples(['pistol_shot', 'cryo_blast', 'scanner_pulse', 'bronze_bell_long', 'bronze_bell_short'], artUrl('sfx/'));
  ($('btn-continue') as HTMLButtonElement).style.display = save.current > 1 || save.unlocked > 1 ? '' : 'none';
  $('loading').remove();
  game.start();
  show('menu');
})();

// 调试：?debug 时暴露对象，供自动化测试使用
if (location.search.includes('debug')) Object.assign(window, { __game: game, __save: save, __run: runFrom, __runSide: runSide, __next: () => { interResolve?.(true); interResolve = null; } });
