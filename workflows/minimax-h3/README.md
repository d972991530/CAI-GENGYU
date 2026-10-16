# STAGE 闯关预告 · MiniMax H3 工作流

把[分镜脚本](https://claude.ai/artifact/Wbj7dEXUXe2GyYtHFFSGJA)的 57 个镜头变成可批量渲染的 ComfyUI 工作流。底模是 MiniMax 开源权重的视频模型 **MiniMax H3（海螺 3.0）**，用 ComfyUI 原生节点（`comfy_extras/nodes_minimax_h3.py`）。

```
shots.json            分镜数据：15 个生成单元、提示词时间轴、参考图、种子
templates/            两套 API 格式模板（Ref2VA 参考生视频 / FL2VA 文生·首尾帧）
build/U01.json …      编译好的单元工作流，可直接拖进 ComfyUI 运行
run_storyboard.py     build / render / assemble 三个子命令
refs/                 角色、场景、尾帧参考图（需自备，见 refs/README.md）
assets/song.wav       整首歌（需自备）
```

## 为什么按"单元"而不是按"镜头"生成

H3 单次生成只能是 124–362 帧（约 5–15 秒），帧数还要落在 17k+5 的网格上，而分镜里的镜头大多只有 1–4 秒。所以把同一场景里相邻的镜头合并成一个 6–14 秒的单元，在提示词里用官方推荐的 `Timeline:` + `[0s-2s] …` 写法描述单元内的硬切，一次生成多个镜头。场景、服装统一，镜头之间的连贯性也更好。

| 单元 | 镜头 | 时间 | 模式 | 说明 |
|---|---|---|---|---|
| U01 | 1–7 | 00:00–00:14 | Ref2VA | 序章双人 |
| U02 | 8 | 00:14–00:16 | FL2VA 文生 | Stage 1 字卡，只取前 2 秒 |
| U03 | 9–12 | 00:16–00:24 | Ref2VA | 剪影群像 |
| U04 | 13–18 | 00:24–00:36 | Ref2VA | 个人卡 |
| U05A | 19–21 | 00:36–00:42 | Ref2VA | 水晶闪白 |
| U05B | 22–24 | 00:42–00:48 | Ref2VA | 换第二套服装 |
| U06 | 25–29 | 00:48–01:00 | Ref2VA | 圆孔开门 |
| U07 | 30–33 | 01:00–01:10 | Ref2VA | 群舞冲前 |
| U08 | 34–36 | 01:10–01:18 | Ref2VA | 俯拍 + 拱门过门 |
| U09 | 37 | 01:18–01:20 | FL2VA 文生 | Stage 2 字卡 |
| U10 | 38–42 | 01:20–01:32 | Ref2VA | 闯关踩点 |
| U11 | 43–45 | 01:32–01:40 | Ref2VA | 踩点 + 撞色 |
| U12 | 46–50 | 01:40–01:53 | Ref2VA | 终章群舞 1 |
| U13 | 51–55 | 01:53–02:05 | Ref2VA | 终章群舞 2 |
| U14 | 56–57 | 02:05–02:12 | FL2VA 尾帧 | 落在预先做好的 L 手势尾帧上 |

## 两套模板

**Ref2VA（`templates/h3_ref2va_api.json`）**：管人物一致性。每个单元最多挂 9 张参考图（成员定妆照、全员合影、场景图），提示词里用 `{A_c2}` 这样的占位符，编译时按顺序换成 H3 要求的 `<Picture 1>`、`<Picture 2>`。有歌时，还会把这一段的音乐切片作为 `<Audio 1>` 参考音频传进去，让动作和硬切贴着节拍走。

**FL2VA（`templates/h3_fl2va_api.json`）**：管关键帧。不给图就是文生视频（字卡），给首帧就是图生视频，给尾帧就能让画面准确落在设计好的构图上（U14 首尾呼应）。有歌时用 `MiniMaxH3AddGuide` 把音乐切片锚定在第 0 帧。

两套共用的采样设置照搬 ComfyUI 官方 H3 蓝图：`res_multistep` 采样器、`simple` 调度、20 步、`BasicGuider`（无负向提示词）、视频/音频 shift 12/3、1344×768、24fps。FL2VA 可以在 `shots.json` 里打开 `turbo`，挂 lightx2v 的 8 步 Turbo LoRA 提速。

## 使用步骤

1. **装模型**（放进 ComfyUI 对应目录，ComfyUI 需更新到带 H3 原生节点的版本）：

   | 目录 | 文件 |
   |---|---|
   | `models/diffusion_models/` | `minimax_h3_fl2va_pruned_int8_convrot.safetensors`、Ref2VA 对应文件 |
   | `models/text_encoders/` | `qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors` |
   | `models/vae/` | `minimax_h3_video_vae_fp16.safetensors`、`minimax_h3_audio_vae_fp32.safetensors` |
   | `models/loras/`（可选） | `minimax_h3_fl2v_turbo_8step_v1.0_comfyui_bf16.safetensors` |

   以上文件名来自 ComfyUI 官方蓝图，下载地址是 Hugging Face 的 `Comfy-Org/MiniMax-H3`。**Ref2VA 的 DiT 文件名是按 FL2VA 的命名规则推的**，下载后如果不一致，改 `shots.json` 里的 `models.ref2va_unet` 即可。RTX 50 系显卡用 nvfp4 文本编码器最省显存，其他显卡可换成 int8_convrot 版本。

2. **准备素材**：按 `refs/README.md` 放好参考图，把歌放到 `assets/song.wav`。

3. **检查工作流**：

   ```bash
   python3 run_storyboard.py build          # 重新编译 build/*.json，并打印每个单元的生成帧数
   ```

   想手动调某一个单元，直接把 `build/U06.json` 拖进 ComfyUI。

4. **批量渲染**（ComfyUI 需在运行中）：

   ```bash
   python3 run_storyboard.py render                    # 全部单元，每个默认出 2 条（不同种子）
   python3 run_storyboard.py render --units U06,U07 --takes 4 --force
   ```

   脚本会上传参考图和音乐切片、提交任务、等待完成，把结果下载到 `renders/U06_t1.mp4` 这样的文件。

5. **拼成片**：

   ```bash
   python3 run_storyboard.py assemble --pick U01=2,U07=1
   ```

   每个单元裁回分镜时长（生成长度向上取整过），统一编码后按顺序拼接，再用整首歌替换掉模型生成的音轨，输出 `out/stage_final.mp4`。

## 需要在后期补的部分

动态图形（路径线、箭头、编号节点、弧线）、频闪黑帧、结尾切黑这些模型做不准，每个单元的 `post` 字段里都列出来了。两张 Stage 字卡也建议在 AE 里做，生成版当备选。

## 已知限制

- H3 的权重遵循 **MiniMax H3 Community License**：在美国、欧盟、英国、韩国自行部署需要单独授权，商用前请自己核对条款。
- 显存需求社区说法不一：官方 ComfyUI 支持动态卸载，int8/nvfp4 版本在 24GB 卡上比较从容，12GB 可以跑但会慢。
- 参考音频卡点（Ref2VA 的 `<Audio 1>`）和音频锚定（FL2VA 的 AddGuide）是按节点源码里的接口接的，效果需要实际出片验证；不满意就在 `shots.json` 的 `sampling.music_conditioning` 改成 `none`，或给单个单元加 `"music": "none"`。
- 单元工作流的接口已对照 ComfyUI 源码核对过，但本仓库所在环境没有 GPU，没有真正渲染过。
