import type { Game } from '../game/game';
import { audio } from '../core/audio';

// 联动支线《丹字档案》第一幕 外滩·十六铺夜运（唐武男 · 1971 上海）
// 角色与美术来自《侠客行1971》；丹字班、能面众的这段经历为联动改编，不改写原作正史
export async function side1(g: Game) {
  g.setLoadout(['pistol', 'cryo'], { ammo: 48 });
  g.switchWeapon('pistol');
  g.hp = 100;
  g.armor = 0;
  g.herbs = 1;
  g.scanUnlocked = false;

  // 弄堂里的哨
  g.spawn('noh_gun', 'a1');
  g.spawn('noh_blade', 'a2');
  g.spawn('noh_gun', 'a3', { state: 'dormant' });

  await g.cine([
    { title: ['联动支线 · 丹字档案', '第一幕　外滩 · 十六铺夜运'], dur: 3.2, sfx: 'stinger' },
    { caption: '《侠客行1971》 × 《蛊变：长江启示录》<br><small>联动改编故事 · 丹字班、能面众及其经历均为虚构</small>', dur: 3.6 },
    { img: 'xkx_title', kb: 'in', lines: [
      ['', '1971 年，上海。秋雨下了整整一夜，外滩的钟楼在雾里只剩一团昏黄。'],
      ['', '十六铺的老货仓里，一伙戴白色能面的人，正把一口贴着封条的铜皮木箱抬上开往上游的江轮。'],
    ] },
    { img: 'xkx_hero', kb: 'in', lines: [
      ['唐武男', '能面众……这群人不碰鸦片，也不碰军火。'],
      ['唐武男', '他们只运一样东西——三十年前就该烂在地里的东西。'],
    ] },
    { img: 'xkx_full', kb: 'out', sfx: 'bell', lines: [['', '红黑金白的脸谱扣上。二代无常，夜行。']] },
  ]);
  g.objective('穿过同兴里弄堂，潜入十六铺货仓');
  g.hint('本支线操作 <b>唐武男</b>：<b>1</b> 二代双枪　<b>3</b> 赤霄（近战，不耗弹）<br>能面众是活人——<b>爆头</b>最快；仓库里能缴获霰弹枪（<b>2</b>）',
    '本支线操作 <b>唐武男</b>：点 <b>换枪</b> 切换双枪 / 赤霄（近战不耗弹）<br>仓库里能缴获霰弹枪', 10);

  // ---------- 货仓 ----------
  await g.until(() => g.inRect(10, 6, 26, 15));
  g.saveCheckpoint();
  audio.setAmbientLevel(0.7);
  g.spawn('noh_gun', 'w1');
  g.spawn('noh_blade', 'w2');
  g.spawn('noh_gun', 'w3');
  g.spawn('noh_blade', 'w4', { state: 'dormant' });
  g.spawn('noh_gun', 'w5');
  const crate = g.prop('coffin_hang', 'crate', 1.5, 0, 0x110000);
  await g.say('唐武男（低声）', '箱子还在。船还没开。');
  g.objective('查看那口铜皮木箱');

  // 被捆的码头工人（可选救援）
  let rescued = 0;
  const hostage = (id: string, mark: string, line: string) => {
    g.npc(id, mark);
    g.addInteract(id, mark, '解开绳索', () => {
      g.removeInteract(id);
      g.removeNpc(id);
      rescued++;
      audio.pickup();
      g.hud.message(`救出码头工人（${rescued}/2）`);
      g.say('码头工人', line);
    });
  };
  hostage('civ1', 'h1', '谢谢侬……那帮人讲日本话，还讲“丰都”，船要开到四川去！');
  hostage('civ2', 'h2', '箱子是空的！真货下午就上船了，他们留这口箱子钓人！');

  await g.interact('crate', 'crate', '撬开铜皮木箱');
  audio.impact();
  await g.cine([
    { img: 'f23', kb: 'in', tint: 'rgba(60,30,10,0.45)', lines: [
      ['', '箱盖撬开——里面是空的。只剩一层发黑的稻草，和一股说不清的铁锈味。'],
      ['', '箱壁内侧烙着一行褪色的字：「丹-7　昭和十五年　防疫给水部」。'],
      ['唐武男', '昭和十五年……一九四〇。'],
      ['唐武男', '真货已经上船了。这口箱子，是给追来的人准备的。'],
    ] },
  ]);
  g.removeProp(crate);
  g.objective('到账房找出货单，拿码头铁门的钥匙');
  // 伏兵
  g.spawn('noh_blade', 'w2', { ox: 1 });
  g.spawn('noh_blade', 'w4', { ox: -1 }).awaken();

  await g.interact('doc1', 'doc1', '翻看账房里的文件', undefined, 0, 0.6);
  g.spawn('noh_gun', 'o1');
  await g.hud.showDocument('档案① · 丹字班派遣令（抄件）',
    `<p class="dim">关东军防疫给水部（731）本部　昭和十五年（1940）</p>
     <p>着即编成「<b class="red">丹字班</b>」，以汉口某药行之名义，自宜昌溯江而上，收购朱砂、丹参。</p>
     <p>目标：川东传说中「能令死者行走之朱砂」。到达地点：<b>丰都</b>。</p>
     <p>分队长：代号「丹一号」。本令阅后焚毁。</p>
     <p class="dim">——页边有一行新写的钢笔字：<b>“丹-7，1971 年秋，原路送回。能面。”</b></p>`);
  await g.say('唐武男', '原路送回……他们要把这东西送回丰都。');
  g.objective('拿上钥匙，打开码头铁门');

  // ---------- 码头 ----------
  await g.until(() => g.inRect(28, 1, 33, 15));
  g.saveCheckpoint();
  audio.setAmbientLevel(0.55);
  g.spawn('noh_gun', 'd1');
  g.spawn('noh_gun', 'd2');
  g.spawn('noh_blade', 'd3');
  g.spawn('noh_blade', 'd4');
  audio.radio();
  await g.say('', '——江轮拉响了汽笛。', 2);
  g.objective('在“江安号”开船前登船');
  g.hint('码头尽头的跳板就是登船口', '码头尽头的跳板就是登船口', 5);
  await g.reachExit();

  await g.cine([
    { img: 'f01', kb: 'in', tint: 'rgba(40,20,10,0.5)', sfx: 'explosion', lines: [
      ['', '跳板被收起的前一秒，唐武男纵身跃上船尾。'],
      ['', '“江安号”客货轮驶离十六铺，逆流而上。'],
      ...(rescued === 2 ? [['', '岸上，两个被救下的码头工人目送着江轮消失在雨里。']] as [string, string][] : []),
    ] },
    { caption: '第一幕　外滩 · 十六铺夜运<br><small>— 完 —</small>', dur: 3 },
  ]);
}
