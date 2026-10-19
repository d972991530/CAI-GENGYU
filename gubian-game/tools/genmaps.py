"""生成第 2–8 章地图数据（输出 src/chapters/data/chN.ts）。房间/门/物品用坐标描述，避免手写地图出错。"""
import json, os, random
random.seed(7)
OUT = os.path.join(os.path.dirname(__file__), '../src/chapters/data')

class M:
    def __init__(s, W, H, fill='#'):
        s.W, s.H = W, H
        s.g = [[fill] * W for _ in range(H)]
    def rect(s, c0, r0, c1, r1, ch):
        for r in range(r0, r1 + 1):
            for c in range(c0, c1 + 1):
                s.g[r][c] = ch
    def put(s, c, r, ch):
        s.g[r][c] = ch
    def scatter(s, c0, r0, c1, r1, ch, n, on=','):
        k = 0
        while k < n:
            c, r = random.randint(c0, c1), random.randint(r0, r1)
            if s.g[r][c] == on:
                s.g[r][c] = ch; k += 1
    def rows(s):
        return [''.join(r) for r in s.g]

def emit(name, d):
    rows = d['map']
    body = 'import type { ChapterData } from \'../types\';\n\n'
    body += f"// {d['comment']}\nexport const {name}: ChapterData = {{\n"
    for k in ['id', 'title', 'place', 'pov', 'mural', 'par']:
        body += f"  {k}: {json.dumps(d[k], ensure_ascii=False)},\n"
    body += '  map: [\n' + ''.join(f"    '{r}',\n" for r in rows) + '  ],\n'
    body += '  doors: ' + json.dumps(d['doors'], ensure_ascii=False) + ',\n'
    body += '  marks: ' + json.dumps(d['marks'], ensure_ascii=False) + ',\n'
    body += '  items: ' + json.dumps([{'type': t, 'at': a, **({'secret': True} if s else {})} for t, a, s in d['items']], ensure_ascii=False) + ',\n'
    body += '  lights: ' + json.dumps([{'at': a, 'color': c, 'intensity': i, 'flicker': f, **({'y': y} if y else {})} for a, c, i, f, y in d['lights']]) + ',\n'
    body += '  theme: ' + json.dumps(d['theme'], ensure_ascii=False) + ',\n'
    body += '  route: ' + json.dumps(d['route']) + ',\n};\n'
    open(os.path.join(OUT, f'{name}.ts'), 'w').write(body)
    print('wrote', name, len(rows[0]), 'x', len(rows))

def L(c, r, color, i=4, f=0.3, y=None):
    return ([c, r], color, i, f, y)

