import type { Game } from '../game/game';
import { audio } from '../core/audio';

// 第七章 白帝城（林骁 / 苏晚）
export async function ch7(g: Game) {
  const gaveSerum = g.choices.ch5 === 0;
  g.setLoadout(['pistol', 'cryo'], { ammo: 48, cryo_ammo: 18 });
  g.hp = 100;
  g.armor = 50;
  g.herbs = 2;
  g.npc('su', 'su', true);
  g.npc('man', 'man', true);
  g.bellUnlocked = true;
  g.zhenyinUnlocked = true;

  await g.cine([
    { title: ['第七章', '白帝城'], dur: 3, sfx: 'stinger' },
    { caption: '许怀远叛变<br><small>钟曼的目标，指向三峡</small>', dur: 3 },
    { img: 'f01', kb: 'right', sfx: 'gunshot', chars: [{ id: 'zhou', side: 'left' }], lines: [
      ['', '五人乘快艇逆流而上，穿过夔门峡口。无名会武装艇从两岸礁石间冲出。'],
      ['老周（扛着榴弹发射器）', '今晚的烟花，我包了！'],
      ['陈砚', '黑进去了——它们的导航归我了。'], ['', '敌艇接连撞上暗礁，在江面上燃起火光。'],
    ] },
    { img: 'tex:m_ch7', kb: 'in', lines: [['', '凌晨。白帝城山门。无名会成员驱使着蛊群在山门外游荡。']] },
  ]);
  g.objective('突破白帝城山门');
  for (const m of ['c1', 'c2', 'c3', 'c4', 'c5']) g.spawn('cultist', m);
  for (const m of ['g1', 'g2', 'g3', 'g4']) g.spawn('gu', m);
  g.setFlag('bellCharm');
  await g.until(() => g.inRect(1, 6, 34, 12));
  g.saveCheckpoint();
  await g.say('陈砚（耳语）', '镇音的铃，也能反过来用。');
  await g.say('小满（点头，摇响铜铃）', '这样可以吗？');
  g.hint('按 <b>Q</b> 让小满摇铃：附近的蛊化者会<b>调头攻击无名会</b>', '点 <b>铜铃</b>：附近的蛊化者会调头攻击无名会', 8);
  const cultists = () => g.enemies.filter((e) => e.alive && e.kind.name === '无名会武装').length;
  while (cultists() > 0) {
    g.objective(`突破白帝城山门（剩余无名会 ${cultists()}）`);
    await g.wait(1);
  }
  g.setFlag('gate');
  g.objective('进入白帝庙托孤堂');

  // ---------- 托孤堂 ----------
  await g.until(() => g.inRect(8, 14, 26, 19));
  g.saveCheckpoint();
  await g.cine([
    { img: 'tex:m_ch7', kb: 'in', lines: [
      ['', '大殿内供奉着刘备托孤的泥塑。烛光摇曳，一个坐在轮椅上的枯瘦老人背对众人，面朝塑像。'],
      ['方鹤年（不回头）', '你们终于来了。（缓缓转轮椅）苏晚，你长得很像你母亲。'],
      ['苏晚（强压颤抖）', '我爸呢？'], ['方鹤年', '你站在他面前。'],
    ] },
    { img: 'f18', kb: 'in', sfx: 'stinger', lines: [
      ['', '方鹤年的轮椅后，是一面巨大的玻璃幕墙。幕墙内浸泡着一具与青铜棺相连的躯体，身上缠满朱砂色菌丝。'], ['苏晚（失声）', '爸……？'],
      ['方鹤年', '十年前，钟曼想取蛊母作为武器。你父亲用自己做了容器，把它锁在体内。他的意识，还在“回声”里。'],
      ['林骁（低声）', '所以母体……'], ['方鹤年', '是你父亲的身体。钟曼三天前把它运去了三峡大坝的水下闸室。她要把蛊母放进库区，顺流而下。'],
      ['老周（咬牙）', '那是整条长江！'], ['方鹤年', '唯一的办法，是让蛊母“回家”。血清是引子，铜铃与歌声是路。'],
      ...(gaveSerum ? [['方鹤年', '许怀远拿走的那支……是复制品。真的，我一直替晚晚收着。'] as [string, string]] : []),
      ['方鹤年', '孩子，你奶奶教过你《安山调》吗？'], ['小满（点头，眼泪滑落）', '教过。'],
    ] },
  ]);
  g.setFlag('hall');

  // ---------- 地宫 · 安山调 ----------
  g.objective('进入地宫，按“三长两短”激活机关');
  await g.interact('rhythm', 'rhythm', '石壁上的《安山调》音符');
  while (!(await g.mg.rhythm('安山调 · 三长两短', ['L', 'L', 'L', 'S', 'S']))) { /* 重来 */ }
  audio.impact();
  await g.say('', '暗道门开启的瞬间，枪声响起。', 2.5);

  // ---------- 许怀远 ----------
  const xu = g.spawn('xu', 'xu');
  xu.awakeRadius = 0;
  g.spawn('cultist', 'xuGuard1').awaken();
  g.spawn('cultist', 'xuGuard2').awaken();
  await g.cine([{ img: 'tex:m_ch7', kb: 'out', chars: [{ id: 'xu', side: 'center' }], lines: [
    ['许怀远（站在殿门，身后是持枪特勤）', '林骁，把血清交出来。'], ['林骁', '许局。你已经没有退路了。'], ['许怀远（苦笑）', '我早就没有了。'],
  ] }]);
  xu.awaken();
  xu.mat.color.setRGB(0.8, 0.8, 0.8);
  g.boss = xu;
  g.bossName = '许怀远';
  g.objective('击败许怀远');
  g.hint('第一阶段：利用 <b>立柱</b> 躲避子弹；<br>他异化后，用 <b>铜铃</b> 让他僵直，再用 <b>冷凝枪</b> 打背后的菌核', '躲在立柱后；他异化后用 <b>铜铃</b> 僵直，<b>冷凝枪</b> 打菌核', 10);
  g.addPickup('cryo_ammo', 9, 19, 25);
  g.addPickup('ammo', 25, 15, 25);
  let phase = 1;
  xu.onDamaged = (e) => {
    if (phase === 1 && e.hp < e.maxHp * 0.55) {
      phase = 2;
      (async () => {
        e.stun(2.5);
        await g.cine([{ img: 'tex:m_ch7', kb: 'in', chars: [{ id: 'xu', side: 'center' }], sfx: 'roar', shake: true, tint: 'rgba(120,0,0,0.4)', lines: [['', '许怀远从口袋掏出一支 CG-7 样本，注入体内。身体异化，背生朱砂菌触手。'], ['许怀远（嘶哑）', '我女儿……只剩……三年……'], ['林骁（闪避，咬牙）', '你不是在救她，你是在杀更多人！']] }]);
        e.mat.color.setRGB(1.3, 1.3, 1.3);
        g.bossName = '异化许怀远';
        e.speed = 3.4;
        g.jumpscare('xu', 0);
      })();
    }
  };
  await g.until(() => !xu.alive);
  g.boss = null;
  g.hud.setBoss(null);
  await g.cine([
    { img: 'tex:m_ch7', kb: 'in', chars: [{ id: 'xu', side: 'center' }], dark: true, lines: [
      ['', '许怀远倒地，朱砂脉络退去，露出苍老的本来面目。'], ['许怀远（气若游丝）', '阿骁……对不起。'],
      ['', '他从内袋掏出一枚 U 盘，颤抖着塞进林骁手里。'], ['许怀远', '大坝闸室……的权限码。替我……看看她。'], ['', '许怀远闭上眼睛。'],
    ] },
    { img: 'f25', kb: 'in', lines: [
      ['', '白帝城码头，日落。方鹤年被抬上快艇，气息微弱。'], ['方鹤年（握住苏晚的手）', '晚晚。你爸爸……一直想对你说……'],
      ['苏晚（蹲下）', '说什么？'], ['方鹤年', '对不起，没能陪你长大。'], ['', '方鹤年闭上眼。苏晚低头，泪水无声滴落。'],
      ['林骁（轻声）', '走吧。去接他回家。'],
    ] },
  ]);
  g.setFlag('xu');
  g.objective('穿过暗道，前往码头');
  await g.reachExit();
  await g.cine([{ caption: '第七章　白帝城<br><small>— 完 —</small>', dur: 3 }]);
}
