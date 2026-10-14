import type { Game } from '../game/game';
import type { Enemy } from '../entities/enemy';
import { audio } from '../core/audio';

// 第一章 云梦号（剧本 场1–场7）
export async function ch1(g: Game) {
  g.setLoadout(['pistol'], { ammo: 36 });
  g.herbs = 1;
  g.armor = 0;
  g.hp = 100;
  const su = g.npc('su', [2, 3], true);

  // 宴会厅：宾客背对入口站成两排，一动不动
  const guests: Enemy[] = [];
  for (const row of [9, 11]) for (let col = 4; col <= 14; col += 2) {
    const e = g.spawn('guest', [col, row], { state: 'dormant', ox: (Math.random() - 0.5) * 0.8, oz: (Math.random() - 0.5) * 0.5 });
    guests.push(e);
  }
  const aw1 = guests[2], aw2 = guests[10], aw3 = guests[7];
  g.spawn('guest', 'cabinGu');
  g.spawn('gu', 'corrGu1');
  g.spawn('guest', 'corrGu2');
  g.spawn('gu', 'cook1');
  g.spawn('gu', 'cook2');
  g.spawn('guest', 'cook3', { state: 'dormant' });

  await g.cine([
    { title: ['第一章', '云梦号'], dur: 3.2, sfx: 'stinger' },
    { caption: '2026年10月9日　凌晨1:12<br><small>长江 · 丰都江段</small>', dur: 3.5 },
    {
      video: 'opening', from: 0, to: 5.8,
      lines: [['陈砚（耳麦）', '林队，卫星热成像显示云梦号上有两百多个热源，但……没有一个在移动。', 3.2], ['林骁', '什么意思？', 1.2], ['陈砚（耳麦）', '就是……两百多个人，全站着不动。', 1.6]],
    },
    { img: 'f05', kb: 'in', lines: [['苏晚', '丰都。传说里的鬼城。（轻声）别又来这套。'], ['林骁', '不是鬼。先找幸存者。']] },
  ]);

  g.objective('搜索甲板，查看散落的物品');
  g.hint('<b>WASD</b> 移动　<b>鼠标</b> 视角　<b>Shift</b> 小跑（耗体力）<br><b>E</b> 互动 / 开门　<b>Tab</b> 地图',
    '左侧 <b>摇杆</b> 移动（推到底小跑），右侧 <b>滑动</b> 转视角<br>靠近物品点 <b>互动</b>', 9);

  await g.interact('phone', 'phone', '查看被踩碎的手机', 'doc');
  await g.hud.showDocument('手机 · 最后一段视频',
    '<p>画面剧烈晃动。宴会厅的水晶灯下，宾客在尖叫。</p><p>镜头对准一个男人——他的脖颈上，正缓缓浮起<b class="red">朱砂色的脉络</b>。</p><p>视频在一声闷响中中断。</p>');
  await g.say('苏晚（压低声音）', '不是普通感染。这个脉络的走向……像是被“画”上去的。');
  await g.say('林骁', '先找幸存者。');
  g.setFlag('phone');
  g.objective('沿着血迹进入一层宴会厅');

  // ---------- 宴会厅 ----------
  await g.until(() => g.inRect(1, 6, 18, 14));
  g.saveCheckpoint();
  audio.setAmbientLevel(0.75);
  g.objective('调查宴会厅里一动不动的宾客');
  await g.until(() => g.near('aw1', 4.5) || g.near('aw2', 4.5) || g.near('aw3', 4.5) || g.inRect(1, 8, 18, 14));
  await g.cine([
    { img: 'f08', kb: 'in', dur: 1.6, dark: true },
    { img: 'f10', kb: 'in', dur: 1.4, sfx: 'stinger', shake: true },
  ]);
  aw1.awaken();
  g.hint('<b>左键</b> 射击　<b>R</b> 换弹　<b>右键 / F</b> 手电强光<br>瞄准头部伤害三倍', '按住 <b>开火</b> 射击，可同时拖动瞄准<br>瞄准头部伤害三倍', 7);
  await g.until(() => !aw1.alive);
  await g.cine([{ img: 'f13', kb: 'in', lines: [['苏晚', '让我看看它——勘察镜能扫描菌群。'], ['苏晚', '朱砂菌群接管了神经。他们怕光——光会让菌丝收缩。'], ['林骁', '那就别关灯。']] }]);
  g.hint('按 <b>C</b> 勘察镜扫描弱点　<b>F / 右键</b> 强光使前方蛊化者硬直', '点 <b>勘察</b> 扫描弱点，点 <b>强光</b> 使前方蛊化者硬直', 8);
  aw2.awaken();
  await g.until(() => !aw2.alive);
  aw3.awaken();
  // 另一位宾客悄悄转身
  guests[5].awaken();
  await g.until(() => !aw3.alive && !guests[5].alive);
  await g.wait(1);
  g.setFlag('hall');
  g.objective('探索客房走廊，寻找通往底层的钥匙卡');

  // ---------- 走廊 / 客房 ----------
  await g.until(() => g.inRect(20, 6, 21, 20));
  g.saveCheckpoint();
  audio.groan(g.at('cabinGu', 1.6), 0.8, 0.9);
  // 走廊灯光熄灭 —— 跳脸（后台触发，不阻塞主线）
  (async () => {
    await g.until(() => g.inRect(20, 12, 21, 16));
    g.shakeCamera(0.3);
    audio.whisper();
    await g.wait(1.2);
    g.jumpscare('infected', 8);
  })();

  let gotList = false;
  g.addInteract('list', 'list', '阅读档案', async () => {
    g.removeInteract('list');
    await g.hud.showDocument('档案一 · 云梦号乘客名单',
      '<p>百慧集团「年度鸡尾酒会」贵宾名单（共 217 人）</p><ul><li>……</li><li>王文涛　百慧生物 · 研发中心</li><li>沈　红　百慧生物 · 实验员</li><li><b class="red">钟　曼　百慧集团 · 董事长</b></li></ul>');
    gotList = true;
    g.sayAsync([['陈砚（耳麦）', '等等，这名单上有个名字我认识——钟曼，百慧集团董事长。她今晚也在船上？'], ['苏晚', '百慧……（停顿）我父亲当年所在的公司。']]);
  }, 'doc');
  await g.until(() => gotList && g.keys.has('red'));
  await g.wait(3);
  g.setFlag('cabin');
  audio.bell(g.at('man', 1), 0.5);
  setTimeout(() => audio.bell(g.at('man', 1), 0.35), 900);
  g.objective('走廊尽头的客房……传来微弱的铃声');
  g.hint('拿到 <b>红色钥匙卡</b> 后可以打开后厨的红色门', '拿到 <b>红色钥匙卡</b> 后可以打开后厨的红色门', 6);

  await g.interact('wardrobe', 'wardrobe', '打开衣柜', undefined, 1.1, 0);
  const wave = ['wave1', 'wave2', 'wave3', 'wave4'].map((m) => g.spawn('guest', m));
  await g.cine([
    { img: 'f19', kb: 'in', sfx: 'stinger', lines: [['小满（缩在柜角，攥着铜铃）', '别过来……它们听到铃声就会走开的。']] },
    { img: 'f20', kb: 'in', chars: [{ id: 'man', side: 'right' }], lines: [['林骁（蹲下，缓缓放下枪）', '我们是警察。你叫什么名字？'], ['小满', '小满。我找不到奶奶了。'], ['苏晚（低声）', '林骁，这个铃……上面的云雷纹，和朱砂蛊的脉络一模一样。']] },
    { img: 'f21', kb: 'in', sfx: 'bell', lines: [['', '铃声响起。走廊外的蛊化者齐齐一顿，往后退了半步。']] },
    { img: 'f20', kb: 'out', lines: [['林骁（会意）', '带着她。']] },
  ]);
  for (const e of wave) { e.awaken(); e.flee(5); }
  g.npc('man', 'man', true);
  g.bellUnlocked = true;
  g.hint('按 <b>Q</b> 让小满摇铃，驱散附近的小型蛊化者（冷却 60 秒）', '点 <b>铜铃</b> 让小满摇铃，驱散附近的蛊化者（冷却 60 秒）', 8);
  g.objective('用红色钥匙卡打开后厨');
  g.saveCheckpoint();

  // ---------- 后厨冷库 · 屠夫 ----------
  await g.until(() => g.inRect(8, 16, 18, 20));
  g.saveCheckpoint();
  g.objective('穿过后厨，进入冷库');
  await g.until(() => g.inRect(1, 22, 18, 26));
  g.openDoor('7', false);
  const butcher = g.spawn('butcher', 'butcher');
  butcher.awakeRadius = 0;
  g.saveCheckpoint();
  await g.cine([
    { img: 'f15', kb: 'in', dur: 2, lines: [['苏晚', '这里温度太低了……有东西在里面。']] },
    { img: 'f16', kb: 'in', sfx: 'roar', shake: true, dur: 2.2 },
  ]);
  butcher.awaken();
  g.boss = butcher;
  g.objective('击败屠夫');
  g.addPickup('ammo', 6, 22, 25);
  g.addPickup('ammo', 12, 26, 25);
  g.addPickup('herb', 1, 26, 45);
  g.sayAsync([['苏晚', '它身上的厚脂肪挡住了子弹！引它撞向冷凝管，冷气会让它僵住！'], ['林骁', '你负责看，我负责打。']]);
  g.hint('屠夫正面很难打穿：引它<b>冲撞冷凝管</b>，或<b>射击它身旁的冷凝管</b>，冻住后猛攻', '引屠夫<b>冲撞冷凝管</b>或<b>射击冷凝管</b>，冻住后猛攻', 10);
  await g.until(() => !butcher.alive);
  g.boss = null;
  g.hud.setBoss(null);

  await g.wait(1.2);
  g.openDoor('8');
  const zhou = g.npc('zhou', 'zhou');
  await g.cine([
    { img: 'f15', kb: 'out', chars: [{ id: 'zhou', side: 'center' }], lines: [['', '屠夫倒地，身体迅速枯萎。冷库深处一扇小门里，走出一个满脸疲惫的大叔——周振山。'], ['老周（嚼着槟榔）', '你们可算来了。再不来我就得拿勺子跟它们拼了。'], ['林骁', '老周？你不是在局里休假？'], ['老周（摊手）', '休假休到了游轮上，命苦。驾驶舱就在里面，没人。船是自己在开。']] },
  ]);
  zhou.following = true;
  g.objective('前往驾驶舱');
  g.saveCheckpoint();

  // ---------- 驾驶舱 ----------
  await g.until(() => g.inRect(1, 16, 6, 20));
  g.setCutscene(true);
  g.lookTarget = g.at('bridge', 1.3);
  await g.say('', '驾驶舱空无一人，舵盘自行转动。雷达屏幕上，云梦号正驶向巫山方向。', 3.5);
  await g.say('广播（变声处理的男声）', '女士们先生们，欢迎来到长江的最后一夜。三峡的水，养了五千年的人，也该洗一洗了。', 5);
  await g.say('广播', '愿“净江者”与你们同在。', 3);
  await g.say('林骁（拍桌）', '他们要把船开到哪？');
  await g.say('陈砚（耳麦，急促）', '林队！雷达上的航线……船正在往巫山七二一水域加速！那是我们三个月前探过的——');
  audio.impact();
  g.shakeCamera(1.2);
  g.setCutscene(false);
  void su;
  g.objective('船底传来巨响——到驾驶舱出口');
  await g.reachExit();
  await g.cine([
    { img: 'f25', kb: 'in', sfx: 'impact', shake: true, lines: [['', '船舱底部传来巨响，像有什么东西在撞击船体。']] },
    { caption: '第一章　云梦号<br><small>— 完 —</small>', dur: 3 },
  ]);
}
