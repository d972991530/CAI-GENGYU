# 导演台全能工作流 · rv2v 镜头换人

基于「MiniMax H3 导演台全能工作流-ref2va」（[AIMixer/ComfyUI_MiniMaxH3_Director](https://github.com/AIMixer/ComfyUI_MiniMaxH3_Director) 插件的 `MiniMaxH3Director` 节点）改造，和 `h3_director_console.json` 做的是同一件事，但只用一个导演台节点，不需要 78 组节点。

## 文件

| 文件 | 用途 |
|---|---|
| `h3_director_rv2v_78shots.json` | 改好的工作流，导入 RunningHub |
| `stage_78shots.mmxpack.zip` | 导演包：原视频 + 78 个已分好的片段（不进仓库，由脚本生成） |
| `build_director_rv2v.py` | 生成上面两个文件 |

```bash
python3 build_director_rv2v.py --workflow 原工作流.json --source 原视频.mp4 --out-dir 输出目录
```

## 改了什么

| 改动 | 原因 |
|---|---|
| 任务改为 `rv2v — 参考素材改视频` | 源视频每段自动作为 `<Video 1>` 提供动作和镜头，每段可挂图片 1–9 作为 `<Picture N>` 替换人物 |
| 编辑模式设为「分段」 | 每个片段只用自己的参考图，不同镜头可以换成不同的人 |
| 78 个片段按镜头切割包的切点预置 | 起止帧与 `shot_list.json` 完全一致，编号对应 `shot_NNN` |
| 声音用原片原声，段间衔接关闭 | 镜头之间本来就是硬切，衔接会把上一镜头的动作带进下一镜头 |
| 画面 1280×576 | 原片比例（约 2.22:1），两边都是 32 的倍数 |
| 加速 LoRA 换成 `minimax_h3_ref2v_turbo_4step` | 原工作流把 FL2V 的加速 LoRA 挂在 Ref2VA 模型上 |
| 删除「尾链」三个节点（cleanGpu → RIFE → SaveImage） | 它们在成片保存后故意让任务报错，对出片没有作用 |
| 清除节点里保存的个人云端预览地址 | 分享工作流时不带个人存储路径 |

## 为什么要用导演包导入

在节点里直接上传视频，插件会把时间轴重置成一整段（`_applyLoadedVideo → _setSingleSegment`），预置的 78 个切点就没了。导演包里的 `timeline.json` 带着视频路径和全部片段，导入时插件会把视频复制到 `input/minimax_director_packs/` 并保留分段。

这一点用插件自己的 `import_extracted_pack` 和分段函数核对过：导入后没有缺失素材，任务是 rv2v、分段模式，插件算出的 78 个片段范围与镜头表逐一相同。我没有在 RunningHub 上实际运行过。

## 使用步骤

1. 导入 `h3_director_rv2v_78shots.json`。
2. 导演台节点工具栏 →「导入导演包」→ 选 `stage_78shots.mmxpack.zip`。之后不要再在节点里上传视频。
3. 点选片段，往「图片 1–9」上传角色图。图片 1 是画面里最主要的人，多人时按从左到右的顺序往后传。
4. 需要时改片段提示词，写明谁对应谁。
5. 打开「选择运行」，只勾选传好图的片段；没勾选的片段导出时用原片画面补齐。

## 注意

- 不传参考图的片段等同于 v2v（只按提示词重绘），所以没换人的镜头建议不要勾选。
- 很短的镜头（几帧到 1 秒）生成质量不稳定，可以在时间轴上删掉切点，和相邻镜头合并后再换人。
- 替换用的角色需是虚构人物或已获得本人授权的人物；原片的画面、编舞和音乐有版权，公开发布前需取得授权。