# ---------------- 第二章 回溯·七二一 ----------------
def ch2():
    m = M(36, 26)
    m.rect(1, 1, 34, 5, ',')                      # 山林
    m.scatter(1, 1, 34, 4, 't', 14)
    m.rect(17, 1, 17, 5, '=')                     # 铁轨进山
    m.rect(1, 6, 34, 6, '%'); m.put(17, 6, '1')   # 厂门
    m.rect(1, 7, 26, 13, '.')                     # 主厂房
    m.rect(17, 7, 17, 13, '=')
    for c, r, ch in [(4, 8, 'b'), (9, 9, 'c'), (4, 12, 'm'), (12, 12, 'b'), (22, 8, 'c'), (22, 12, 'b'), (8, 10, 'P'), (13, 10, 'P'), (21, 10, 'P')]:
        m.put(c, r, ch)
    m.rect(28, 7, 34, 11, '.'); m.put(27, 9, '2')  # 控制室
    m.put(31, 7, 'c'); m.put(33, 10, 'c')
    m.rect(28, 13, 34, 13, '.'); m.put(30, 12, '$')  # 暗室
    m.put(5, 14, '3')                             # 下层铁门
    m.rect(1, 15, 26, 19, '.')                    # 地下一层生化实验区
    for c in range(4, 26, 2):  # 培养舱放在偶数列，避开 5、13 列的门口
        m.put(c, 15, 'k'); m.put(c, 19, 'k')
    m.put(13, 20, '4')                            # 黄钥匙门（铜钥匙）
    m.rect(1, 21, 30, 24, '.')                    # 地下二层矿道
    m.rect(1, 22, 30, 23, '=')
    for c in (8, 19, 26): m.put(c, 21, 'm')
    m.put(31, 22, '5')
    m.rect(32, 21, 34, 24, '.')                   # 档案室
    m.put(34, 21, 'b')
    m.put(1, 24, 'X')
    m.put(2, 3, '@')
    return dict(comment='第二章 回溯·七二一 —— 三个月前，巫山深处的废弃军工厂', id=2, title='回溯·七二一', place='巫山深处 · 废弃地下军工厂（三个月前）',
        pov='zhou', mural='tex:m_ch2', par=900, map=m.rows(),
        doors=[{'id': '1', 'label': '七二一厂'}, {'id': '2'}, {'id': '3', 'flag': 'hack', 'trigger': 'terminal', 'label': '下层铁门'},
               {'id': '4', 'key': 'yellow', 'label': '铜锁铁门'}, {'id': '5'}],
        marks={'startYaw': [2, 0], 'chen': [3, 2], 'gate': [17, 7], 'guard1': [6, 9], 'guard2': [20, 11], 'guard3': [24, 8], 'guard4': [11, 12],
               'terminal': [32, 9], 'b1': [5, 16], 'log1': [6, 17], 'log2': [12, 16], 'log3': [18, 18], 'log4': [24, 17], 'tank': [11, 15],
               'b1gu1': [15, 17], 'b1gu2': [22, 16], 'b2': [13, 21], 'power': [2, 21], 'ore1': [20, 22], 'ore2': [27, 23], 'archive': [33, 22],
               'horde1': [28, 22], 'horde2': [29, 23], 'horde3': [25, 21], 'horde4': [24, 24], 'exit': [1, 24]},
        items=[('ammo', [3, 4], 0), ('mg_ammo', [30, 2], 0), ('herb', [2, 12], 0), ('ammo', [25, 7], 0), ('armor', [33, 8], 0),
               ('mg_ammo', [29, 13], 1), ('medkit', [33, 13], 1), ('herb', [2, 17], 0), ('ammo', [20, 17], 0), ('key_yellow', [25, 17], 0),
               ('mg_ammo', [5, 24], 0), ('medkit', [16, 21], 0), ('ammo', [33, 24], 0)],
        lights=[L(9, 3, 0xd8e0d0, 3, 0), L(17, 7, 0xfff0d0, 4, 0.2), L(8, 11, 0xffe0b0, 4, 0.6), L(22, 9, 0xffe0b0, 3, 0.3), L(31, 9, 0x60ff90, 4, 0.1),
                L(6, 17, 0xff3020, 4, 0.4), L(14, 17, 0xff3020, 4, 0.5), L(22, 17, 0xff3020, 4, 0.2), L(5, 22, 0xffc070, 3, 1), L(17, 23, 0xffc070, 3, 0.6),
                L(27, 22, 0xffc070, 3, 0.3), L(33, 22, 0xff2010, 4, 2)],
        theme={'wall': 'tex:factory_wall', 'wall2': 'p:stone', 'mural': 'tex:m_ch2', 'floor': 'p:concrete', 'floorOut': 'p:grass', 'ceiling': 'p:ceiling',
               'fog': 0x0b0f0c, 'fogDensity': 0.05, 'hemi': [0x8a9a8a, 0x2a2418, 0.7], 'sky': 'sky:village',
               'zones': [{'rect': [1, 1, 34, 5], 'wall': 'p:stone'}, {'rect': [1, 15, 26, 19], 'wall': 'p:metal', 'floor': 'tex:wet_tile'},
                         {'rect': [1, 21, 34, 24], 'wall': 'p:rust', 'floor': 'p:mud'}]},
        route=['gate', 'terminal', 'b1', 'log4', 'b2', 'power', 'archive', 'exit'])

