import type { ChapterData } from '../types';

// 联动支线 第二幕 船舱·逆流（1971 · 长江上游）
export const side2: ChapterData = {
  id: 22,
  side: 'side2',
  title: "船舱 · 逆流",
  place: "1971 · 长江 · 夔门江段 · “江安号”客货轮",
  pov: 'tang',
  mural: "tex:x_door",
  par: 600,
  map: [
    '########################################',
    '#,,,,,,%d..%d..%d..%b..b.....b.%c..w..c#',
    '#,,,,,,%...%...%...%.....b.....%.......#',
    '#,,,,,,%%.%%%.%%%.%%.b.......b.%.......#',
    '#,,,,,,%............%...........%..T...#',
    '#,@,,,,1............2.....b.....3......#',
    '#,,,,,,%............%...........%......#',
    '#,,,,,,%%.%%%.%%%.%%.b.......b.%%%.%%%%#',
    '#,,,,,,%...%...%...%.....b.....%.....X.#',
    '#,,,,,,%d..%d..%d..%b..b.....b.%o.....o#',
    '########################################',
  ],
  doors: [{"id": "1"}, {"id": "2", "flag": "bell", "trigger": "girl", "label": "货舱"}, {"id": "3", "flag": "hold", "trigger": "crate", "label": "船长室"}],
  marks: {"startYaw": [-1, 0], "deck": [3, 5], "cabins": [10, 5], "girl": [13, 1], "c1": [9, 9], "c2": [17, 8], "c3": [17, 2], "hold": [22, 5], "crate": [26, 5], "lamp1": [22, 2], "lamp2": [29, 8], "lamp3": [24, 8], "n1": [23, 3], "n2": [28, 2], "n3": [29, 7], "n4": [22, 8], "bridge": [34, 5], "doc2": [36, 3], "cap": [35, 2], "exit": [37, 8]},
  items: [{"type": "ammo", "at": [4, 2]}, {"type": "herb", "at": [9, 1]}, {"type": "mg_ammo", "at": [13, 9]}, {"type": "ammo", "at": [18, 1]}, {"type": "medkit", "at": [17, 9]}, {"type": "mg_ammo", "at": [30, 1]}, {"type": "ammo", "at": [21, 9]}, {"type": "herb", "at": [33, 8]}, {"type": "medkit", "at": [38, 4]}],
  lights: [{"at": [3, 3], "color": 10469631, "intensity": 3, "flicker": 0.3}, {"at": [10, 5], "color": 16765066, "intensity": 3, "flicker": 0.6}, {"at": [17, 5], "color": 16765066, "intensity": 2.5, "flicker": 0.9}, {"at": [13, 1], "color": 16756832, "intensity": 2.5, "flicker": 0.2}, {"at": [22, 2], "color": 16756832, "intensity": 3, "flicker": 0.4}, {"at": [26, 5], "color": 16724000, "intensity": 4, "flicker": 0.3, "y": 1.2}, {"at": [29, 8], "color": 16756832, "intensity": 3, "flicker": 0.4}, {"at": [35, 3], "color": 8454032, "intensity": 2.5, "flicker": 0.1}, {"at": [37, 8], "color": 16769184, "intensity": 3, "flicker": 0.2}],
  theme: {"wall": "tex:x_wood", "wall2": "tex:x_wood", "mural": "tex:x_door", "floor": "tex:x_wood", "floorOut": "p:deck", "ceiling": "p:ceiling", "fog": 658448, "fogDensity": 0.06, "hemi": [3818592, 1576968, 0.7], "sky": "sky:f01", "zones": [{"rect": [20, 1, 31, 9], "wall": "tex:x_iron", "floor": "tex:x_concrete"}, {"rect": [32, 1, 38, 9], "wall": "p:metal", "floor": "p:metal"}]},
  route: ["deck", "cabins", "girl", "hold", "crate", "bridge", "exit"],
};
