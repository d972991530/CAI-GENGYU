import * as THREE from 'three';
import type { Game } from '../game/game';
import { audio } from '../core/audio';
import { imageTexture } from '../core/assets';
import { CELL } from '../world/map';

// 第六章 山城沦陷（老周线 → 陈砚线 → 汇合）
export async function ch6(g: Game) {
  const choseA = g.choices.ch4 === 0;
  g.setLoadout(['mg', 'pistol'], { ammo: 24, mg_ammo: 180 });
  g.hp = 100;
  g.armor = 50;
  g.herbs = 2;
  g.npc('chen', 'chen');

  await g.cine([
    { title: ['第六章', '山城沦陷'], dur: 3, sfx: 'stinger' },
    { caption: '数小时后<br><small>重庆</small>', dur: 3 },
    { img: 'tex:m_ch6', kb: 'in', chars: [{ id: 'xu', side: 'right' }], lines: [
      ['', '直升机降落在 NBER 重庆前线指挥部。山城的夜色刚刚亮起，洪崖洞的灯火倒映江面。'],
      choseA ? ['许怀远', '我早就说过，你不该单独行动。'] : ['许怀远', '你关掉定位，是对我不信任？'],
      ['林骁', '不是。只是习惯。'], ['许怀远（微笑）', '好习惯。'],
      ['技术员（惊慌）', '长官！嘉陵江水质监测异常！江北、渝中多个社区上报群体高烧！'],
      ['苏晚（冷声）', '他们放了蛊。'], ['林骁（看向许怀远）', '你早知道。'], ['', '许怀远没有回答。会议室的门从外面锁死。'],
    ] },
    { img: 'tex:m_ch6', kb: 'left', chars: [{ id: 'zhou', side: 'left' }, { id: 'chen', side: 'right' }], lines: [
      ['', '与此同时，李子坝轻轨站。老周刚抵达重庆，与失散的陈砚会合。'], ['老周（大笑）', '来啊！老子等这天等多少年了！'],
    ] },
  ]);

  // ---------- 李子坝轻轨站：定点据守 ----------
  g.objective('据守站台 90 秒');
  g.hint('重机枪压制蛊群；站台中央的 <b>通电闸</b> 可让轨道放电（冷却 20 秒）', '重机枪压制蛊群；点站台中央的 <b>通电闸</b> 让轨道放电', 9);
  const tracks: [number, number][] = [];
  for (let c = 1; c <= 22; c++) for (const r of [4, 5, 6]) tracks.push([c, r]);
  let leverReady = true;
  const lever = () => g.addInteract('rail', 'platform', '通电闸（轨道放电 8 秒）', async () => {
    if (!leverReady) return;
    leverReady = false;
    g.removeInteract('rail');
    g.electrify(tracks, 8);
    await g.say('陈砚（喊）', '老周！轨道通电了！引它们去铁轨！');
    await g.wait(20);
    leverReady = true;
    lever();
  });
  lever();
  const end = g.time + 90;
  const sp = ['sp1', 'sp2', 'sp3', 'sp4', 'sp5', 'sp6'];
  (async () => {
    let i = 0;
    while (g.time < end && g.chapter?.id === 6) {
      g.spawn(i % 5 === 4 ? 'ore' : 'gu', sp[i % sp.length]).awaken();
      if (i % 7 === 6) g.spawn('guest', sp[(i + 2) % sp.length]).awaken();
      i++;
      await g.wait(i < 10 ? 4 : 2.6);
    }
  })();
  while (g.time < end) {
    g.objective(`据守站台（剩余 ${Math.ceil(end - g.time)} 秒）`);
    await g.wait(1);
  }
  // 列车穿楼而过
  g.objective('列车来了——离开轨道！');
  await g.say('陈砚（喊）', '列车！一整列载满蛊化者的列车从楼里冲出来了！快离开轨道！', 3);
  audio.impact();
  const train = new THREE.Mesh(new THREE.BoxGeometry(18, 3.2, 8),
    new THREE.MeshStandardMaterial({ map: imageTexture('tex:m_ch6') ?? undefined, emissive: 0x401008, emissiveMap: imageTexture('tex:m_ch6') ?? undefined }));
  train.position.set(-12, 1.6, 5.5 * CELL - 1.5);
  g.addObject(train);
  const light = new THREE.PointLight(0xffe0a0, 40, 30);
  train.add(light);
  light.position.set(10, 0, 0);
  const t0 = g.time;
  await g.until(() => {
    const t = g.time - t0;
    train.position.x = -12 + t * 26;
    g.shakeCamera(0.3);
    for (const e of g.enemies) if (e.alive && Math.abs(e.pos.z - train.position.z) < 4.5 && Math.abs(e.pos.x - train.position.x) < 9) e.damage(9999, 'body');
    if (Math.abs(g.playerPos.z - train.position.z) < 4 && Math.abs(g.playerPos.x - train.position.x) < 9) g.damagePlayer(45, train.position);
    return train.position.x > 23 * CELL + 12;
  });
  g.removeObject(train);
  audio.explosion();
  await g.cine([{ img: 'tex:m_ch6', kb: 'in', sfx: 'explosion', shake: true, lines: [['', '列车疾驰而至，撞上蛊群。车身在电弧中炸成火球。']] }]);
  for (const e of g.enemies) if (e.alive) e.damage(9999, 'body');
  g.setFlag('defense');
  g.saveCheckpoint();

  // ---------- 地铁控制中心：黑客 ----------
  g.objective('进入地铁控制中心，调出指挥部日志');
  g.spawn('gu', 'metro1', { state: 'dormant' });
  g.spawn('guest', 'metro2');
  await g.interact('host', 'host', '连接主机');
  while (!(await g.mg.hack('路径解锁', 5, 40))) g.hud.message('连接中断，重试……');
  await g.hud.showDocument('NBER 指挥部 · 三小时前的命令记录',
    '<p>授权人：<b class="red">许怀远</b></p><p>指令：对重庆江北、渝中区域生物防护带实施撤离。放行。</p>');
  await g.say('陈砚（喃喃）', '不对……这是……');
  await g.say('陈砚（声音发抖）', '他撤走了防护。三小时前就撤了。');
  g.setFlag('log');
  g.saveCheckpoint();

  // ---------- 渝中街道 → 索道站 ----------
  g.objective('穿过沦陷的渝中街道，赶往长江索道站');
  for (const m of ['st1', 'st2', 'st3', 'st4', 'st5']) g.spawn(Math.random() < 0.3 ? 'cultist' : 'gu', m);
  await g.until(() => g.inRect(24, 7, 34, 25));
  g.jumpscare('infected', 6);
  await g.until(() => g.near('cable', 6) || g.inRect(1, 19, 10, 25));
  await g.cine([
    { img: 'f02', kb: 'in', chars: [{ id: 'xu', side: 'right' }, { id: 'lin', side: 'left' }], lines: [
      ['', '林骁与苏晚在索道站追上许怀远。'], ['林骁（举枪）', '许局。这不是你。'],
      ['许怀远（转身，眼神疲惫）', '阿骁，这是我。一直都是。'], ['林骁', '为什么？'],
      ['许怀远', '我女儿得了渐冻症。医生说她活不过三年。百慧给了我一个机会——蛊能让神经重生。'],
      ['苏晚（冷笑）', '那是被吞噬，不是重生。'], ['许怀远', '那也是活着。'],
    ] },
    { img: 'tex:m_ch6', kb: 'right', sfx: 'radio', lines: [
      ['许怀远（扩音器）', '告诉苏晚，她父亲留下的东西，是钟曼最想要的。'], ['苏晚', '你们一直在找他留下的血清。'],
      ['许怀远', '不。我们在找钥匙。'], ['', '缆车到达江心。许怀远跃上直升机，朝东方飞去。'],
      ['林骁（低声）', '他去的方向……'], ['苏晚（看着地图）', '白帝城。'],
    ] },
    { img: 'team', kb: 'in', lines: [
      ['', '缆车缓缓降落。地面上，老周与陈砚挥手。'], ['老周（嚼着槟榔）', '迟了十分钟。我还以为你们去游览夜景了。'],
      ['林骁（苦笑）', '集合。'], ['苏晚（举起血清）', '这是我爸留下的钥匙。'], ['小满（抱紧铜铃）', '还有这个。'], ['林骁（望向东方的夜空）', '去白帝城。'],
    ] },
  ]);
  g.objective('到索道站集合');
  await g.reachExit();
  await g.cine([{ caption: '第六章　山城沦陷<br><small>— 完 —</small>', dur: 3 }]);
}