# ---------------- 第三章 船舱深处 ----------------
def ch3():
    m = M(36, 27)
    m.rect(1, 1, 20, 3, '.')                      # 底层货运通道
    m.put(21, 2, '1'); m.rect(22, 1, 26, 4, '.')   # 安全屋（老周）
    m.put(26, 1, 'd'); m.put(24, 4, 'b')
    m.put(10, 4, '2')                             # 铁梯下行
    m.rect(1, 5, 26, 14, '.')                     # 轮机舱
    m.rect(1, 9, 26, 14, '~')                     # 下层被淹
    for c, r in [(6, 10), (7, 10), (15, 11), (16, 11), (21, 9)]: m.put(c, r, '.')  # 换气点
    for c, r in [(4, 6), (9, 7), (15, 6), (20, 7), (11, 12), (19, 13)]: m.put(c, r, 'p')
    m.put(27, 7, '$'); m.rect(28, 6, 30, 8, '.')   # 暗室
    m.put(13, 15, '3')                            # 货舱门
    m.rect(1, 16, 26, 25, '.')                    # 货舱
    for c, r in [(4, 18), (4, 23), (9, 20), (17, 20), (22, 18), (22, 23), (13, 24), (13, 17)]: m.put(c, r, 'b')
    m.rect(1, 16, 1, 25, '&')
    m.put(27, 20, '4')
    m.rect(28, 18, 34, 22, '.')                   # 货舱出口
    m.put(33, 20, 'X')
    m.put(2, 2, '@')
    return dict(comment='第三章 船舱深处 —— 云梦号底舱、水下', id=3, title='船舱深处', place='云梦号底舱 · 淹没的轮机舱与货舱',
        pov='lin', mural='tex:m_ch3', par=900, map=m.rows(),
        doors=[{'id': '1'}, {'id': '2'}, {'id': '3', 'flag': 'switch', 'trigger': 'switch', 'label': '货舱'}, {'id': '4', 'flag': 'bride', 'trigger': 'coffin', 'label': '货舱出口'}],
        marks={'startYaw': [-1, 0], 'su': [3, 1], 'man': [3, 3], 'zhou': [24, 2], 'engine': [10, 6], 'switch': [24, 13], 'air1': [6, 10], 'air2': [15, 11], 'air3': [21, 9],
               'wg1': [12, 11], 'wg2': [18, 12], 'wg3': [8, 13], 'wg4': [22, 11], 'hold': [13, 16], 'coffin': [13, 20], 'crane': [13, 21], 'screen': [2, 20],
               'bride': [13, 22], 'exitHall': [30, 20], 'exit': [33, 20]},
        items=[('ammo', [5, 2], 0), ('herb', [18, 1], 0), ('mg_ammo', [25, 3], 0), ('ammo', [23, 1], 0), ('medkit', [2, 6], 0), ('ammo', [24, 6], 0),
               ('armor', [29, 7], 1), ('ammo', [30, 6], 1), ('herb', [6, 10], 0), ('ammo', [3, 17], 0), ('herb', [25, 25], 0), ('ammo', [25, 16], 0), ('medkit', [3, 25], 0)],
        lights=[L(5, 2, 0xffd0a0, 3, 1), L(15, 2, 0xffd0a0, 3, 0.5), L(24, 2, 0xffe0a0, 4, 0.1), L(10, 6, 0xd0e8ff, 4, 0.8), L(20, 8, 0xd0e8ff, 3, 0.4),
                L(24, 13, 0x40ffa0, 4, 0.1, 1.0), L(13, 20, 0xff2a20, 6, 0.3, 3.0), L(5, 18, 0xff4020, 3, 0.6), L(22, 23, 0xff4020, 3, 0.4), L(31, 20, 0xffe0b0, 3, 0.5)],
        theme={'wall': 'tex:hold_wall', 'wall2': 'p:metal', 'mural': 'tex:m_ch3', 'floor': 'p:metal', 'floorOut': 'p:deck', 'ceiling': 'p:ceiling',
               'fog': 0x060a0c, 'fogDensity': 0.06, 'hemi': [0x40566a, 0x1a1010, 0.6],
               'zones': [{'rect': [1, 5, 26, 14], 'wall': 'p:rust'}, {'rect': [22, 1, 26, 4], 'wall': 'tex:wood_panel', 'floor': 'tex:carpet'}]},
        route=['engine', 'switch', 'hold', 'coffin', 'exitHall', 'exit'])

