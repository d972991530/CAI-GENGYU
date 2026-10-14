import type { Game } from '../game/game';
import { audio } from '../core/audio';

// 第五章 七二一的亡灵（苏晚 + 小满）
export async function ch5(g: Game) {
  const choseA = g.choices.ch4 === 0;
  g.setLoadout(['cryo', 'pistol'], { ammo: 24, cryo_ammo: choseA ? 12 : 24 });
  g.hp = 90;
  g.armor = 0;
  g.herbs = choseA ? 1 : 3;
  g.npc('man', 'man', true);
  g.bellUnlocked = true;
  g.zhenyinUnlocked = false;

  await g.cine([
    { title: ['第五章', '七二一的亡灵'], dur: 3, sfx: 'stinger' },
    { caption: '苏晚与小满漂至七二一厂下游<br><small>老周独自游向对岸，去寻找陈砚</small>', dur: 3.5 },
    { img: 'tex:m_ch5', kb: 'in', chars: [{ id: 'su', side: 'left' }, { id: 'man', side: 'right' }], lines: [
      ['', '苏晚拖着湿透的身体上岸，小满抱着铜铃，瑟瑟发抖。'], ['苏晚（喘气）', '你冷吗？'],
      ['小满', '不冷。……苏姐姐，这个地方，铃一直在响。'], ['', '苏晚低头，铜铃表面的云雷纹在微微发烫。'],
    ] },
  ]);
  g.objective('进入七二一厂地下一层');
  g.hint('本章操作苏晚：<b>冷凝枪</b> 可冻结敌人、击碎矿蛊的矿甲；手电较弱，多用 <b>勘察镜</b>', '本章操作苏晚：<b>冷凝枪</b> 冻结敌人、击碎矿甲；多用 <b>勘察</b>', 9);
  if (choseA) g.hud.message('许怀远掌握了你的行踪……追兵更多了');

  // ---------- 培养舱走廊 ----------
  await g.until(() => g.inRect(12, 1, 34, 4));
  g.saveCheckpoint();
  g.flashlightWeak = true;
  await g.say('小满（拉住苏晚衣角）', '姐姐……它们在看我们。');
  await g.say('苏晚（强压恐惧）', '别看。往前走。');
  (async () => {
    await g.until(() => g.inRect(22, 1, 26, 4));
    await g.cine([{ img: 'f30', kb: 'in', dur: 1.6, sfx: 'scream', shake: true }]);
    g.spawn('gu', 'scare', { oz: 1 }).awaken();
    if (choseA) { g.spawn('cultist', [33, 2]).awaken(); g.spawn('cultist', [31, 3]).awaken(); }
  })();

  // ---------- 配电与门禁 ----------
  await g.until(() => g.inRect(20, 6, 34, 13));
  g.saveCheckpoint();
  g.objective('修复三处配电箱，恢复档案室电力（0/3）');
  g.spawn('ore', 'ore1', { state: 'dormant' });
  g.spawn('ore', 'ore2');
  g.spawn('gu', 'gu1');
  let fixed = 0;
  const repair = (m: string) => g.addInteract(m, m, '修复配电箱', async () => {
    g.removeInteract(m);
    if (await g.mg.hack('接通线路', 3, 30)) {
      fixed++;
      audio.explosion();
      g.objective(`修复三处配电箱，恢复档案室电力（${fixed}/3）`);
      if (fixed === 3) g.setFlag('power');
    } else {
      g.hud.message('接线失败，再试一次');
      repair(m);
    }
  });
  ['box1', 'box2', 'box3'].forEach(repair);
  g.addInteract('bench', 'bench', '化学合成台：制作冷凝弹', () => {
    g.reserve.cryo_ammo += 12;
    g.hud.message('合成冷凝弹 ×12');
    audio.pickup();
  });
  await g.until(() => fixed >= 3);

  // ---------- 档案室 ----------
  g.objective('进入档案室');
  await g.until(() => g.inRect(12, 9, 18, 12));
  g.saveCheckpoint();
  await g.interact('tape', 'tape', '按下老式录音机');
  await g.cine([
    { img: 'tex:m_terminal', kb: 'in', lines: [['', '档案室墙上贴满发黄的照片。其中一张，是年轻的苏明远抱着襁褓中的婴儿，背景是实验室。'], ['苏晚（声音发颤）', '……这是我。']] },
    { img: 'tex:m_terminal', kb: 'out', dark: true, sfx: 'radio', lines: [
      ['苏明远（录音，沙哑）', '晚晚，如果你听到这段话，说明爸爸没能回去。'],
      ['苏明远', '朱砂蛊本是楚巫用来“送魂”的东西。他们用铜与歌声让它沉睡。百慧要的是反过来——用它“唤醒”。'],
      ['苏明远', '爸爸做了一份血清，藏在七二一最深处的冷库。它不是解药，它是……钥匙。能让蛊母“回家”的钥匙。'],
      ['苏明远', '无论谁找你要这份血清，不要给穿官服的人。'],
    ] },
  ]);
  g.setFlag('tape');

  // ---------- 矿车枢纽 · 钢骨 ----------
  g.objective('穿过矿车枢纽');
  await g.until(() => g.inRect(1, 15, 34, 23));
  g.saveCheckpoint();
  const boss = g.spawn('steelbone', 'steelbone');
  boss.awakeRadius = 0;
  await g.cine([{ img: 'tex:m_ch5', kb: 'in', chars: [{ id: 'steelbone', side: 'center' }], sfx: 'roar', shake: true, lines: [['', '与废旧矿车融合的巨型感染体——钢骨。胸腔嵌着一台仍在转动的发电机。']] }]);
  boss.awaken();
  g.boss = boss;
  g.objective('击败钢骨');
  g.addPickup('cryo_ammo', 2, 23, 25);
  g.addPickup('cryo_ammo', 33, 15, 25);
  g.hint('拉动两侧 <b>道岔扳手</b>，让冲锋的钢骨撞墙；用 <b>冷凝枪</b> 冻结它，再打胸口的发电机', '拉 <b>道岔扳手</b> 让钢骨撞墙；<b>冷凝枪</b> 冻结后打胸口发电机', 10);
  g.sayAsync([['苏晚', '小满，摇铃！让它往左边转！'], ['小满（含泪摇铃）', '铃啊……铃啊……']]);
  let switched = 0;
  const lever = (m: string) => g.addInteract(m, m, '扳动道岔', () => {
    switched = g.time + 6;
    audio.door();
    g.hud.message('道岔已切换：6 秒内它冲锋会撞上配电柜！');
  });
  lever('lever1');
  lever('lever2');
  boss.behavior = (e) => {
    if (e.state === 'charge' && switched > g.time) {
      switched = 0;
      e.state = 'stunned';
      e.stateT = 5;
      e.vulnerable = true;
      e.damage(120, 'weak');
      audio.explosion();
      g.shakeCamera(0.8);
      g.hud.message('钢骨撞上了配电柜！');
      setTimeout(() => (e.vulnerable = false), 5000);
      return true;
    }
    return false;
  };
  await g.until(() => !boss.alive);
  g.boss = null;
  g.hud.setBoss(null);
  g.removeInteract('lever1');
  g.removeInteract('lever2');
  await g.cine([{ img: 'tex:m_ch5', kb: 'out', lines: [['', '钢骨瘫倒，发电机熄灭。深处的冷库门缓缓打开，寒气涌出。']] }]);
  g.setFlag('steelbone');

  // ---------- 冷库 · 血清 ----------
  await g.interact('serum', 'serum', '取下血清瓶', 'serum');
  await g.cine([
    { img: 'f15', kb: 'in', lines: [['', '冷库中央，悬着一支被红色冷光包裹的血清瓶，瓶身上刻着：“赠晚晚”。'], ['', '苏晚走近，手指触到瓶身的瞬间，小满手中的铜铃突然发出清亮的长鸣。']], sfx: 'bell' },
    { img: 'f18', kb: 'in', sfx: 'stinger', shake: true, lines: [['', '冷库深处，所有培养舱同时亮起。'], ['小满（尖叫）', '它们在叫我们！'], ['苏晚', '跑！']] },
  ]);
  g.objective('逃！冲向通风井');
  for (const m of ['chase1', 'chase2']) g.spawn('gu', m).awaken();
  for (let i = 0; i < 3; i++) g.spawn('gu', 'hub', { ox: i - 1 }).awaken();
  await g.reachExit();

  await g.cine([
    { img: 'f05', kb: 'in', chars: [{ id: 'lin', side: 'right' }], lines: [
      ['', '苏晚与小满冲出地面，迎面撞上一个人影——林骁。'], ['林骁（扶住她）', '你没事。'],
      ['苏晚（盯着他，片刻后抱住他，又迅速松开）', '你……来得真慢。'], ['林骁（难得一笑）', '我绕了点路。'],
      ['小满', '奶奶……'], ['林骁（蹲下，轻声）', '她让我告诉你，铃声不是赶它们走的，是……叫它们回家的。'], ['', '小满点头，眼泪滚落。'],
    ] },
    { img: 'f02', kb: 'in', chars: [{ id: 'xu', side: 'center' }], lines: [
      ['', '远处传来直升机的轰鸣。三架黑色直升机降下，一队特勤队员迅速包围。为首之人，正是许怀远。'],
      ['许怀远（温和）', '林骁。苏晚。你们受苦了。'], ['', '他的目光落在苏晚怀里的血清上。'], ['许怀远', '东西，交给我吧。'],
    ] },
  ]);
  const pick = await g.mg.choice('许怀远伸手索要血清', ['A. 把血清交给许怀远', 'B. 拒绝']);
  g.choices.ch5 = pick;
  await g.cine([{ img: 'f02', kb: 'out', lines: [
    pick === 0 ? ['', '苏晚迟疑着递出血清。许怀远接过，微微一笑。'] : ['', '苏晚后退半步，林骁挡在她身前。特勤队员的枪口微微抬起。'],
    ['许怀远（叹气）', '好吧。我们先回重庆。你们需要休息。'], ['', '小满的铜铃，在他靠近的那一刻，发出刺耳的颤音。'],
  ], sfx: 'bell' }, { caption: '第五章　七二一的亡灵<br><small>— 完 —</small>', dur: 3 }]);
}
