import type { Game } from '../game/game';
import { audio } from '../core/audio';

// 第三章 船舱深处（林骁 / 苏晚）
export async function ch3(g: Game) {
  g.setLoadout(['pistol'], { ammo: 48 });
  g.hp = 100;
  g.armor = 0;
  g.herbs = 2;
  const su = g.npc('su', 'su', true);
  const man = g.npc('man', 'man', true);
  void su; void man;
  const zhou = g.npc('zhou', 'zhou');
  g.bellUnlocked = true;

  await g.cine([
    { title: ['第三章', '船舱深处'], dur: 3, sfx: 'stinger' },
    { img: 'f09', kb: 'in', dur: 1.0, dark: true },
    { img: 'f19', kb: 'in', dur: 1.0, sfx: 'bell' },
    { img: 'f02', kb: 'in', dur: 1.2, sfx: 'radio' },
    { caption: '云梦号失控，正驶向巫山', dur: 2.8 },
    { img: 'f21', kb: 'in', chars: [{ id: 'zhou', side: 'right' }], lines: [
      ['', '林骁、苏晚、老周、小满沿铁梯下行。灯光忽明忽暗，墙壁渗水。'],
      ['老周', '驾驶舱的舵被远程锁死，想停船，只能去轮机舱拉总闸。'], ['林骁', '多久？'],
      ['老周', '以现在的航速，四十分钟后撞上巫山浅滩。'],
      ['苏晚（看着小满）', '你留在我身边，铃别离手。'], ['小满（点头，小声）', '奶奶说过，铃响的时候，不要怕。'],
    ] },
  ]);
  g.objective('去安全屋找老周补给，然后下到轮机舱');
  g.addInteract('zhou', 'zhou', '向老周要补给', () => {
    g.removeInteract('zhou');
    g.reserve.ammo += 24;
    g.herbs++;
    g.say('老周', '拿着。我在这儿守着，你们去拉总闸。');
  }, undefined, 0, 0.8);
  void zhou;

  // ---------- 轮机舱（水下）----------
  await g.until(() => g.inRect(1, 5, 26, 14));
  g.saveCheckpoint();
  g.objective('潜入被淹没的下层，拉下总闸');
  g.hint('积水区会持续消耗 <b>氧气</b>，回到干燥的地面（换气点）可以恢复', '积水区会消耗 <b>氧气</b>，回到干地面换气', 8);
  await g.say('苏晚（耳麦）', '水蛊怕强光，但别一直照，光会招来更多。');
  await g.say('林骁（潜水中，低声）', '收到。');
  for (const m of ['wg1', 'wg2', 'wg3', 'wg4']) g.spawn('water', m, { state: 'dormant' });
  (async () => {
    await g.until(() => g.water && g.inRect(10, 10, 20, 14));
    g.jumpscare('water_gu', 0);
    const ok = await g.mg.mash('水蛊缠住了脚踝！快挣脱！', 10, 4);
    if (!ok) g.damagePlayer(30, g.playerPos, 'scare');
  })();
  await g.interact('switch', 'switch', '拉下总闸', undefined, 0, -0.5);
  audio.impact();
  g.shakeCamera(0.8);
  await g.say('', '林骁拉动总闸，引擎声骤停。但船并没有减速，舱壁反而传来更大的震动。', 3.5);
  await g.say('老周（喘气，扩音器）', '不对。船还在加速，是有人在“拉”它。');
  g.setFlag('switch');
  g.objective('进入货舱');

  // ---------- 货舱 · 青铜棺 ----------
  await g.until(() => g.inRect(1, 16, 26, 25));
  g.saveCheckpoint();
  const coffin = g.prop('coffin_hang', 'coffin', 2.6, 2.6, 0x220000);
  await g.cine([
    { img: 'f23', kb: 'in', lines: [['', '货舱深处，吊臂悬着一口青铜棺，表面刻满云雷纹。棺盖微启，里面渗出红色雾气。']] },
    { img: 'f24', kb: 'in', lines: [
      ['方鹤年（录像，嗓音沙哑）', '如果你看到这段话，说明有人终于找到了它。'],
      ['方鹤年', '朱砂蛊不是武器。它是一种……“回声”。它记得每一个曾经吞噬过的人。'],
      ['苏晚（皱眉）', '回声？'], ['方鹤年', '请告诉晚晚——她父亲没有背叛过任何人。'],
      ['苏晚', '他叫我“晚晚”……这个称呼，只有我爸才用。'], ['林骁（扶住她肩）', '冷静。先过这一关。'],
    ] },
    { img: 'f23', kb: 'out', sfx: 'whisper', tint: 'rgba(80,0,0,0.5)', chars: [{ id: 'bride2', side: 'center' }], lines: [
      ['', '货舱灯光熄灭，吊臂开始摇晃。一个穿残破嫁衣的高大女性身影从棺后走出，每一步都带出一声“嘀嗒”。'],
    ] },
  ]);
  const bride = g.spawn('bride', 'bride');
  bride.awaken();
  g.boss = bride;
  g.objective('击败腐妆新娘');
  g.sayAsync([['苏晚', '她心口有个红点，那是核心！用勘察镜锁定它！'], ['林骁', '引她到吊臂下面！']]);
  g.hint('用 <b>勘察镜</b> 显示她心口的菌核再射击；<br>把她引到吊臂下，按 <b>E</b> 放下货柜', '用 <b>勘察</b> 显示菌核再射击；把她引到吊臂下点 <b>互动</b> 砸货柜', 10);
  g.addPickup('ammo', 3, 17, 30);
  g.addPickup('ammo', 25, 24, 30);

  // 吊臂：新娘在下方时砸落货柜
  let craneReady = true;
  const crane = () => g.addInteract('crane', 'crane', '放下吊臂货柜', async () => {
    if (!craneReady) return;
    craneReady = false;
    g.removeInteract('crane');
    const p = g.at('crane');
    g.rainOn(p.x, p.z, 'proj_rock', 0);
    await g.wait(0.9);
    audio.explosion();
    g.shakeCamera(0.9);
    if (bride.alive && bride.pos.distanceTo(p) < 3.5) {
      bride.vulnerable = true;
      bride.damage(260, 'weak');
      bride.stun(3);
      g.hud.message('货柜砸中了新娘！');
      setTimeout(() => (bride.vulnerable = false), 3000);
    }
    await g.wait(12);
    craneReady = true;
    if (bride.alive) crane();
  });
  crane();

  // 阶段二：蛊虫雨；阶段三：吸附天花板扑击
  let phase = 1;
  bride.onDamaged = (e) => {
    if (phase === 1 && e.hp < e.maxHp * 0.66) { phase = 2; g.say('新娘（扭曲的女声，混着哭腔）', '为什么……不让我……回去……'); }
    if (phase === 2 && e.hp < e.maxHp * 0.33) { phase = 3; g.hud.message('她爬上了天花板……'); }
  };
  (async () => {
    while (bride.alive) {
      await g.wait(phase === 2 ? 1.1 : 3.5);
      if (!bride.alive) break;
      if (phase >= 2) {
        const n = phase === 2 ? 3 : 1;
        for (let i = 0; i < n; i++) g.rainOn(g.playerPos.x + (Math.random() - 0.5) * 7, g.playerPos.z + (Math.random() - 0.5) * 7, 'proj_bug', 10);
      }
      if (phase === 3 && Math.random() < 0.45) {
        // 天花板扑击：消失 → 预警 → 落在玩家头顶
        bride.group.visible = false;
        bride.invulnerable = true;
        const tx = g.playerPos.x, tz = g.playerPos.z;
        g.rainOn(tx, tz, 'proj_bug', 0);
        audio.whisper();
        await g.wait(1.3);
        bride.pos.set(tx, 0, tz);
        bride.group.visible = true;
        bride.invulnerable = false;
        audio.roar(bride.pos);
        g.shakeCamera(0.7);
        if (Math.hypot(g.playerPos.x - tx, g.playerPos.z - tz) < 2) g.jumpscare('bride2', 22);
        bride.stun(2);
      }
    }
  })();
  await g.until(() => !bride.alive);
  g.boss = null;
  g.hud.setBoss(null);
  g.removeInteract('crane');
  g.removeProp(coffin);
  await g.cine([
    { img: 'f23', kb: 'in', chars: [{ id: 'bride2', side: 'center' }], dark: true, lines: [
      ['', '新娘倒地，嫁衣褪去，露出她胸前挂着的名牌：百慧生物 · 实验员　沈红。'], ['苏晚（低声）', '她以前也是个人。'],
    ] },
    { img: 'f25', kb: 'in', sfx: 'radio', chars: [{ id: 'zhong', side: 'right' }], lines: [
      ['老周（扩音器，杂音）', '林骁！有直升机在船尾，上面有人往下扔东西！'],
      ['', '船尾甲板，一架黑色直升机悬停，一个穿风衣的女人冷冷俯瞰。'],
      ['钟曼（扩音器，优雅）', '林警官，苏医生。谢谢你们帮我们“测试”。'], ['林骁', '钟曼？'], ['钟曼', '请代我向许局问好。他会明白的。'],
    ] },
    { img: 'f25', kb: 'out', sfx: 'explosion', shake: true, lines: [['', '直升机离去。船尾突然爆炸。']] },
  ]);
  g.setFlag('bride');
  g.objective('船体断裂——冲向货舱出口！');
  g.saveCheckpoint();
  // 船体断裂：甲板剧烈晃动，杂物坠落
  (async () => {
    while (g.chapter?.id === 3 && !g.inRect(32, 18, 34, 22)) {
      g.shakeCamera(0.4);
      g.rainOn(g.playerPos.x + (Math.random() - 0.5) * 5, g.playerPos.z + (Math.random() - 0.5) * 5, 'proj_rock', 12);
      await g.wait(1.2);
    }
  })();
  await g.reachExit();
  const held = await g.mg.mash('苏晚被甩出护栏——抓住她！', 12, 3);
  await g.cine([
    { img: 'f26', kb: 'in', shake: true, lines: [[held ? '' : '', held ? '林骁伸手抓住了她——却只抓住了一半。镜头一黑。' : '林骁伸手却扑了个空。镜头一黑。']] },
    { caption: '', dur: 1.2, sfx: 'scream', lines: [['小满（尖叫）', '苏姐姐！']] },
    { img: 'tex:m_ch4', kb: 'in', lines: [
      ['', '巫山江滩，破晓。林骁在冰凉的沙滩上醒来。四周是翻滚的浓雾，远处云梦号像一头断脊的巨兽。'],
      ['林骁（低声）', '苏晚？老周？小满？'], ['', '无人回答。他抬头，雾中隐约有一座村落的灯火，以及——铜铃声。'],
    ], sfx: 'bell' },
    { caption: '第三章　船舱深处<br><small>— 完 —</small>', dur: 3 },
  ]);
}
