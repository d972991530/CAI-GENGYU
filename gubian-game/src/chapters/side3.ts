import * as THREE from 'three';
import type { Game } from '../game/game';
import type { Enemy } from '../entities/enemy';
import { audio } from '../core/audio';

// 土蜘蛛的钢丝：1.05 秒红色预警 → 架设 9 秒（碰到会被割伤）。布线时被赤霄砍中会中断
function wireTrap(g: Game, cx: number, cz: number, angle: number, len = 8) {
  const geo = new THREE.BoxGeometry(len, 0.035, 0.035);
  const mat = new THREE.MeshBasicMaterial({ color: 0xff2a10, transparent: true, opacity: 0.4, depthWrite: false });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(cx, 0.5, cz);
  m.rotation.y = -angle;
  g.addObject(m);
  const ax = cx - Math.cos(angle) * len / 2, az = cz - Math.sin(angle) * len / 2;
  const bx = cx + Math.cos(angle) * len / 2, bz = cz + Math.sin(angle) * len / 2;
  const dist = () => {
    const px = g.playerPos.x - ax, pz = g.playerPos.z - az, vx = bx - ax, vz = bz - az;
    const t = Math.max(0, Math.min(1, (px * vx + pz * vz) / (vx * vx + vz * vz)));
    return Math.hypot(px - vx * t, pz - vz * t);
  };
  let cancelled = false;
  const run = (async () => {
    const t0 = g.time;
    while (g.time - t0 < 1.05) {
      if (cancelled) { g.removeObject(m); return; }
      mat.opacity = 0.25 + Math.abs(Math.sin((g.time - t0) * 18)) * 0.5;
      await g.wait(0.03);
    }
    mat.color.setHex(0xdfe6ee);
    mat.opacity = 0.95;
    audio.tone('sawtooth', 2400, 1800, 0.12, 0.05, audio.out());
    let cd = 0;
    const t1 = g.time;
    while (g.time - t1 < 9 && !cancelled) {
      cd -= 0.05;
      if (cd <= 0 && dist() < 0.5) {
        g.damagePlayer(14, new THREE.Vector3(cx, 0, cz), 'wire');
        g.hud.message('钢丝割开了皮肉！');
        cd = 0.8;
      }
      await g.wait(0.05);
    }
    g.removeObject(m);
  })();
  return { cancel: () => { cancelled = true; }, done: run };
}