# ---------------- 第四章 巫山·雾锁 ----------------
def ch4():
    m = M(36, 26)
    m.rect(1, 1, 34, 24, ',')
    m.scatter(1, 1, 34, 4, 't', 12)
    m.rect(1, 5, 34, 5, ',')
    # 牌楼（村口）
    m.rect(1, 6, 34, 6, '#'); m.rect(15, 6, 19, 6, ','); m.put(14, 6, 'P'); m.put(20, 6, 'P')
    # 房屋
    for c, r in [(3, 8), (5, 8), (3, 11), (9, 9), (27, 8), (29, 8), (31, 11), (25, 14), (8, 15), (30, 15), (3, 15)]: m.put(c, r, 'h')
    m.scatter(1, 7, 34, 17, 't', 10)
    # 傩祠
    m.rect(12, 8, 22, 13, '#'); m.rect(13, 9, 21, 12, '.'); m.put(17, 13, '1'); m.put(17, 9, 'x')
    m.put(13, 9, 'P'); m.put(21, 9, 'P')
    m.rect(12, 8, 22, 8, '&')
    # 南墙与崖口
    m.rect(1, 18, 34, 18, '#'); m.put(6, 18, '2')
    # 悬崖与吊桥
    m.rect(1, 19, 34, 24, '#')
    m.rect(2, 19, 9, 23, ',')
    m.rect(10, 21, 25, 21, ','); m.rect(10, 20, 25, 20, 'R'); m.rect(10, 22, 25, 22, 'R')
    m.rect(26, 19, 34, 24, ',')
    m.scatter(27, 19, 33, 23, 't', 3)
    m.put(33, 23, 'X')
    m.put(2, 2, '@')
    for r in range(1, 6):
        pass
    return dict(comment='第四章 巫山·雾锁 —— 林骁独自在巫山傩村', id=4, title='巫山·雾锁', place='巫山江滩 · 千年傩村与后山悬崖',
        pov='lin', mural='tex:m_ch4', par=1000, map=m.rows(),
        doors=[{'id': '1', 'flag': 'masks', 'trigger': 'wall', 'label': '傩祠'}, {'id': '2', 'flag': 'nuo', 'trigger': 'shrine', 'label': '后山'}],
        marks={'startYaw': [2, 0], 'apo': [17, 7], 'wall': [17, 14], 'shrine': [17, 11], 'mask1': [33, 16], 'mask2': [2, 13], 'mask3': [31, 1],
               'nuo1': [10, 12], 'nuo2': [24, 11], 'nuo3': [7, 16], 'nuo4': [28, 16], 'nuo5': [16, 16], 'nuo6': [22, 15],
               'cliff': [5, 20], 'bridge': [17, 21], 'mandrill': [30, 21], 'apoCliff': [4, 22], 'exit': [33, 23], 'gate': [17, 5]},
        items=[('ammo', [5, 3], 0), ('herb', [26, 2], 0), ('ammo', [11, 10], 0), ('medkit', [33, 7], 0), ('ammo', [2, 17], 0), ('herb', [23, 17], 0),
               ('armor', [20, 10], 0), ('ammo', [3, 23], 0), ('herb', [9, 19], 0), ('ammo', [27, 19], 0)],
        lights=[L(17, 5, 0xffb060, 3, 0.3, 2.5), L(17, 10, 0xff8040, 5, 0.6, 2.0), L(5, 12, 0xffa050, 2, 0.5, 2.0), L(29, 12, 0xffa050, 2, 0.5, 2.0),
                L(6, 19, 0xff7040, 3, 0.3, 2.0), L(30, 21, 0xff5030, 4, 0.4, 2.5)],
        theme={'wall': 'p:stone', 'wall2': 'p:stone', 'mural': 'tex:m_ch4', 'floor': 'p:lattice', 'floorOut': 'p:mud', 'ceiling': 'p:lattice',
               'fog': 0x9aa3a8, 'fogDensity': 0.075, 'hemi': [0xa0aab0, 0x30302a, 0.75], 'sky': 'sky:village',
               'zones': [{'rect': [13, 9, 21, 12], 'wall': 'p:temple', 'floor': 'p:lattice'}]},
        route=['apo', 'mask1', 'mask2', 'mask3', 'wall', 'shrine', 'cliff', 'bridge', 'mandrill', 'exit'])

