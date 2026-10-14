import type { Game } from '../game/game';
import { audio } from '../core/audio';

// 第四章 巫山·雾锁（林骁单人，弹药稀缺、浓雾）
export async function ch4(g: Game) {
  g.setLoadout(['pistol'], { ammo: 18 });
  g.hp = 85;
  g.armor = 0;
  g.herbs = 1;

  await g.cine([
    { title: ['第四章', '巫山 · 雾锁'], dur: 3, sfx: 'stinger' },
    { img: 's3_2', kb: 'in', lines: [['', '林骁独自在巫山江滩苏醒。山路旁散落着老旧的纸钱，树上挂着一张张褪色的傩面。'], ['林骁（自语）', '这是……傩戏？']], sfx: 'whisper' },
  ]);
  g.objective('循着铜铃声，找到雾中的村落');
  // 联动彩蛋（× 侠客行1971）：江滩崖壁上的能面，只有勘察镜能发现
  const egg = g.prop('noh_mask', 'nohEgg', 0.85, 1.35, 0x2a2622);
  egg.position.z -= 1.35;
  egg.visible = false;
  g.onScan = () => {
    if (egg.visible || !g.near('nohEgg', 16)) return;
    egg.visible = true;
    g.hud.message('勘察镜：崖壁上嵌着一张白色的面具……');
    g.addInteract('nohEgg', 'nohEgg', '查看崖壁上的面具', async () => {
      g.removeInteract('nohEgg');
      await g.hud.showDocument('现场报告（残页）· 一九七一年十月',
        `<p class="dim">面具背面用油纸包着一页手写报告，字迹被江水泡得发胀。</p>
         <p>长江巫山段。能面众的江轮在这里停过一夜，上岸的人在崖壁上嵌了这张面具——是记号，给“下一批人”指路。</p>
         <p>丰都名山的洞，我已经封了。丹字班留下的九株样本，八株烧在罐里，一株烧在棺里。</p>
         <p>可交接清单上的“<b class="red">丹-7</b>”，少了一支。</p>
         <p>如果有人再看见这张面具，说明他们回来了。</p>
         <p style="text-align:right">——红黑脸谱的那个人</p>`);
      await g.say('林骁（自语）', '一九七一年……丹-7？CG-7……');
    }, undefined, 0, -0.8);
  };
  (async () => {
    await g.until(() => g.near('nohEgg', 7) || g.inRect(1, 7, 34, 17));
    if (!egg.visible && g.near('nohEgg', 7)) g.hud.message('崖壁那边，好像有什么东西在雾里反光……');
  })();
  g.hint('本章弹药稀缺：多用 <b>手电强光</b> 和潜行，避免无谓战斗', '本章弹药稀缺：多用 <b>强光</b>，避免无谓战斗', 8);
  // 铜铃声指引方向
  (async () => {
    while (g.chapter?.id === 4 && !g.near('apo', 5) && !g.inRect(1, 7, 34, 17)) {
      audio.bell(g.at('apo', 1), 0.35);
      await g.wait(4);
    }
  })();
  const apo = g.npc('apo', 'apo');
  await g.until(() => g.near('apo', 5) || g.inRect(1, 7, 34, 17));
  g.saveCheckpoint();
  await g.cine([{ img: 's3_2', kb: 'out', chars: [{ id: 'apo', side: 'right' }], lines: [
    ['', '村口立着一座青苔斑驳的牌楼。牌楼下，一个佝偻的老妇人背对着他，手里摇着铜铃。'],
    ['阿婆（不回头）', '穿官衣的人，又来了。'], ['林骁（举枪）', '您是？'], ['阿婆', '杨家的老婆子。小满是我孙女。'],
    ['林骁（缓缓放下枪）', '她还活着。我们在船上遇到她。'], ['阿婆（轻轻点头）', '我听见了铃响。'],
    ['阿婆', '傩祠的大门被九张傩面封着。村里少了三张——祠堂后院、水井边、还有屋顶上。'],
  ] }]);
  g.objective('收集三张缺失的傩面（0/3）');
  let masks = 0;
  const lines = ['后院的“驱邪”面，獠牙外翻。', '水井边的“纳吉”面，嘴角含笑。', '屋顶上的“请神”面，额头一道朱砂。'];
  ['mask1', 'mask2', 'mask3'].forEach((m, i) => g.addInteract(m, m, '拾取傩面', async () => {
    g.removeInteract(m);
    masks++;
    g.objective(`收集三张缺失的傩面（${masks}/3）`);
    g.hud.message(lines[i]);
    if (masks === 2) { await g.wait(0.5); g.jumpscare('scare_nuo', 5); }
  }, 'mask'));
  // 雾中游荡的傩面者：平时不攻击，打掉面具就会暴走
  for (const m of ['nuo1', 'nuo2', 'nuo3', 'nuo4']) g.spawn('nuo', m);
  g.hint('戴傩面的村民平时不会攻击——<b>别打他们</b>，一旦受伤就会暴走', '傩面者平时不攻击——别打他们，受伤就会暴走', 8);
  await g.until(() => masks >= 3);

  g.objective('回到傩祠，按《开坛歌》的顺序放上傩面');
  await g.interact('wall', 'wall', '查看傩面壁雕', undefined, 0, 0);
  const order = ['开坛', '请神', '驱邪', '纳吉', '送神'];
  const all = ['开坛', '镇宅', '请神', '判官', '驱邪', '土地', '纳吉', '戏童', '送神'];
  while (!(await g.mg.masks('傩面机关', all, order, '阿婆唱的《开坛歌》：“先开坛，后请神，驱邪纳吉送神归。”'))) { /* 失败重来 */ }
  g.setFlag('masks');
  await g.until(() => g.inRect(13, 9, 21, 12));
  g.saveCheckpoint();
  apo.pos.copy(g.at('shrine'));
  await g.cine([{ img: 'tex:m_ch4', kb: 'in', chars: [{ id: 'apo', side: 'left' }], lines: [
    ['阿婆（坐在火塘边）', '两千多年前，楚国的巫祝在这座山里封下一个东西。他们叫它——“蛊母”。'], ['林骁', '封？'],
    ['阿婆', '用朱砂、用铜、用歌。每年秋天，村里人戴上傩面唱“安山调”，就是为了让她继续睡下去。'],
    ['阿婆', '直到那些穿白大褂的人开着钻机进了山。'],
    ['阿婆', '……这种事，五十多年前也有过一回。那回是个戴红黑脸谱的后生，借了我的铃，替我们封了丰都的洞。'],
    ['', '阿婆取出一块锈铜，递给林骁。'], ['阿婆', '蛊群怕铜音。三长两短，可以让它们暂时停下。'],
    ['林骁', '为什么帮我？'], ['阿婆', '不是帮你。是帮她们。小满，还有你嘴里那个苏家的姑娘。'],
    ['林骁（一怔）', '你认识苏晚？'], ['阿婆', '我认识她爸爸。苏明远，十年前在这里住过半年。'],
  ] }]);
  g.zhenyinUnlocked = true;
  g.hint('获得技能 <b>镇音</b>：按 <b>Z</b> 敲击铜片（三长两短），附近蛊群静止 4 秒', '获得技能 <b>镇音</b>：点 <b>镇音</b> 让附近蛊群静止', 8);
  g.objective('穿过傩面者，前往后山悬崖');
  for (const m of ['nuo5', 'nuo6']) g.spawn('nuo', m);
  await g.wait(2);
  for (const e of g.enemies) if (e.kind.name === '傩面者' && e.alive) e.awaken();
  await g.cine([{ img: 's3_2', kb: 'in', dur: 2.6, sfx: 'stinger', lines: [['', '浓雾中，戴着傩面的村民缓缓走出，动作整齐如祭祀。一个傩面者面具滑落，露出布满朱砂脉络的脸。'], ['林骁（低语）', '别动……别动……']] }]);
  g.setFlag('nuo');

  // ---------- 后山悬崖 · 山魈 ----------
  await g.until(() => g.inRect(2, 19, 9, 23));
  g.saveCheckpoint();
  apo.pos.copy(g.at('apoCliff'));
  const boss = g.spawn('mandrill', 'mandrill');
  boss.awakeRadius = 0;
  await g.cine([{ img: 's3_2', kb: 'up', chars: [{ id: 'mandrill', side: 'center' }], sfx: 'roar', shake: true, lines: [['', '黄昏。崖壁上，一个巨大的身影投下阴影——山魈。']] }]);
  boss.awaken();
  g.boss = boss;
  g.objective('击败山魈');
  g.addPickup('ammo', 3, 21, 20);
  g.addPickup('herb', 2, 19, 40);
  g.sayAsync([['阿婆（远处喊）', '打它的脚踝！它的根扎在脚上！']]);
  g.hint('山魈的弱点在 <b>脚踝</b>；它冲上吊桥时注意闪避（<b>空格</b>）', '山魈的弱点在 <b>脚踝</b>；冲过来时点 <b>闪避</b>', 8);
  let stage = 1;
  boss.onDamaged = (e) => {
    if (stage === 1 && e.hp < e.maxHp * 0.6) { stage = 2; g.say('林骁', '它要上吊桥了！'); }
    if (stage === 2 && e.hp < e.maxHp * 0.25) {
      stage = 3;
      (async () => {
        await g.say('阿婆（远处喊）', '三长两短！别停！');
        audio.bellRing(g.at('apoCliff', 1));
        e.stun(6);
        e.vulnerable = true;
        await g.say('林骁（咬牙，敲击铜片）', '看着我！');
      })();
    }
  };
  (async () => {
    while (boss.alive) {
      await g.wait(2.5);
      if (stage >= 2 && g.inRect(10, 20, 25, 22)) g.shakeCamera(0.35); // 吊桥摇晃
    }
  })();
  await g.until(() => !boss.alive);
  g.boss = null;
  g.hud.setBoss(null);
  await g.cine([
    { img: 's3_2', kb: 'out', chars: [{ id: 'apo', side: 'left' }], lines: [['', '山魈坠入深渊。阿婆倒在地上，胸口渗出红色。']] },
    { img: 'tex:m_ch4', kb: 'in', chars: [{ id: 'apo', side: 'center' }], dark: true, lines: [
      ['阿婆', '我活不过今晚了。你替我……带句话给小满。'], ['林骁', '你说。'],
      ['阿婆', '铃声不是赶它们走的。是……叫它们回家的。'], ['林骁（迟疑）', '什么意思？'],
      ['阿婆（闭上眼）', '穿官衣的……蛇，别信。'], ['', '阿婆断气。林骁沉默，轻轻为她合上双眼。'],
    ] },
    { img: 's3_2', kb: 'in', sfx: 'radio', lines: [
      ['许怀远（耳麦，温和）', '林骁？我是许局。你还活着，太好了。'], ['林骁', '许局，云梦号出事了，百慧——'],
      ['许怀远', '我已经知道了。把你的位置发给我，直升机马上过去。'], ['', '林骁握着耳麦，脑海里闪过阿婆的话：“穿官衣的蛇，别信。”'],
    ] },
  ]);
  g.removeNpc('apo');
  const pick = await g.mg.choice('许怀远要你的坐标', ['A. 报出坐标', 'B. 拒绝，并关闭定位']);
  g.choices.ch4 = pick;
  await g.say('林骁', pick === 0 ? '……我在巫山傩村后山。' : '信号不好，许局。我自己想办法。');
  await g.cine([{ img: 's3_2', kb: 'up', lines: [['', '不论选择，远处山腰突然亮起一道微弱的光——是苏晚的紧急信标，位置：七二一厂。'], ['林骁（望向山中）', '等我。']] }]);
  g.objective('前往悬崖尽头的山路');
  await g.reachExit();
  await g.cine([{ caption: '第四章　巫山 · 雾锁<br><small>— 完 —</small>', dur: 3 }]);
}