// 联动支线《丹字档案》第三幕 丰都·名山溶洞（唐武男 · 1971 四川丰都）
export async function side3(g: Game) {
  g.setLoadout(['pistol', 'mg', 'cryo'], { ammo: 48, mg_ammo: 12 });
  g.switchWeapon('pistol');
  g.hp = 100;
  g.armor = 25;
  g.herbs = 2;
  g.scanUnlocked = false;
  g.bellUnlocked = true;
  g.bellOwn = true;

  await g.cine([
    { title: ['联动支线 · 丹字档案', '第三幕　丰都 · 名山溶洞'], dur: 3, sfx: 'stinger' },
    { img: 's3_2', kb: 'in', tint: 'rgba(40,40,30,0.45)', lines: [
      ['', '盐仓后面的山壁上，有人用凿子刻满了名字。很多名字下面，只刻着“无名氏”。'],
      ['唐武男', '……'],
      ['', '山壁正中，一道被炸开又被重新凿通的洞口。洞口新鲜的脚印，一直延伸到黑暗里。'],
    ] },
  ]);
  g.objective('进入盐仓（可以先在山壁前停留片刻）');
  g.addInteract('memorial', 'memorial', '在山壁前默哀', async () => {
    g.removeInteract('memorial');
    await g.hud.showDocument('名山脚下 · 无名石壁',
      `<p>丹字班罹难同胞　一九四一 — 一九四五</p>
       <p>王大有　李秀英　陈二娃　张德贵　刘桂兰　赵满仓　周幺妹　何长生　吴老三　冉光福　谭春花　秦水生　……</p>
       <p class="dim">名多不可考。刻字的人没有留下姓名，只在最下面写了一行：</p>
       <p><b>“铃声在，魂就找得到回家的路。”</b></p>`);
    audio.sample('bronze_bell_long', 0.5);
    await g.say('唐武男（低声）', '我会把洞封上。');
  }, undefined, 0, -0.8);

  // ---------- 盐仓牢房 ----------
  await g.until(() => g.inRect(10, 14, 24, 20));
  g.saveCheckpoint();
  audio.setAmbientLevel(0.85);
  for (const m of ['p1', 'p2', 'p3']) g.spawn('dannu', m, { state: 'dormant' });
  const p4 = g.spawn('dannu', 'p4', { state: 'dormant' });
  p4.awakeRadius = 4;
  await g.say('唐武男', '铁栏、手术床……这里不是盐仓，是牢房。');
  g.objective('在牢房里找到手术室的钥匙');
  (async () => {
    await g.until(() => g.inRect(22, 19, 24, 20));
    g.jumpscare('water_gu', 10);
    p4.awaken();
  })();

  // ---------- 手术室 ----------
  await g.until(() => g.inRect(26, 14, 38, 20));
  g.saveCheckpoint();
  g.spawn('noh_gun', 's1').awaken();
  g.spawn('noh_blade', 's2').awaken();
  g.spawn('noh_gun', 's3');
  await g.say('能面众', '把他留在这儿——和那些人一样！');
  await g.until(() => !g.enemies.some((e) => e.alive && e.kind.human));
  await g.interact('doc3', 'doc3', '翻看手术台上的铁皮箱', undefined, 0, 0.6);
  await g.hud.showDocument('档案③ · 交接清单（一九四五年八月十六日）',
    `<p class="dim">奉命销毁本班一切设施、记录及受试者。洞口以炸药封闭。</p>
     <p>以下样本不予销毁，移交「<b class="red">能面</b>」保管：</p>
     <p>丹-1　丹-2　丹-3　丹-4　丹-5　丹-6　<s>丹-7</s>　丹-8　丹-9</p>
     <p class="dim">“丹-7”一栏被人用红笔划掉，旁边是新写的字：</p>
     <p><b>“1971 年秋，丹-7 母株送回原墓，与其余八株合并培养。”</b></p>`);
  await g.say('唐武男', '一九四五年他们投降了。可这些东西没有投降。');
  g.objective('穿过标本间，去最深处的崖墓');

  // ---------- 标本间 · 土蜘蛛 ----------
  await g.until(() => g.inRect(10, 6, 38, 12));
  g.saveCheckpoint();
  await g.cine([
    { img: 'f17', kb: 'in', tint: 'rgba(40,60,30,0.45)', lines: [
      ['', '一排排玻璃罐里泡着朱砂色的人形。灯管在头顶嗡嗡作响。'],
      ['', '罐子的另一头，有个背着钢丝卷盘的人慢慢转过身来。白色的能面，爪子一样的手套。'],
    ] },
    { img: 'f18', kb: 'out', chars: [{ id: 'tsuchigumo', side: 'right' }], lines: [
      ['土蜘蛛', '二代无常。上海的账还没算完，你又追到这里来了。'],
      ['唐武男', '箱子是你们运回来的。罐子里的人，也是你们的“货”？'],
      ['土蜘蛛', '这些是遗产。主人们输了战争，遗产总得有人继承。'],
    ] },
  ]);
  const spider = g.spawn('tsuchigumo', 'spider');
  spider.awaken();
  g.boss = spider;
  g.objective('击败土蜘蛛');
  g.hint('土蜘蛛布线前会出现 <b>红色预警线</b>，架好的钢丝碰到会被割伤——绕开它<br>趁他布线时用 <b>赤霄</b> 砍中，可以打断', '红色预警线是土蜘蛛的钢丝——绕开它；趁他布线时用 <b>赤霄</b> 砍中可以打断', 10);
  let interrupted = false;
  spider.interrupt = () => { interrupted = true; };
  let called = false;
  spider.onDamaged = (e) => {
    if (!called && e.hp < e.maxHp * 0.5) {
      called = true;
      g.say('土蜘蛛', '出来！');
      g.spawn('noh_blade', 't1').awaken();
      g.spawn('noh_gun', 't2').awaken();
    }
  };
  const traps: { cancel: () => void }[] = [];
  (async () => {
    await g.wait(4);
    while (spider.alive) {
      // 停步布线：1.05 秒内被赤霄砍中就打断
      interrupted = false;
      const hold = (e: Enemy) => { void e; return true; };
      if (spider.state !== 'stunned') {
        spider.behavior = hold;
        const dx = g.playerPos.x - spider.pos.x, dz = g.playerPos.z - spider.pos.z;
        const d = Math.hypot(dx, dz) || 1;
        // 钢丝横在玩家与土蜘蛛之间，靠近玩家一侧
        const k = Math.min(0.75, Math.max(0.35, 1 - 2.5 / d));
        const w = wireTrap(g, spider.pos.x + dx * k, spider.pos.z + dz * k, Math.atan2(dz, dx) + Math.PI / 2, 9);
        traps.push(w);
        const t0 = g.time;
        await g.until(() => interrupted || g.time - t0 > 1.05 || !spider.alive);
        spider.behavior = null;
        if (interrupted) {
          w.cancel();
          spider.stun(2.2);
          g.hud.message('赤霄打断了布线！');
          audio.impact();
        }
      }
      await g.wait(spider.hp < spider.maxHp * 0.5 ? 5 : 7);
    }
  })();
  await g.until(() => !spider.alive);
  for (const t of traps) t.cancel();
  g.boss = null;
  g.hud.setBoss(null);
  await g.cine([
    { img: 'f18', kb: 'in', dark: true, chars: [{ id: 'tsuchigumo_dead', side: 'center' }], lines: [
      ['土蜘蛛（喘息）', '你封得住这个洞……封得住人心吗……'],
      ['土蜘蛛', '战争结束了二十六年。想要它的人……只会越来越多。'],
    ] },
  ]);
  g.setFlag('spider');
  g.objective('进入崖墓');

  // ---------- 楚国崖墓 · 棺中之物 ----------
  await g.until(() => g.inRect(14, 1, 28, 4));
  g.saveCheckpoint();
  const coffin = g.prop('coffin', 'coffin', 1.8, 0.9, 0x330000);
  await g.cine([
    { img: 'f23', kb: 'in', tint: 'rgba(80,0,0,0.4)', lines: [
      ['', '墓室中央是一座石台，石台上一口缠满朱砂菌丝的青铜棺。棺身刻着云雷纹。'],
      ['', '八个玻璃罐摆在石台四周，罐里的菌丝正往棺材里爬——它们在“合并”。'],
      ['唐武男', '能面众要的不是这口棺……是棺里养出来的东西。'],
    ] },
    { img: 'f24', kb: 'out', sfx: 'scream', shake: true, chars: [{ id: 'mandrill', side: 'center' }], lines: [
      ['', '棺盖被从里面推开。一个三米高的东西站了起来，身上还挂着一九四〇年代的破军装。'],
    ] },
  ]);
  const boss = g.spawn('specimen', 'specimen');
  boss.awaken();
  g.boss = boss;
  g.bossName = '棺中之物 · 丹字班最后的试验体';
  g.objective('毁掉棺中之物');
  g.hint('摇 <b>铜铃</b> 让它僵直，僵直时伤害大幅提高<br>把它引到 <b>火油罐</b> 旁按 <b>E</b> 点燃', '点 <b>铜铃</b> 让它僵直，僵直时伤害大幅提高<br>把它引到 <b>火油罐</b> 旁点 <b>互动</b> 点燃', 10);
  for (const m of ['lampA', 'lampB', 'lampC', 'lampD']) {
    g.addInteract(m, m, '点燃火油罐', () => {
      g.removeInteract(m);
      const p = g.at(m);
      g.fireBurst(p.x, p.z, 5);
      g.hud.message('火油罐炸开！');
    });
  }
  let phase = 1;
  boss.onDamaged = (e) => {
    if (phase === 1 && e.hp < e.maxHp * 0.6) { phase = 2; g.say('', '它身上的菌丝炸开，墓室四周的罐子一个接一个碎裂。'); }
  };
  (async () => {
    while (boss.alive) {
      await g.wait(phase === 2 ? 11 : 16);
      if (!boss.alive) break;
      const n = g.enemies.filter((e) => e.alive && e.kind.name === '丹奴').length;
      if (n < 4) for (const m of ['lampA', 'lampB']) g.spawn('dannu', m, { oz: 0.8 }).awaken();
    }
  })();
  await g.until(() => !boss.alive);
  g.boss = null;
  g.bossName = '';
  g.hud.setBoss(null);
  g.removeProp(coffin);
  await g.cine([
    { img: 'f23', kb: 'in', dark: true, sfx: 'bell', lines: [
      ['', '试验体倒在石台前。破军装的口袋里掉出一块铝制的身份牌，上面的名字已经被锈蚀得看不清了。'],
      ['唐武男', '你也曾经是个人。'],
      ['', '他把炸药绑在青铜棺上，点燃引信。'],
    ] },
  ]);
  g.setFlag('specimen');
  g.objective('崖墓要塌了——从崖洞出口撤出去！');
  g.saveCheckpoint();
  (async () => {
    while (g.chapter?.id === 23 && !g.inRect(30, 2, 32, 2)) {
      g.shakeCamera(0.45);
      g.rainOn(g.playerPos.x + (Math.random() - 0.5) * 5, g.playerPos.z + (Math.random() - 0.5) * 5, 'proj_rock', 10);
      await g.wait(1.3);
    }
  })();
  await g.reachExit();
  audio.explosion();

  await g.cine([
    { img: 's3_2', kb: 'in', shake: true, sfx: 'explosion', lines: [
      ['', '名山的半边崖壁轰然塌落，把崖墓和盐仓一起埋进了山里。'],
      ['', '山下，傩戏班的铃声响了起来。三长，两短。'],
    ] },
    { img: 'xkx_title', kb: 'in', lines: [
      ['唐武男', '九株样本，八株在罐里，一株在棺里。都烧干净了。'],
      ['唐武男', '……都烧干净了吗？'],
    ] },
    { caption: '同一时刻　丰都下游三里<br><small>江边芦苇丛</small>', dur: 3 },
    { img: 'f29', kb: 'in', tint: 'rgba(60,0,0,0.35)', lines: [
      ['', '一个满身泥水的能面众爬上岸，摘下裂开的面具。'],
      ['', '他手里攥着一支玻璃管。标签被撕掉了一半，只剩下一个“丹”字。管子里的东西，在黑暗中微微发着红光。'],
    ] },
    { caption: '第三幕　丰都 · 名山溶洞<br><small>— 完 —</small>', dur: 3 },
  ]);
}