# ---------------- 第五章 七二一的亡灵 ----------------
def ch5():
    m = M(36, 29)
    m.rect(1, 1, 10, 4, ',')                      # 取水口
    m.put(11, 2, '1')
    m.rect(12, 1, 34, 4, '.')                     # 培养舱走廊
    for c in range(13, 34, 2): m.put(c, 1, 'k'); m.put(c, 4, 'k')
    m.put(30, 5, '2')
    m.rect(20, 6, 34, 13, '.')                    # 配电区
    for c, r in [(24, 8), (30, 8), (24, 11), (30, 11)]: m.put(c, r, 'P')
    m.put(19, 10, '3')
    m.rect(12, 8, 18, 12, '.')                    # 档案室
    m.rect(12, 8, 18, 8, '&'); m.put(17, 12, 'd')
    m.put(13, 13, '$'); m.rect(12, 14, 14, 14, '.')
    m.put(27, 14, '4')
    m.rect(1, 15, 34, 23, '.')                    # 矿车枢纽
    m.rect(1, 17, 34, 17, '='); m.rect(1, 21, 34, 21, '='); m.rect(8, 15, 8, 23, '='); m.rect(26, 15, 26, 23, '=')
    for c, r in [(4, 19), (14, 19), (20, 19), (31, 19)]: m.put(c, r, 'm')
    m.put(17, 24, '5')
    m.rect(12, 25, 22, 27, '.')                   # 冷库
    m.rect(11, 25, 11, 27, '|'); m.rect(23, 25, 23, 27, '|')
    m.put(21, 27, 'X')
    m.put(2, 2, '@')
    return dict(comment='第五章 七二一的亡灵 —— 苏晚与小满', id=5, title='七二一的亡灵', place='七二一厂深层 · 培养舱走廊与冷库',
        pov='su', mural='tex:m_ch5', par=1000, map=m.rows(),
        doors=[{'id': '1'}, {'id': '2'}, {'id': '3', 'flag': 'power', 'trigger': 'box3', 'label': '档案室'}, {'id': '4', 'flag': 'tape', 'trigger': 'tape', 'label': '矿车枢纽'},
               {'id': '5', 'flag': 'steelbone', 'trigger': 'steelbone', 'label': '冷库'}],
        marks={'startYaw': [-1, 0], 'man': [2, 3], 'corridor': [15, 2], 'scare': [24, 2], 'box1': [21, 7], 'box2': [33, 7], 'box3': [27, 13], 'bench': [33, 12],
               'ore1': [22, 9], 'ore2': [32, 12], 'gu1': [27, 10], 'tape': [15, 10], 'photo': [15, 9], 'hub': [27, 15], 'lever1': [2, 16], 'lever2': [33, 16],
               'steelbone': [17, 19], 'cold': [17, 26], 'serum': [17, 26], 'vent': [21, 27], 'chase1': [13, 26], 'chase2': [14, 27], 'exit': [21, 27]},
        items=[('ammo', [4, 1], 0), ('cryo_ammo', [9, 4], 0), ('herb', [25, 2], 0), ('cryo_ammo', [21, 12], 0), ('medkit', [34, 6], 0), ('ammo', [13, 11], 0),
               ('armor', [12, 14], 1), ('cryo_ammo', [14, 14], 1), ('cryo_ammo', [2, 23], 0), ('herb', [33, 23], 0), ('ammo', [11, 15], 0), ('medkit', [20, 27], 0)],
        lights=[L(5, 2, 0xb0c8d8, 2, 0), L(16, 2, 0x40ffa0, 3, 0.3), L(26, 3, 0x40ffa0, 3, 0.8), L(27, 9, 0xffd0a0, 3, 1), L(15, 10, 0xffc080, 3, 0.2),
                L(8, 19, 0xffc070, 3, 0.5), L(26, 19, 0xffc070, 3, 0.6), L(17, 26, 0xff2020, 5, 0.3)],
        theme={'wall': 'tex:factory_wall', 'wall2': 'p:metal', 'mural': 'tex:m_ch5', 'floor': 'tex:wet_tile', 'floorOut': 'p:mud', 'ceiling': 'p:ceiling',
               'fog': 0x05080a, 'fogDensity': 0.075, 'hemi': [0x40566a, 0x1a1010, 0.45],
               'zones': [{'rect': [1, 1, 10, 4], 'wall': 'p:stone'}, {'rect': [1, 15, 34, 23], 'wall': 'p:rust', 'floor': 'p:concrete'},
                         {'rect': [12, 25, 22, 27], 'wall': 'tex:frost_door', 'floor': 'p:frost'}, {'rect': [12, 8, 18, 12], 'wall': 'tex:wood_panel', 'floor': 'tex:carpet'}]},
        route=['corridor', 'box1', 'box2', 'box3', 'tape', 'hub', 'steelbone', 'cold', 'exit'])

