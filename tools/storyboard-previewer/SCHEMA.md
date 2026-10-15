# 分镜动态预览台 · 数据格式

> 一般不需要手写这份数据：在页面的「剧本 → 分镜」里粘贴或打开剧本（.txt / .md / .fountain / .docx），点「拆分场次并生成预览」，页面会按场次自动生成。
> - **快速拆镜**：本页按规则完成，离线也能用，适合先看走位和节奏。能识别「第一场 / 1-2 / INT. / 【场景】」等场次标题、「人物：甲、乙」和「名字：台词」格式，以及劈、刺、推、踢、闯入、拔刀、烛灭、落地等常见动作。
> - **Claude 拆镜**：在 claude.ai 里打开页面时可用，按导演技能的六条分镜原则逐镜设计，输出的就是下面这份数据。
>
> 下面的格式用于手动微调，或让 Claude 在对话里直接生成。

`index.html` 是一个单文件页面，整部预览由页面里 `<script type="application/json" id="storyboard-data">` 中的 JSON 驱动。
也可以在页面「分镜数据」标签里粘贴、导入、修改后点「应用」。

## 顶层结构

```json
{
  "meta":   { ... },          // 片头信息
  "actors": { "id": { ... } },// 人物造型
  "set":    [ ... ],          // 侧视布景（实景镜头用）
  "plan":   { ... },          // 俯视平面（走位图与高机位俯视镜头用）
  "shots":  [ ... ]           // 镜头，按顺序；时码由 dur 自动累加
}
```

## meta

| 字段 | 说明 |
| --- | --- |
| `title` | 标题，如「西廊书房·夜取信」 |
| `line` | 默认视觉线：`A` 影戏线 / `B` 现实线 / `C` 回忆线（对应 Seedance 导演技能的三条线）/ `N` 通用（日景、现代或其他题材），决定配色 |
| `place` `time` | 地点、时间，显示在标题上方 |
| `aspect` | `16:9`（默认）或更宽的画幅如 `2.39:1`（会加遮幅） |
| `fps` | 帧率，仅显示 |
| `summary` | 一句话概述 |

## actors

```json
"heng": { "name": "沈蘅", "body": "#5f707a", "legs": "#2a3034", "sash": "#c7362c",
          "skin": "#e6cfb1", "hair": "bun", "hairColor": "#151515",
          "beard": false, "robe": false, "weapon": "sword", "scale": 1 }
```

- `hair`：`bun` 发髻 / `crown` 冠 / `band` 抹额 / 省略为短发
- `robe: true` 画长袍下摆；`beard: true` 画胡须
- `weapon`：`sword` 剑 / `blade` 刀 / `knife` 短刀 / `staff` 棍；省略则无兵器
- `scale`：身形比例，1 约为 420 单位高
- 影戏线（A）中人物自动画成皮影剪影并带签子

## set（侧视布景，世界坐标：宽 1600，地面在 y=760）

| type | 字段 |
| --- | --- |
| `window` | `x` `w` `y` `h`：窗格；有月光时透出钢青光束 |
| `desk` / `table` | `x` `w` `h` |
| `candle` | `id` `x` `h`（离地高度）；随 `light.candle` 或 `props[id].lit` 点亮/熄灭 |
| `door` | `id` `x` `w`；`props[id].open` 控制开门 |
| `pillar` `jar` `lantern` `bed` `screen` | `x`（及 `w`/`y`） |

## plan（俯视平面，默认 1000 × 600）

```json
"plan": { "w": 1000, "h": 600,
  "props": [ { "label": "书案", "x": 360, "y": 230, "w": 260, "h": 80, "kind": "window|door|candle" } ] }
```

## shots

```json
{
  "dur": 1.6,                       // 时长（秒），必填
  "view": "side",                   // side 实景侧视 / insert 插入特写 / plan 高机位俯视
  "line": "B",                      // 可选：本镜视觉线（交替剪辑时使用）
  "lens": "35mm", "size": "中景", "angle": "平视",
  "tags": ["key", "slowmo"],        // key 关键镜 / slowmo 升格
  "cam": {
    "move": "handheld",             // handheld 手持定点 / push 推 / pull 拉 / pan 摇 / track 移跟 / tilt 俯仰 / crane 升降 / static 固定（需导演确认）
    "hh": 1,                        // 手持强度 0–3：几乎静止 / 轻微 / 贴身肩扛 / 近身跟拍
    "settle": 0.6,                  // 在本镜 60% 处稳住
    "target": ["heng", "guard"],    // 构图对象（一个或多个人物 id）
    "dir": -1,                      // 方向：track/pan 中 -1 向画左；tilt/crane 中 1 向上
    "amount": 240, "dutch": 0       // 可选：运动幅度、倾斜角
  },
  "light": { "candle": true, "moon": true, "dark": 0.25 },   // 不写则沿用上一镜
  "props": { "door": { "open": true } },                      // 布景状态，向后沿用
  "acts": {                         // 人物关键帧（t 为本镜内 0–1，可省略则均分）
    "heng": [ { "t": 0, "x": 1000, "pose": "crouch", "face": 1 },
              { "t": 1, "x": 860, "pose": "dodge", "face": 1, "weapon": "hand", "head": -10 } ]
  },
  "fx": [ { "t": 0.72, "kind": "impact", "x": 1040, "y": 612 },
          { "t": 0.36, "kind": "spark", "at": "guard.hand" } ],
  "insert": { "kind": "candle", "out": 0.5, "tip": true },     // view 为 insert 时
  "plan": { "actors": { "heng": [[600, 330], [520, 340]] }, "cam": [640, 560, -7] },
  "beat": "劈案 · 闪开",             // 时间轴旁的短标签
  "info": "刀劈进书案，她已闪开",     // 一镜一信息（主语＋动词）
  "q": "下一刀呢？",                 // 留下的问题
  "action": "……",                    // 写进【CAMERA】的本镜动作正文
  "audio": "……"
}
```

- **姿态** `pose`：`stand` `walk` `run` `sit` `guard` `crouch` `reach` `crouchLook` `thrust` `chop` `raise` `dodge` `stagger` `pinned` `push` `threaten` `look` `kick` `kneel` `fall` `down`。相邻关键帧之间自动插值。
- `face`：1 面向画右，-1 面向画左；`head`：头部俯仰角（负为抬头）。
- `weapon`（关键帧）：`hand` 持在手 / `sheath` 入鞘 / `none` 脱手。
- **插入特写** `insert.kind`：`eye`（`look`、`narrow`）/ `boots` / `draw` 拔刀 / `candle`（`out`、`tip`）/ `drop` 兵器落地 / `hand` 握柄 / `throat` 刃抵喉 / 其他值显示 `label` 文字卡。
- **特效** `fx.kind`：`impact` `spark` `blood` `dust` `flash`；位置用 `x`/`y` 或 `at: "人物id.hand|head|hip|foot"`。
- **俯视机位** `plan.cam`：`[x, y, 朝向]`，朝向 0 为平面图上方，90 为右方。页面据此画视角扇形，并按前两位人物的连线检查实景镜头之间是否**越轴**。
- **景别** `size`：大全景 / 全景 / 中全景 / 中景 / 中近景 / 近景 / 特写 / 大特写，决定画面缩放，也用于导出「景别与信息类型」。
