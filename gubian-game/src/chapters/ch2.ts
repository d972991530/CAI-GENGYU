import type { Game } from '../game/game';
import { audio } from '../core/audio';

// 第二章 回溯·七二一（老周 / 陈砚，三个月前）
export async function ch2(g: Game) {
  g.setLoadout(['pistol', 'mg'], { ammo: 36, mg_ammo: 60 });
  g.switchWeapon('pistol');
  g.hp = 100;
  g.armor = 25;
  g.herbs = 1;
  const chen = g.npc('chen', 'chen', true);
  chen.followDist = 2.6;

  const guards = ['guard1', 'guard2', 'guard3', 'guard4'].map((m) => g.spawn('guard', m));
  for (const e of guards) e.awakeRadius = 8;

  await g.cine([
    { title: ['第二章', '回溯 · 七二一'], dur: 3, sfx: 'stinger' },
    { caption: '三个月前<br><small>巫山深处</small>', dur: 3 },
    { img: 'tex:m_ch2', kb: 'in', chars: [{ id: 'zhou', side: 'left' }, { id: 'chen', side: 'right' }], lines: [
      ['', '群山环抱，杂草覆盖的铁轨延伸进山体。锈蚀的牌子上依稀可见“七二一厂”四个红字。'],
      ['老周', '这就是你说的“可疑信号源”？我当兵的时候，这地儿早就废了。'],
      ['陈砚（盯着平板）', '废是废了，但最近三个月，这儿的电力消耗比一个中型医院还大。'],
      ['老周', '那就是有人住。'], ['陈砚', '我更倾向于——有人在搞事。'],
    ] },
  ]);
  g.objective('潜入七二一厂主厂房');
  g.hint('本章操作老周：<b>1</b> 手枪 <b>2</b> 重机枪<br>从背后靠近守卫按 <b>E</b> 可无声击倒', '本章操作老周：点 <b>换枪</b> 切换重机枪<br>从背后靠近守卫点 <b>互动</b> 可无声击倒', 9);

  await g.until(() => g.inRect(1, 7, 26, 13));
  g.saveCheckpoint();
  await g.say('陈砚（耳语）', '这些人不是警察，也不是军队。');
  await g.say('老周', '看工装。百慧生物？医药公司，在这儿？');
  g.objective('绕到控制室，黑入终端');

  await g.interact('terminal', 'terminal', '黑入终端', undefined, -1.2, 0);
  while (!(await g.mg.hack('黑入百慧终端', 4, 30))) g.hud.message('连线超时，重新尝试……');
  await g.hud.showDocument('档案二 · “万蛊计划”项目概述',
    '<p>万蛊计划（WG Project）——1976 年立项。</p><p>以战国朱砂菌为基底，研究神经接管技术。</p><p>早期研究员：<b class="red">苏明远</b>，方鹤年……</p>');
  await g.say('陈砚', '苏明远……苏晚的父亲？');
  await g.say('老周（皱眉）', '这事不能让丫头知道。至少现在不能。');
  g.setFlag('hack');
  g.objective('进入地下一层生化实验区');

  // ---------- 地下一层 ----------
  await g.until(() => g.inRect(1, 15, 26, 19));
  g.saveCheckpoint();
  audio.setAmbientLevel(0.8);
  g.spawn('gu', 'b1gu1', { state: 'dormant' });
  g.spawn('gu', 'b1gu2');
  g.objective('收集实验日志碎片（0/4），寻找铜钥匙');
  let logs = 0;
  const texts = [
    '1976.11 —— 楚墓出土的朱砂样本在 37℃ 下出现自主增殖。',
    '1979.03 —— 受试者听见“歌声”。铜器敲击可使菌丝短暂休眠。',
    '1985.07 —— 方提议终止试验，被驳回。苏坚持保留“送魂”样本。',
    '2016.10 —— 苏明远失踪。样本 CG-7 母体转移至……（字迹被血污盖住）',
  ];
  ['log1', 'log2', 'log3', 'log4'].forEach((m, i) => g.addInteract(m, m, '拾取实验日志碎片', async () => {
    g.removeInteract(m);
    logs++;
    g.objective(`收集实验日志碎片（${logs}/4），寻找铜钥匙`);
    await g.hud.showDocument(`实验日志碎片 ${i + 1}/4`, `<p>${texts[i]}</p>`);
    if (logs === 2) {
      await g.cine([{ img: 'f17', kb: 'in', lines: [['', '玻璃培养舱内，浸泡着一具具朱砂色的人形，胸膛起伏。'], ['陈砚（声音发抖）', '它们……还活着。'], ['老周', '别出声。']] },
        { img: 'f29', kb: 'in', dur: 1.2, sfx: 'stinger' }, { img: 'f30', kb: 'in', dur: 1.4, shake: true }]);
      g.jumpscare('water_gu', 6);
    }
  }, 'doc'));
  await g.until(() => g.keys.has('yellow'));
  g.objective('用铜钥匙打开通往地下二层的铁门');

  // ---------- 地下二层矿道 ----------
  await g.until(() => g.inRect(1, 21, 30, 24));
  g.saveCheckpoint();
  const ore1 = g.spawn('ore', 'ore1');
  const ore2 = g.spawn('ore', 'ore2', { state: 'dormant' });
  await g.say('陈砚', '那东西身上全是矿石……子弹打不进去！');
  g.objective('黑入配电箱，让矿道铁轨通电');
  g.hint('矿蛊体表附着矿石，普通子弹几乎无效——<br>引它们站上 <b>铁轨</b>，再拉 <b>配电箱</b> 放电', '矿蛊免疫子弹：引到铁轨上，再拉配电箱放电', 9);
  let qte = false;
  (async () => {
    await g.until(() => !ore1.alive || ore1.pos.distanceTo(g.playerPos) < 2.2);
    if (!ore1.alive) return;
    qte = true;
    const ok = await g.mg.mash('矿蛊扑来！快速格挡！', 10, 3.5);
    if (ok) { ore1.stun(3); g.hud.message('格挡成功！'); } else g.damagePlayer(25, ore1.pos, '矿蛊');
  })();
  const pullPower = async () => {
    for (;;) {
      await g.interact('power', 'power', '拉闸放电（铁轨通电 10 秒）', undefined, 0.6, 0);
      await g.say('陈砚（喊）', '老周！引到铁轨上去！我这边拉闸！');
      const rails: [number, number][] = [];
      for (let c = 1; c <= 30; c++) rails.push([c, 22], [c, 23]);
      g.electrify(rails, 10);
      if (!ore1.alive && !ore2.alive) return;
      await g.wait(12);
    }
  };
  pullPower();
  await g.say('老周（嚼着槟榔，冷笑）', '小子，听你的。');
  await g.until(() => !ore1.alive && (!ore2.alive || g.inRect(31, 21, 34, 24)));
  void qte;
  g.objective('进入矿道尽头的档案室');
  await g.until(() => g.inRect(32, 21, 34, 24));
  await g.interact('archive', 'archive', '查看运输单', 'doc');
  await g.cine([{ img: 'f23', kb: 'in', lines: [
    ['陈砚（念）', '“青铜棺×1，战国楚墓出土，经巫山水路运往……‘云梦号’游轮，10月9日启程。”'],
    ['老周', '他们要把一口棺材，运上一艘载满人的游轮？'], ['陈砚', '不是棺材。是母体。'],
  ] }, { img: 'f17', kb: 'out', dur: 1.5, sfx: 'stinger', tint: 'rgba(255,0,0,0.4)', lines: [['', '警报突然响起。红灯闪烁。']] }]);

  // ---------- 逃脱 ----------
  g.objective('逃！沿矿道冲出去');
  g.saveCheckpoint();
  for (const m of ['horde1', 'horde2', 'horde3', 'horde4']) g.spawn('gu', m).awaken();
  g.spawn('ore', 'horde1').awaken();
  for (const a of g.level!.anchors) a.color = 0xff1010;
  g.hint('别恋战！按住 <b>Shift</b> 小跑，冲向西侧出口', '别恋战！把摇杆推到底小跑，冲向西侧出口', 6);
  await g.reachExit();
  await g.cine([
    { img: 'tex:m_ch2', kb: 'left', shake: true, lines: [['', '矿车冲出隧道口，坠入山下的草丛。老周的腿被划开一道深口。']] },
    { img: 'f02', kb: 'in', chars: [{ id: 'chen', side: 'right' }], sfx: 'radio', lines: [
      ['陈砚（喘气，拨通电话）', '许副局长！我是陈砚！七二一厂有大规模生物实验，百慧在背后——'],
      ['许怀远（电话，温和）', '别急。你们现在安全吗？把定位发给我，我派人接应你们。'],
      ['陈砚', '好……我们在……'], ['', '老周猛地夺过电话挂断，拔出电池。'],
      ['老周（盯着他）', '你没发现吗？他问的第一句话，不是证据在哪，是——你们现在安全吗。'],
      ['老周', '他还没问我们看到了什么，就问我们在哪。'],
    ] },
    { img: 'f01', kb: 'in', lines: [['', '夜。江边废弃的渔船里，陈砚脸色苍白地抱着一块硬盘。'], ['陈砚', '证据是全的，但……没人会信。'],
      ['老周（包扎伤口）', '那我就自己去查。我听说，百慧包下一艘游轮，10月9日。'], ['陈砚', '你要……上船？'], ['老周（拍拍他肩）', '总得有人在现场。你负责在外面当我的眼睛。']] },
    { caption: '现在——10月9日，凌晨2:40<br><small>第二章　完</small>', dur: 3.5 },
  ]);
}