# ---------------- 第六章 山城沦陷 ----------------
def ch6():
    m = M(36, 27)
    m.rect(1, 1, 22, 10, '.')                     # 李子坝轻轨站台
    m.rect(1, 4, 22, 6, '=')                      # 轨道
    for c in (4, 10, 16): m.put(c, 2, 'P'); m.put(c, 8, 'P')
    m.put(23, 3, '1'); m.rect(24, 1, 30, 5, '.')   # 站台控制室
    m.put(29, 1, 'c'); m.put(26, 5, 'c')
    m.put(11, 11, '2')
    m.rect(1, 12, 22, 17, '.')                    # 地铁控制中心
    for c, r in [(5, 14), (9, 14), (13, 14), (17, 14)]: m.put(c, r, 'c')
    m.rect(1, 12, 1, 17, '&')
    m.put(23, 15, '3')
    m.rect(24, 7, 34, 25, ',')                    # 渝中街道 / 索道站
    for c, r in [(26, 9), (32, 9), (26, 14), (32, 14), (26, 19), (32, 19)]: m.put(c, r, 'h')
    m.rect(1, 19, 22, 25, ',')
    for c, r in [(4, 21), (10, 23), (16, 21)]: m.put(c, r, 'h')
    m.rect(23, 19, 23, 25, ',')
    m.put(31, 7, '$'); m.rect(31, 6, 33, 6, '.')
    m.put(2, 24, 'X')
    m.put(20, 2, '@')
    return dict(comment='第六章 山城沦陷 —— 重庆主城', id=6, title='山城沦陷', place='重庆 · 李子坝轻轨站与长江索道',
        pov='zhou', mural='tex:m_ch6', par=1000, map=m.rows(),
        doors=[{'id': '1'}, {'id': '2', 'flag': 'defense', 'trigger': 'console', 'label': '地铁控制中心'}, {'id': '3', 'flag': 'log', 'trigger': 'host', 'label': '渝中街道'}],
        marks={'startYaw': [1, 0], 'chen': [27, 3], 'console': [28, 2], 'platform': [12, 8], 'trackW': [1, 5], 'trackE': [22, 5],
               'sp1': [1, 4], 'sp2': [1, 6], 'sp3': [22, 4], 'sp4': [22, 6], 'sp5': [3, 1], 'sp6': [3, 10], 'host': [11, 15], 'metro1': [3, 13], 'metro2': [20, 16],
               'street': [28, 16], 'st1': [33, 11], 'st2': [25, 22], 'st3': [30, 24], 'st4': [12, 20], 'st5': [6, 24], 'cable': [5, 21], 'exit': [2, 24]},
        items=[('mg_ammo', [21, 1], 0), ('mg_ammo', [2, 9], 0), ('herb', [21, 9], 0), ('armor', [25, 2], 0), ('medkit', [12, 1], 0), ('mg_ammo', [12, 9], 0),
               ('ammo', [3, 16], 0), ('herb', [20, 13], 0), ('mg_ammo', [32, 6], 1), ('armor', [33, 6], 1), ('mg_ammo', [29, 21], 0), ('medkit', [18, 24], 0), ('ammo', [33, 25], 0)],
        lights=[L(6, 3, 0xd0e0ff, 4, 0.5), L(16, 7, 0xd0e0ff, 4, 0.3), L(27, 3, 0x60ffb0, 3, 0.1), L(9, 15, 0x60c0ff, 3, 0.3), L(18, 13, 0x60c0ff, 3, 0.6),
                L(29, 11, 0xff3060, 4, 0.2, 3.0), L(29, 21, 0xffb040, 4, 0.4, 3.0), L(12, 22, 0xff3060, 4, 0.3, 3.0), L(5, 23, 0x40e0ff, 3, 0.1, 3.0)],
        theme={'wall': 'p:neon', 'wall2': 'p:concrete', 'mural': 'tex:m_ch6', 'floor': 'p:concrete', 'floorOut': 'p:concrete', 'ceiling': 'p:ceiling',
               'fog': 0x140a10, 'fogDensity': 0.05, 'hemi': [0x6a4a6a, 0x1a1010, 0.6], 'sky': 'sky:f25',
               'zones': [{'rect': [1, 12, 22, 17], 'wall': 'p:metal', 'floor': 'p:tile'}, {'rect': [24, 1, 30, 5], 'wall': 'p:metal'}]},
        route=['console', 'platform', 'host', 'street', 'cable', 'exit'])

