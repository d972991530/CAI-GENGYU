import type { Game } from '../game/game';
import { audio } from '../core/audio';

// 联动支线《丹字档案》第二幕 船舱·逆流（唐武男 · 1971 长江夔门江段）
export async function side2(g: Game) {
  g.setLoadout(['pistol', 'mg', 'cryo'], { ammo: 40, mg_ammo: 10 });
  g.switchWeapon('pistol');
  g.hp = 100;
  g.armor = 0;
  g.herbs = 1;
  g.scanUnlocked = false;

  await g.cine([
    { title: ['联动支线 · 丹字档案', '第二幕　船舱 · 逆流'], dur: 3, sfx: 'stinger' },
    { caption: '三天后　深夜<br><small>长江 · 夔门江段</small>', dur: 3 },
    { img: 'tex:m_ch4', kb: 'in', tint: 'rgba(20,30,50,0.5)', lines: [
      ['', '“江安号”在峡谷里慢慢地爬。两岸峭壁黑得像墨，只有船头一盏探灯晃来晃去。'],
      ['唐武男', '三天了，能面众一个都没露面。'],
      ['', '货舱方向突然传来一声闷响。接着是惨叫——不像人的惨叫。'],
    ] },
  ]);
  g.objective('穿过客舱，查看货舱的动静');
  g.hint('<b>丹奴</b>打身体只有一半伤害，倒地后还会爬起来<br><b>爆头</b>、用 <b>赤霄</b> 斩倒地的丹奴，或用火烧，才能让它彻底不动',
    '<b>丹奴</b>倒地后还会爬起来<br><b>爆头</b>、用 <b>赤霄</b> 斩倒地的，或用火烧，才能彻底解决', 11);

  // ---------- 客舱 ----------
  await g.until(() => g.inRect(8, 1, 19, 9));
  g.saveCheckpoint();
  audio.setAmbientLevel(0.75);
  g.spawn('dannu', 'c1', { state: 'dormant' });
  g.spawn('dannu', 'c2');
  (async () => {
    await g.until(() => g.inRect(15, 4, 19, 6));
    g.jumpscare('water_gu', 0);
    g.spawn('dannu', 'c3').awaken();
  })();
  await g.say('', '（客舱门后，有人在小声地摇铃——三长，两短。）', 3);
  g.objective('找到摇铃的人');

  await g.interact('girl', 'girl', '敲门：“别怕，我不是他们的人”');
  await g.cine([
    { img: 'tex:m_ch7', kb: 'in', tint: 'rgba(60,30,10,0.4)', chars: [{ id: 'tang', side: 'left' }], lines: [
      ['', '门后是一个十七八岁的姑娘，背着一只傩戏班的戏箱，手里攥着一只铜铃。'],
      ['傩戏班姑娘', '你……你脸上画的是什么？'],
      ['唐武男', '脸谱。跟你戏箱里的面具差不多。外面那些东西，你见过？'],
      ['傩戏班姑娘', '没见过，但听我师父讲过。三十年前丰都闹过“走尸”，是日本人从山里挖出来的。'],
      ['傩戏班姑娘', '师父说，那东西怕铜声。铃一响，它们就站住了。'],
      ['', '她把铃塞进唐武男手里。'],
      ['傩戏班姑娘', '我们班子回丰都唱戏，就是要去封那个洞。师父没上船……他在码头被人带走了。'],
      ['唐武男', '铃我先借着。你锁好门，到丰都之前别出来。'],
    ] },
  ]);
  g.bellUnlocked = true;
  g.bellOwn = true;
  g.hint('获得 <b>镇魂铜铃</b>：按 <b>Q</b> 摇铃，6 米内的丹奴僵直 2.5 秒（冷却 12 秒）<br>对能面众无效', '获得 <b>镇魂铜铃</b>：点 <b>铜铃</b>，附近的丹奴僵直（对人无效）', 9);
  g.setFlag('bell');
  g.objective('进入货舱');

  // ---------- 货舱 ----------
  await g.until(() => g.inRect(21, 1, 31, 9));
  g.saveCheckpoint();
  const crate = g.prop('coffin', 'crate', 1.6, 0, 0x220000);
  await g.cine([
    { img: 'f24', kb: 'in', tint: 'rgba(60,20,10,0.45)', lines: [
      ['', '货舱中央，那口真正的“丹-7”铜皮箱已经裂开，红色的菌丝顺着箱缝爬满了甲板。'],
      ['', '三个押运员倒在旁边。他们的能面掉在地上，脸已经不是人的脸了。'],
      ['唐武男', '……原来你们自己也镇不住它。'],
    ] },
  ]);
  const wave = ['n1', 'n2', 'n3', 'n4'].map((m) => g.spawn('dannu', m));
  for (const e of wave) e.awaken();
  g.hint('货舱里挂着 <b>煤油灯</b>：靠近按 <b>E</b> 砸碎，火能烧尽附近的丹奴', '货舱里挂着 <b>煤油灯</b>：靠近点 <b>互动</b> 砸碎，火能烧尽附近的丹奴', 9);
  for (const m of ['lamp1', 'lamp2', 'lamp3']) {
    g.addInteract(m, m, '砸碎煤油灯', () => {
      g.removeInteract(m);
      const p = g.at(m);
      g.fireBurst(p.x, p.z, 4.5);
      g.hud.message('煤油泼开，火舌卷过甲板！');
    }, undefined, 0, 0);
  }
  // 只统计货舱里的丹奴（客舱里还在沉睡的不算）
  const left = () => wave.filter((e) => e.alive || e.downed).length;
  let second = false;
  while (left() > 0 || !second) {
    g.objective(`清理货舱里的丹奴（剩余 ${left()}）`);
    if (!second && left() <= 1) {
      second = true;
      g.shakeCamera(0.5);
      audio.roar(g.at('crate'));
      await g.say('', '裂开的箱子里，又爬出来三个。', 2);
      for (const ox of [-1, 0, 1]) {
        const e = g.spawn('dannu', 'crate', { ox, oz: 1.2 });
        e.awaken();
        wave.push(e);
      }
    }
    await g.wait(0.5);
  }
  g.removeProp(crate);
  g.setFlag('hold');
  g.objective('去船长室，查清这条船要开去哪里');

  // ---------- 船长室 ----------
  await g.until(() => g.inRect(33, 1, 38, 9));
  g.saveCheckpoint();
  g.spawn('noh_gun', 'cap').awaken();
  g.spawn('noh_blade', 'bridge', { ox: 2 }).awaken();
  await g.say('能面众（日语口音）', '二代无常……你不该上这条船。');
  await g.until(() => !g.enemies.some((e) => e.alive && e.kind.human));
  await g.interact('doc2', 'doc2', '翻看船长桌上的日志', undefined, 0, 0.6);
  await g.hud.showDocument('档案② · 丹字班试验日志（残页，大半被涂黑）',
    `<p class="dim">昭和十六年（1941）　丰都　名山脚下　盐仓</p>
     <p>崖墓中取出朱砂样菌。三十七度下自主增殖。</p>
     <p>■■■■■■■■■■■■■■■■■■■■■■■</p>
     <p>受试者称“听见歌声”。<b class="red">铜器敲击可使菌丝暂时休眠。</b></p>
     <p>当地傩戏班夜夜在山下摇铃唱戏，■■■■■■■■，屡禁不止。</p>
     <p>编号“丹奴”者，伤其躯干不死，断其首方止。</p>
     <p class="dim">——日志最后一页夹着一张船票：江安号，终点 <b>丰都</b>。</p>`);
  await g.say('唐武男', '他们在一九四一年就知道铃声能镇住它……还是继续往人身上试。');
  g.objective('船靠丰都了——从舷梯下船');
  audio.radio();
  await g.say('', '——汽笛长鸣，江轮缓缓靠岸。', 2);
  await g.reachExit();

  await g.cine([
    { img: 's3_2', kb: 'in', tint: 'rgba(40,40,30,0.45)', lines: [
      ['', '黎明。丰都，名山脚下。江雾里能看见半座被炸塌的山崖，崖下是一片早已荒废的盐仓。'],
      ['唐武男', '三十年了……还有人记得这里吗？'],
    ] },
    { caption: '第二幕　船舱 · 逆流<br><small>— 完 —</small>', dur: 3 },
  ]);
}
