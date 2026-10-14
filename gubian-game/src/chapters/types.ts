// 章节数据结构（纯数据，不依赖渲染，便于校验脚本直接读取）
export type KeyColor = 'red' | 'blue' | 'yellow';

export interface DoorDef {
  id: string; // 地图中的数字
  key?: KeyColor; // 需要的钥匙
  flag?: string; // 由剧情打开（校验时视为在 trigger 处触发）
  trigger?: string; // flag 门：对应的触发点（marks 中的名字），校验用
  label?: string;
}

export type ItemType =
  | 'key_red' | 'key_blue' | 'key_yellow'
  | 'ammo' | 'mg_ammo' | 'cryo_ammo' | 'herb' | 'armor' | 'medkit'
  | 'weapon_mg' | 'weapon_cryo';

export interface ItemDef {
  type: ItemType;
  at: [number, number];
  secret?: boolean;
}

export interface LightDef {
  at: [number, number];
  color: number;
  intensity: number;
  flicker?: number;
  y?: number;
}

export interface Theme {
  wall: string; // 'tex:xxx' 图片贴图 或 'p:xxx' 程序贴图
  wall2: string;
  mural: string;
  floor: string;
  floorOut: string;
  ceiling: string;
  fog: number;
  fogDensity: number;
  hemi: [number, number, number];
  sky?: string;
  water?: boolean;
  wallTint?: number;
  // 分区贴图：[c0, r0, c1, r1] 范围内的墙/地面换成指定贴图
  zones?: { rect: [number, number, number, number]; wall?: string; floor?: string; ceiling?: string }[];
}

export interface ChapterData {
  id: number;
  title: string;
  place: string;
  pov: 'lin' | 'zhou' | 'su';
  map: string[];
  doors: DoorDef[];
  marks: Record<string, [number, number]>;
  items: ItemDef[];
  lights: LightDef[];
  theme: Theme;
  par: number; // 参考通关秒数
  mural: string;
  // 校验用：剧情必经点（按顺序），以及剧情给的钥匙
  route: string[];
}