# ---------------- 第七章 白帝城 ----------------
def ch7():
    m = M(36, 27)
    m.rect(1, 1, 12, 5, ',')                      # 码头
    m.rect(13, 1, 34, 5, '#')
    m.rect(1, 6, 34, 12, ',')                     # 山门外
    m.scatter(1, 6, 34, 12, 't', 12)
    m.rect(14, 9, 20, 12, ',')
    m.rect(1, 13, 34, 13, '#'); m.put(17, 13, '1')
    m.rect(8, 14, 26, 19, '.')                    # 托孤堂
    for c, r in [(10, 15), (24, 15), (10, 18), (24, 18), (14, 16), (20, 16)]: m.put(c, r, 'P')
    m.put(17, 18, 'x'); m.rect(8, 14, 26, 14, '&'); m.put(17, 14, '.')
    m.put(17, 20, '2')
    m.rect(8, 21, 26, 24, '.')                    # 地宫
    m.rect(8, 24, 26, 24, '&')
    m.put(27, 22, '3')
    m.rect(28, 20, 34, 25, ',')                   # 码头（日落）
    m.put(33, 24, 'X')
    m.put(7, 16, '$'); m.rect(5, 15, 6, 17, '.')
    m.put(2, 2, '@')
    return dict(comment='第七章 白帝城 —— 白帝城与瞿塘峡', id=7, title='白帝城', place='瞿塘峡夔门 · 白帝庙托孤堂与地宫',
        pov='lin', mural='tex:m_ch7', par=1000, map=m.rows(),
        doors=[{'id': '1', 'flag': 'gate', 'trigger': 'gate', 'label': '白帝庙山门'}, {'id': '2', 'flag': 'hall', 'trigger': 'fang', 'label': '地宫'},
               {'id': '3', 'flag': 'xu', 'trigger': 'xu', 'label': '暗道'}],
        marks={'startYaw': [2, 0], 'su': [3, 1], 'man': [3, 3], 'gate': [17, 12], 'c1': [6, 8], 'c2': [28, 9], 'c3': [12, 11], 'c4': [24, 7], 'c5': [31, 11],
               'g1': [9, 7], 'g2': [22, 10], 'g3': [30, 7], 'g4': [4, 11], 'fang': [17, 16], 'glass': [17, 14], 'palace': [17, 22], 'rhythm': [17, 23],
               'xu': [17, 17], 'xuGuard1': [9, 19], 'xuGuard2': [25, 19], 'dock': [31, 22], 'exit': [33, 24]},
        items=[('ammo', [10, 2], 0), ('herb', [2, 5], 0), ('ammo', [33, 6], 0), ('cryo_ammo', [1, 12], 0), ('medkit', [17, 9], 0), ('armor', [5, 16], 1),
               ('cryo_ammo', [6, 15], 1), ('ammo', [9, 16], 0), ('herb', [25, 19], 0), ('cryo_ammo', [9, 23], 0), ('medkit', [25, 21], 0), ('ammo', [29, 25], 0)],
        lights=[L(6, 3, 0xffa060, 3, 0.2, 2.5), L(17, 10, 0xff8040, 3, 0.4, 2.5), L(17, 15, 0xffb050, 6, 0.6, 2.2), L(11, 17, 0xff9040, 3, 0.5),
                L(23, 17, 0xff9040, 3, 0.5), L(17, 23, 0xffc060, 4, 0.3), L(31, 22, 0xff8040, 4, 0.2, 2.5)],
        theme={'wall': 'p:temple', 'wall2': 'p:stone', 'mural': 'tex:m_ch7', 'floor': 'p:lattice', 'floorOut': 'p:stone', 'ceiling': 'p:lattice',
               'fog': 0x1a1010, 'fogDensity': 0.055, 'hemi': [0x8a6a5a, 0x2a1810, 0.6], 'sky': 'sky:village', 'water': True,
               'zones': [{'rect': [1, 1, 34, 13], 'wall': 'p:stone'}, {'rect': [8, 21, 26, 24], 'wall': 'p:stone', 'floor': 'p:stone'}]},
        route=['gate', 'fang', 'palace', 'rhythm', 'xu', 'dock', 'exit'])

