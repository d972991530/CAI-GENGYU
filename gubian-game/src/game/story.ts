import * as THREE from 'three';
import type { Game } from './game';
import type { Enemy } from '../entities/enemy';
import { audio } from '../core/audio';
import { cellCenter } from '../world/map';

// 第一章「云梦号」—— 剧情与关卡节拍，改编自《蛊变：长江启示录》剧本 V1.0
export async function chapterOne(g: Game) {
  const touch = g.input.touchMode;
  const hint = (pc: string, mobile: string, sec = 6) => g.hud.showHint(touch ? mobile : pc, sec);
  const nearPlayer = (col: number, row: number, d: number) => {
    const c = cellCenter(col, row);
    return Math.hypot(g.playerPos.x - c.x, g.playerPos.z - c.z) < d;
  };

  // ---------- 布置场景 ----------
  g.setPlayer(cellCenter(3, 2).x, cellCenter(3, 2).z, -Math.PI / 2);
  const su = g.spawnCompanion('su', 2, 3);
  su.following = true;

  // 宴会厅：宾客背对入口站成两排，一动不动
  const guests: Enemy[] = [];
  for (const row of [9, 11]) {
    for (let col = 4; col <= 14; col += 2) {
      const ox = (Math.random() - 0.5) * 0.8 + (row === 11 ? 1.2 : 0);
      guests.push(g.spawnEnemy('walker', col, row, (Math.random() - 0.5) * 0.3, 'dormant', ox, (Math.random() - 0.5) * 0.5));
    }
  }
  const [aw1, aw2, aw3] = [guests[2], guests[10], guests[7]];

  // 走廊与客房
  g.spawnEnemy('walker', 26, 6, Math.PI, 'idle');
  g.spawnEnemy('walker', 21, 14, Math.PI, 'idle');
  g.spawnEnemy('walker', 20, 19, Math.PI, 'idle');
  // 后厨
  g.spawnEnemy('walker', 11, 16, 0, 'idle');
  g.spawnEnemy('walker', 16, 19, Math.PI / 2, 'idle');
  g.spawnEnemy('walker', 9, 18, 0, 'dormant');

  // 补给
  g.addPickup('ammo', 7, 3, 12, 0.5, 0.6);
  g.addPickup('herb', 17, 6, 1, 0.6, -0.6);
  g.addPickup('ammo', 1, 14, 12, -0.5, 0.5);
  g.addPickup('ammo', 18, 9, 6, 0.5, 0);
  g.addPickup('ammo', 21, 11, 6, 0.3, 0);
  g.addPickup('ammo', 27, 9, 12, 0.5, 0.5);
  g.addPickup('herb', 24, 6, 1, -0.6, -0.6);
  g.addPickup('herb', 27, 14, 1, 0.6, 0.6);
  g.addPickup('ammo', 24, 16, 12, -0.5, -0.5);
  g.addPickup('herb', 8, 20, 1, -0.5, 0.5);
  g.addPickup('ammo', 18, 16, 12, 0.6, -0.6);
  g.addPickup('ammo', 6, 22, 8, 0, -0.5, 0, 20);
  g.addPickup('ammo', 12, 26, 8, 0, 0.5, 0, 20);
  g.addPickup('herb', 1, 26, 1, -0.4, 0.4, 0, 45);

  g.saveCheckpoint();

  // ---------- 开场：黑屏 + 江水声 ----------
  g.hud.setFade(1, 0);
  await g.setCutscene(true);
  g.hud.setCaption('<small>2026年10月9日，凌晨1:12</small><br>长江 · 丰都江段');
  await g.wait(4);
  g.hud.setCaption('');
  await g.say('陈砚（耳麦）', '林队，卫星热成像显示云梦号上有两百多个热源，但……没有一个在移动。');
  await g.say('林骁', '什么意思？');
  await g.say('陈砚（耳麦）', '就是……两百多个人，全站着不动。');
  g.hud.setFade(0, 2500);
  g.lookTarget = g.cellToWorld(1, 0, 4); // 船艏那盏一明一暗的红灯
  await g.wait(1.5);
  await g.say('苏晚', '丰都。传说里的鬼城。（轻声）别又来这套。');
  await g.say('林骁', '不是鬼。搜索甲板。');
  g.lookTarget = g.cellToWorld(12, 3, 0);
  await g.wait(1.2);
  await g.setCutscene(false);

  // ---------- 场2：甲板 ----------
  g.objective('搜索甲板，查看散落的物品');
  hint('<b>WASD</b> 移动　<b>鼠标</b> 转动视角　<b>Shift</b> 奔跑<br>靠近高亮物品可拾取，<b>E</b> 互动',
    '左侧拖动 <b>摇杆</b> 移动，右侧 <b>滑动</b> 转动视角<br>靠近高亮物品可拾取', 8);

  let phoneSeen = false;
  g.addInteractable('phone', 'phone', 12, 3, '查看被踩碎的手机', async () => {
    g.removeInteractable('phone');
    await g.hud.showDocument('手机 · 最后一段视频',
      '<p>画面剧烈晃动。宴会厅的水晶灯下，宾客在尖叫。</p><p>镜头对准一个男人——他的脖颈上，正缓缓浮起<b class="red">朱砂色的脉络</b>。</p><p>视频在一声闷响中中断。</p>');
    phoneSeen = true;
  });
  await g.until(() => phoneSeen);
  await g.say('苏晚（压低声音）', '不是普通感染。这个脉络的走向……像是被“画”上去的。');
  await g.say('林骁', '先找幸存者。');
  g.openDoor('A');
  g.objective('沿着血迹进入一层宴会厅');

  // ---------- 场3：宴会厅 ----------
  await g.until(() => g.inCells(1, 6, 18, 14));
  g.saveCheckpoint();
  audio.setAmbientLevel(0.75);
  g.objective('调查宴会厅里的宾客');
  await g.until(() => nearPlayer(8, 9, 5) || nearPlayer(12, 11, 5) || nearPlayer(5, 11, 5) || g.inCells(1, 8, 18, 14));
  aw1.awaken();
  audio.stinger();
  await g.wait(0.6);
  hint('<b>右键</b> 瞄准　<b>左键</b> 射击　<b>R</b> 换弹<br>瞄准头部可造成三倍伤害',
    '<b>瞄准</b> 键切换越肩瞄准，按住 <b>开火</b> 射击<br>瞄准头部伤害更高（设置中可调辅助瞄准）', 7);
  await g.until(() => !aw1.alive);

  await g.say('苏晚', '林骁，让我看看它——我的勘察镜能扫描菌群。');
  g.scanUnlocked = true;
  hint('按 <b>Q</b> 开启勘察镜，扫描蛊化者', '点击 <b>勘察</b> 按钮开启勘察镜，扫描蛊化者', 7);
  aw2.awaken();
  let scanned = false;
  g.onScan = () => (scanned = true);
  await g.until(() => scanned || g.time > 0 && !aw2.alive);
  g.onScan = null;
  await g.say('苏晚（扫描后）', '朱砂菌群接管了神经。他们怕光——光会让菌丝收缩。');
  await g.say('林骁', '那就别关灯。');
  g.flashUnlocked = true;
  hint('按 <b>F</b> 打出手电强光，使前方蛊化者硬直', '点击 <b>强光</b>，手电强光可使前方蛊化者硬直', 7);
  await g.until(() => !aw2.alive);
  aw3.awaken();
  await g.until(() => !aw3.alive);
  await g.wait(1);
  g.openDoor('B');
  g.openDoor('C');
  g.openDoor('D');
  g.objective('探索客房走廊，寻找通往底层的钥匙卡');

  // ---------- 场4：走廊 / 客房 ----------
  await g.until(() => g.inCells(20, 6, 21, 20));
  g.saveCheckpoint();
  audio.groan(g.cellToWorld(25, 7, 1.6), 0.8, 0.8);

  let gotList = false, gotCard = false;
  g.addInteractable('list', 'file', 25, 13, '阅读档案', async () => {
    g.removeInteractable('list');
    await g.hud.showDocument('档案一 · 云梦号乘客名单',
      '<p>百慧集团「年度鸡尾酒会」贵宾名单（共 217 人）</p><ul><li>……</li><li>王文涛　百慧生物 · 研发中心</li><li>沈　红　百慧生物 · 实验员</li><li><b class="red">钟　曼　百慧集团 · 董事长</b></li><li>……</li></ul>');
    gotList = true;
    (async () => {
      await g.say('陈砚（耳麦）', '等等，这名单上有个名字我认识——钟曼，百慧集团董事长。她今晚也在船上？');
      await g.say('苏晚', '百慧……（停顿）我父亲当年所在的公司。');
    })();
  }, 0, 0.6, 0);
  g.addInteractable('card', 'keycard', 24, 12, '拾取 底层钥匙卡', () => {
    g.removeInteractable('card');
    gotCard = true;
    g.hud.showHint('获得 <b>底层钥匙卡</b>', 3);
  }, 0, -0.8, 0);
  await g.until(() => gotList && gotCard);
  await g.wait(2.5);

  // 走廊尽头，一扇客房门缓缓打开
  g.openDoor('E');
  const bellPos = g.cellToWorld(27, 18, 1);
  audio.bell(bellPos, 0.5);
  setTimeout(() => audio.bell(bellPos, 0.35), 900);
  g.objective('走廊尽头的客房……传来微弱的铃声');
  // 小满躲在衣柜里
  const man = g.spawnCompanion('man', 28, 19);
  man.group.visible = false;

  let opened = false;
  g.addInteractable('wardrobe', '', 28, 19, '打开衣柜', () => {
    g.removeInteractable('wardrobe');
    opened = true;
  }, -1.3, 0, 1.2);
  await g.until(() => opened);
  audio.stinger();
  const out = cellCenter(27, 19);
  man.pos.set(out.x + 0.2, 0, out.z + 0.3);
  man.group.visible = true;

  // 走廊里的蛊化者被铃声吸引过来
  const wave = [
    g.spawnEnemy('walker', 20, 6, Math.PI, 'idle'),
    g.spawnEnemy('walker', 21, 7, Math.PI, 'idle'),
    g.spawnEnemy('walker', 20, 9, Math.PI, 'idle'),
    g.spawnEnemy('walker', 21, 11, Math.PI, 'idle'),
  ];
  await g.setCutscene(true);
  g.lookTarget = man.pos.clone().setY(0.9);
  await g.say('小满（缩在柜角，攥着铜铃）', '别过来……它们听到铃声就会走开的。');
  await g.say('林骁（蹲下，缓缓放下枪）', '我们是警察。你叫什么名字？');
  await g.say('小满', '小满。我找不到奶奶了。');
  await g.say('苏晚（低声）', '林骁，这个铃……上面的云雷纹，和朱砂蛊的脉络一模一样。');
  for (const e of wave) e.awaken();
  g.lookTarget = g.cellToWorld(22, 17, 1.5);
  await g.wait(1.2);
  man.ringT = 1.5;
  audio.bellRing(man.pos);
  for (const e of wave) e.flee(5);
  await g.say('', '铃声响起。走廊外的蛊化者齐齐一顿，往后退了半步。', 3);
  await g.say('林骁（会意）', '带着她。');
  await g.setCutscene(false);
  man.following = true;
  g.bellUnlocked = true;
  hint('按 <b>G</b> 让小满摇铃，驱散附近的小型蛊化者（冷却 60 秒）', '点击 <b>铜铃</b> 让小满摇铃，驱散附近的蛊化者（冷却 60 秒）', 8);
  g.objective('用钥匙卡打开后厨的门');
  g.saveCheckpoint();

  let kitchenOpen = false;
  g.addInteractable('doorK', '', 19, 18, '刷钥匙卡', () => {
    g.removeInteractable('doorK');
    g.openDoor('K');
    kitchenOpen = true;
  }, 1.4, 0, 1.2);
  await g.until(() => kitchenOpen);
  g.objective('穿过后厨，进入冷库');

  // ---------- 场6：后厨冷库 · 小 Boss 屠夫 ----------
  await g.until(() => g.inCells(8, 16, 18, 20));
  g.saveCheckpoint();
  let coldOpen = false;
  g.addInteractable('doorF', '', 13, 21, '打开冷库门', () => {
    g.removeInteractable('doorF');
    g.openDoor('F');
    coldOpen = true;
  }, 0, -1.4, 1.2);
  await g.until(() => coldOpen);
  await g.until(() => g.inCells(1, 22, 18, 26));
  g.openDoor('F', false); // 金属门在身后自动关闭
  const butcher = g.spawnEnemy('butcher', 9, 25, Math.PI, 'idle');
  butcher.awakeRadius = 0;
  g.saveCheckpoint();
  await g.setCutscene(true);
  g.lookTarget = butcher.pos.clone().setY(2.2);
  audio.setAmbientLevel(0.9);
  await g.say('苏晚', '这里温度太低了……有东西在里面。');
  audio.roar(butcher.pos.clone().setY(2));
  g.shakeCamera(0.5);
  butcher.awaken();
  await g.wait(1.4);
  await g.setCutscene(false);
  g.boss = butcher;
  g.bossName = '屠夫 · 蛊化厨师';
  g.objective('击败屠夫');
  (async () => {
    await g.say('苏晚', '背上的囊泡！打破它，菌群会外泄，趁它失衡。');
    await g.say('林骁', '你负责看，我负责打。');
    hint('正面几乎打不动！引诱屠夫冲撞<b>冷凝管</b>，或射击它身旁的冷凝管，<br>让它失衡转身，再攻击背部的<b>朱砂囊泡</b>',
      '正面几乎打不动！引诱屠夫冲撞<b>冷凝管</b>或射击冷凝管，<br>趁它失衡攻击背部的<b>朱砂囊泡</b>', 10);
  })();
  await g.until(() => !butcher.alive);
  g.boss = null;
  g.hud.setBoss(null);

  // ---------- 击败后：老周登场 ----------
  await g.wait(1.5);
  await g.setCutscene(true);
  g.openDoor('L');
  const zhou = g.spawnCompanion('zhou', 3, 20);
  zhou.following = false;
  g.lookTarget = g.cellToWorld(3, 21, 1.6);
  const walkTo = cellCenter(3, 22);
  await g.until(() => {
    zhou.pos.lerp(new THREE.Vector3(walkTo.x, 0, walkTo.z + 0.5), 0.02);
    return zhou.pos.distanceTo(new THREE.Vector3(walkTo.x, 0, walkTo.z + 0.5)) < 0.3;
  });
  await g.say('', '冷库深处的小门里，走出一个满脸疲惫的大叔——周振山。', 3);
  await g.say('老周（嚼着槟榔）', '你们可算来了。再不来我就得拿勺子跟它们拼了。');
  await g.say('林骁', '老周？你不是在局里休假？');
  await g.say('老周（摊手）', '休假休到了游轮上，命苦。');
  await g.say('老周', '驾驶舱就在里面，没人。船是自己在开。');
  await g.setCutscene(false);
  zhou.following = true;
  g.objective('前往驾驶舱');
  g.saveCheckpoint();

  // ---------- 场7：驾驶舱 ----------
  await g.until(() => g.inCells(1, 16, 6, 20));
  await g.setCutscene(true);
  g.frozen = true;
  g.lookTarget = g.cellToWorld(3, 17, 1.3);
  await g.say('', '驾驶舱空无一人，舵盘自行转动。雷达屏幕上，云梦号正驶向巫山方向。', 3.5);
  audio.radio();
  await g.say('广播（变声处理的男声）', '女士们先生们，欢迎来到长江的最后一夜。', 4);
  await g.say('广播', '三峡的水，养了五千年的人，也该洗一洗了。', 4);
  await g.say('广播', '愿“净江者”与你们同在。', 3);
  await g.say('林骁（拍桌）', '他们要把船开到哪？');
  await g.say('陈砚（耳麦，急促）', '林队！雷达上的航线……船正在往巫山七二一水域加速！那是我们三个月前探过的——');
  audio.radio();
  await g.say('', '（信号被切断）', 1.5);
  audio.impact();
  g.shakeCamera(1.2);
  await g.say('', '船舱底部传来巨响，像有什么东西在撞击船体。', 3);
  g.hud.setFade(1, 2500);
  await g.wait(3);
  g.hud.setCaption('第一章　云梦号<br><small>— 完 —</small>');
  await g.wait(4);
  g.hud.setCaption('');
  g.setState('ended');
}
