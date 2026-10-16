import type { Game } from '../game/game';
import { audio } from '../core/audio';

// 第八章 蛊母（全员）
export async function ch8(g: Game) {
  g.setLoadout(['pistol', 'cryo', 'mg'], { ammo: 60, cryo_ammo: 24, mg_ammo: 120 });
  g.hp = 100;
  g.armor = 50;
  g.herbs = 3;
  g.npc('su', 'su', true);
  g.npc('man', 'man', true);
  g.npc('zhou', 'zhou');
  g.npc('chen', 'chen');
  g.bellUnlocked = true;
  g.zhenyinUnlocked = true;

  await g.cine([
    { title: ['第八章', '蛊母'], dur: 3, sfx: 'stinger' },
    { caption: '三峡大坝<br><small>长江的最后一道闸</small>', dur: 3 },
    { img: 's3_3', kb: 'in', sfx: 'radio', lines: [
      ['', '巨大的混凝土坝体横卧江面，泄洪闸在夜色里轰鸣。'],
      ['陈砚（耳麦）', '闸室水位异常！有人在手动开启第七、第八号泄洪口。'], ['老周', '钟曼。'],
    ] },
  ]);
  g.objective('进入控制中枢');
  await g.until(() => g.inRect(8, 6, 26, 11));
  g.saveCheckpoint();
  await g.cine([{ img: 'tex:m_ch8', kb: 'in', chars: [{ id: 'zhong', side: 'center' }], lines: [
    ['', '钟曼立于监控屏前，身后是整整一面墙的水位曲线。'], ['钟曼（转身，微笑）', '林警官。你来得正好。'],
    ['林骁', '放弃吧，钟曼。'],
    ['钟曼', '放弃？我花了十年，才让“她”醒来。长江是最好的培养皿。三天之后，沿江三亿人，都会听见她的歌。'],
    ['苏晚（冷声）', '那不是歌，是吞噬。'], ['钟曼（叹息）', '你和你父亲，一样固执。'],
    ['', '钟曼按下遥控器。闸门开启，水底传来巨大的轰鸣。钟曼趁乱消失在烟雾里。'],
  ], sfx: 'impact', shake: true }]);
  await g.say('陈砚', '我和老周去夺回控制系统！你们带小满下闸室！');
  g.setFlag('zhong');
  g.removeNpc('zhou');
  g.removeNpc('chen');
  g.objective('潜入水下闸室');

  // ---------- 水下闸室 · 蛊母 ----------
  await g.until(() => g.inRect(1, 15, 34, 24));
  g.saveCheckpoint();
  const mother = g.spawn('mother', 'mother', { scale: 1.2 });
  mother.awakeRadius = 0;
  mother.invulnerable = true;
  const coffin = g.prop('coffin_hang', 'mother', 3, 4.2, 0x330000);
  await g.cine([{ img: 's3_3', kb: 'in', sfx: 'whisper', chars: [{ id: 'coffin', side: 'center' }], lines: [
    ['', '巨大的水下闸室，中央悬浮着缠满朱砂菌丝的青铜棺与苏明远的躯体。'],
  ] }]);
  mother.awaken();
  g.boss = mother;
  g.bossName = '蛊母 · 菌丝之壁';
  // 阶段一：击破四根锚点
  g.objective('阶段一：击破四根菌丝锚点（0/4）');
  g.hint('蛊母被菌丝锚点保护，先打掉 <b>四根锚点</b>；地上的红圈是菌丝抽打', '先打掉四根 <b>锚点</b>；躲开地上的红圈', 8);
  const anchors = ['a1', 'a2', 'a3', 'a4'].map((m) => g.spawn('anchor', m, { scale: 1 }));
  for (const a of anchors) a.awaken();
  g.addPickup('cryo_ammo', 2, 20, 25);
  g.addPickup('ammo', 32, 20, 25);
  g.addPickup('herb', 17, 24, 40);
  let phase = 1;
  (async () => {
    while (mother.alive && g.chapter?.id === 8) {
      await g.wait(phase === 1 ? 1.6 : 2.4);
      if (phase !== 2) g.rainOn(g.playerPos.x + (Math.random() - 0.5) * 6, g.playerPos.z + (Math.random() - 0.5) * 6, 'proj_bug', 12);
    }
  })();
  while (anchors.some((a) => a.alive)) {
    g.objective(`阶段一：击破四根菌丝锚点（${anchors.filter((a) => !a.alive).length}/4）`);
    await g.wait(0.5);
  }
  // 阶段二：回声 —— 不许开枪，只能用勘察镜找核心
  phase = 2;
  g.bossName = '蛊母 · 回声';
  await g.cine([{ img: 'f30', kb: 'in', sfx: 'whisper', tint: 'rgba(80,0,0,0.5)', lines: [['蛊母（苏明远的声音）', '晚晚……'], ['苏晚（喊）', '别开枪！那是我爸的声音……用勘察镜找到核心！']] }]);
  g.objective('阶段二：不要开枪！靠近蛊母，用勘察镜锁定核心');
  g.hint('<b>开枪会让菌丝大量增殖！</b> 靠近蛊母并保持 <b>勘察镜</b> 扫描', '<b>别开枪！</b> 靠近蛊母并保持 <b>勘察</b> 扫描', 10);
  g.onShot = () => {
    if (phase !== 2) return;
    g.hud.message('菌丝增殖！');
    audio.roar(mother.pos);
    g.spawn('gu', ['w1', 'w2', 'w3', 'w4'][Math.floor(Math.random() * 4)]).awaken();
  };
  let lock = 0;
  let last = g.time;
  await g.until(() => {
    const dt = g.time - last;
    last = g.time;
    if (g.scanning && g.playerPos.distanceTo(mother.pos) < 11) lock += dt;
    if (g.scanCd > 0 && !g.scanning) g.scanCd = Math.max(0, g.scanCd - dt); // 本阶段勘察镜冷却加快
    return lock >= 3.5;
  });
  g.onShot = null;
  g.hud.message('核心锁定！');
  // 阶段三：安山调
  phase = 3;
  g.bossName = '蛊母 · 安山调';
  await g.cine([{ img: 'f19', kb: 'in', sfx: 'bell', lines: [
    ['蛊母（苏明远的声音，断断续续）', '晚晚……是你吗……'], ['苏晚（哽咽）', '爸，是我。我来接你回家。'],
    ['蛊母', '我……撑不住了……她们……在我脑子里……'], ['苏晚', '没事。有我在。'],
    ['', '她举起血清，刺入蛊母心口。小满的铜铃与《安山调》同时响起。'],
  ] }]);
  while (!(await g.mg.rhythm('安山调 · 最后三拍：三长，两短', ['L', 'L', 'L', 'S', 'S']))) {
    g.damagePlayer(8, mother.pos);
  }
  mother.invulnerable = false;
  mother.damage(99999, 'weak');
  g.removeProp(coffin);
  g.boss = null;
  g.hud.setBoss(null);
  await g.cine([
    { img: 'f29', kb: 'in', lines: [
      ['', '朱砂菌丝一寸寸褪去，露出苏明远苍老安详的面容。'],
      ['苏明远（最后一次睁眼）', '晚晚……你长大了。'], ['苏晚（泣不成声）', '爸……'],
      ['苏明远', '谢谢……你们……让我……回家。'], ['', '他的身躯化作朱砂色的光点，消散在水里。'],
    ] },
    { img: 'tex:m_ch8', kb: 'in', chars: [{ id: 'zhou', side: 'left' }, { id: 'chen', side: 'right' }], sfx: 'radio', lines: [
      ['', '控制中枢。泄洪闸仍在失控。老周在手动阀门前坚守，陈砚在电子端抢修。'],
      ['老周（扳动阀门，咬着槟榔）', '小子，还剩多少秒？'], ['陈砚（喊）', '九十秒！手动关闭需要有人留在阀门下！'],
    ] },
  ]);
  // ---------- 据守 ----------
  g.objective('据守闸室出口，掩护老周关闭阀门');
  const end = g.time + 60;
  (async () => {
    let i = 0;
    while (g.time < end && g.chapter?.id === 8) {
      g.spawn(i % 4 === 3 ? 'ore' : 'gu', ['w1', 'w2', 'w3', 'w4'][i % 4]).awaken();
      i++;
      await g.wait(3);
    }
  })();
  while (g.time < end) {
    g.objective(`掩护老周（剩余 ${Math.ceil(end - g.time)} 秒）`);
    await g.wait(1);
  }
  await g.cine([{ img: 'tex:m_ch8', kb: 'in', chars: [{ id: 'zhou', side: 'center' }], lines: [
    ['老周（笑）', '那就我吧。我这条腿，早就跑不动了。'], ['陈砚', '老周——！'],
    ['老周', '替我跟林骁说……槟榔……别戒了。'], ['', '水压吞没了阀门。轰鸣声骤止。'],
  ], sfx: 'impact', shake: true }]);
  for (const e of g.enemies) if (e.alive) e.damage(99999, 'body');
  g.objective('离开闸室');
  await g.reachExit();
  await g.cine([
    { img: 's3_3', kb: 'out', lines: [
      ['', '晨光穿过雾气，洒在大坝上。林骁、苏晚、小满、陈砚站在栏杆边，无人言语。'],
      ['', '苏晚把苏明远留下的最后一份实验笔记，轻轻放入江中。'],
      ['小满（摇响铜铃，轻声唱）', '安山调……安山安……'], ['林骁（低声）', '老周。'],
      ['', '他取下老周遗落的槟榔袋，放进口袋。'],
    ], sfx: 'bell' },
    { caption: '', dur: 2 },
    { img: 'f02', kb: 'in', dark: true, lines: [['', '黑屏。一辆冷链卡车驶过夜色中的山路。车厢内，一支标着“CG-7 · 备份”的样本管，在黑暗中微微发出红光。']] },
    { caption: '《蛊变：长江启示录》<br><small>第一季　完</small>', dur: 4 },
  ]);
}