# ---------------- 第八章 蛊母 ----------------
def ch8():
    m = M(36, 28)
    m.rect(1, 1, 34, 4, ',')                      # 大坝坝顶
    m.rect(1, 1, 34, 1, 'R')
    m.put(17, 5, '1')
    m.rect(8, 6, 26, 11, '.')                     # 控制中枢
    for c in range(10, 26, 3): m.put(c, 7, 'c')
    m.rect(8, 6, 26, 6, '&'); m.put(17, 6, '.')
    m.put(17, 12, '2')
    m.rect(1, 13, 34, 26, '.')                    # 水下闸室
    m.rect(1, 13, 34, 14, '~'); m.rect(1, 25, 34, 26, '~')
    for c, r in [(6, 17), (28, 17), (6, 22), (28, 22)]: m.put(c, r, 'p')
    m.put(1, 26, 'X')
    m.put(7, 9, '$'); m.rect(4, 8, 6, 10, '.')
    m.put(17, 2, '@')
    return dict(comment='第八章 蛊母 —— 三峡大坝水下闸室', id=8, title='蛊母', place='三峡大坝 · 控制中枢与水下闸室',
        pov='lin', mural='tex:m_ch8', par=1100, map=m.rows(),
        doors=[{'id': '1'}, {'id': '2', 'flag': 'zhong', 'trigger': 'console', 'label': '水下闸室'}],
        marks={'startYaw': [2, 0], 'su': [16, 3], 'man': [18, 3], 'zhou': [15, 2], 'chen': [19, 2], 'console': [17, 9], 'zhong': [17, 8],
               'chamber': [17, 15], 'mother': [17, 20], 'a1': [5, 15], 'a2': [29, 15], 'a3': [5, 24], 'a4': [29, 24],
               'w1': [3, 18], 'w2': [31, 18], 'w3': [10, 24], 'w4': [24, 16], 'exit': [1, 26]},
        items=[('ammo', [4, 3], 0), ('cryo_ammo', [30, 3], 0), ('armor', [25, 10], 0), ('medkit', [9, 10], 0), ('cryo_ammo', [5, 8], 1), ('mg_ammo', [6, 10], 1),
               ('ammo', [2, 16], 0), ('herb', [33, 16], 0), ('cryo_ammo', [2, 23], 0), ('medkit', [33, 23], 0), ('ammo', [17, 24], 0)],
        lights=[L(9, 3, 0xb0c0d0, 3, 0.1, 3.0), L(25, 3, 0xb0c0d0, 3, 0.1, 3.0), L(17, 8, 0x60c0ff, 5, 0.2), L(17, 20, 0xff2010, 7, 0.4, 3.0),
                L(6, 15, 0x60c0ff, 3, 0.6), L(28, 24, 0x60c0ff, 3, 0.6)],
        theme={'wall': 'tex:sluice_wall', 'wall2': 'p:concrete', 'mural': 'tex:m_ch8', 'floor': 'p:concrete', 'floorOut': 'p:concrete', 'ceiling': 'p:ceiling',
               'fog': 0x060a0c, 'fogDensity': 0.05, 'hemi': [0x40566a, 0x1a1010, 0.55], 'sky': 'sky:f01', 'water': True,
               'zones': [{'rect': [8, 6, 26, 11], 'wall': 'p:metal', 'floor': 'p:tile'}]},
        route=['console', 'chamber', 'mother', 'exit'])

for i, f in enumerate([ch2, ch3, ch4, ch5, ch6, ch7, ch8], start=2):
    emit(f'ch{i}', f())
