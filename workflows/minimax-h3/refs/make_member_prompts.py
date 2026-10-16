"""生成成员定妆照提示词：python3 make_member_prompts.py  →  character_prompts.json + PROMPTS.md

改成员设定就改下面的 members / ZH / costumes，再运行一次。
"""
import json, sys, os
out_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))

common = {
    "size": [1152, 1536],
    "aspect": "3:4",
    "style": "Professional K-pop concept photo, full-body character reference sheet photo, photorealistic, 85mm lens, sharp focus on the face, natural skin texture, even soft studio lighting, seamless light grey backdrop, no props",
    "pose": "Standing straight facing the camera, arms relaxed at her sides, feet slightly apart, neutral friendly expression, entire body visible from head to shoes with a little space above the head",
    "negative": "cropped head, cropped feet, multiple people, extra limbs, extra fingers, deformed hands, heavy makeup, harsh shadows, busy background, text, watermark, logo, cartoon, anime, 3d render, plastic skin, blurry, revealing outfit, provocative pose",
}

costumes = {
    "c1": "wearing an oversized white cropped sweatshirt, baggy white jogger sweatpants and chunky white sneakers, monochrome all-white streetwear",
    "c2": "wearing a fitted grey-white cropped polo shirt with a white collar, a light grey pleated mini skirt, white knee-high socks and glossy white loafers, clean retro-futuristic school uniform style",
}

edit_c2 = ("Keep this exact same person, same face, same hairstyle, same hair colour, same accessories, same pose, same backdrop and lighting. "
           "Change only the outfit to: a fitted grey-white cropped polo shirt with a white collar, a light grey pleated mini skirt, white knee-high socks and glossy white loafers.")

# 12 位虚构成员：靠发色、发型、脸型、标志性配饰拉开差异，远景群舞里也能认出来
ZH = {'A': '高挑，杏眼，左眼下泪痣，黑长直配空气刘海', 'B': '圆脸酒窝，铜棕色大波浪，深侧分', 'C': '高颧骨单眼皮，黑色中分直发别耳后', 'D': '娇小，灰棕色锁骨发配八字刘海', 'E': '运动型，深棕色高马尾', 'F': '心形脸，及腰黑长发，半扎白缎带', 'G': '眼尾上扬，鼻梁小雀斑，蜂蜜金层次长发', 'H': '娇小圆脸，深棕色双低丸子头', 'I': '笑容明亮，栗橙色微卷长发', 'J': '猫眼，黑色齐下颌短发配空气刘海', 'K': '高冷，铂银色长直发', 'L': '甜美鹅蛋脸，深棕长发内层挑染粉色'}
members = [
    ("A", "中心位 · 开场双人", "tall slim build, oval face, sharp almond-shaped eyes, a small beauty mark under her left eye, long straight jet-black hair falling past the chest with soft see-through bangs", "a thin silver chain choker", 2101),
    ("B", "开场双人 · 结尾 wink", "medium height, round soft face, big warm eyes, dimples when smiling, long wavy copper-auburn hair with a deep side part", "small gold hoop earrings", 2102),
    ("C", "绿光特写 · 波浪下腰中心", "slender build, elegant long neck, high cheekbones, calm monolid eyes, long sleek black hair with a sharp centre part tucked behind the ears", "pearl stud earrings", 2103),
    ("D", "翻花绳 · 拱门", "petite build, small delicate face, gentle doe eyes, shoulder-length ash-brown bob with curtain bangs", "several thin silver rings on both hands", 2104),
    ("E", "手腕道具 · 拱门", "athletic build, defined jawline, bright confident eyes, dark brown hair in a high sleek ponytail", "a white ring-shaped wrist device on her left wrist", 2105),
    ("F", "丝带俯拍 · 拱门前景", "tall build, heart-shaped face, soft dreamy eyes, very long straight black hair down to the waist, half-up with a white satin ribbon bow", "a white satin hair ribbon", 2106),
    ("G", "发光小球 · 闯关路径", "medium height, playful upturned eyes, light freckles across the nose, long layered honey-blonde hair", "a single silver ear cuff on her right ear", 2107),
    ("H", "水晶 · 推滚轮 · 踩节点", "petite build, round face, soft round eyes, dark brown hair styled in two low buns with loose face-framing strands", "small white star hair clips", 2108),
    ("I", "旋转入画 · 回眸笑", "medium height, bright cheerful face, wide smile, long chestnut-ginger hair with soft loose waves", "a thin red string bracelet", 2109),
    ("J", "伏地圆环 · 脚尖点地", "lean dancer build, cat-like eyes, defined brows, jaw-length glossy black hair with see-through bangs", "small black stud earrings", 2110),
    ("K", "扶梯 · 圆孔开门 · 撞色双人", "tall slim build, cool composed expression, fine features, long straight platinum-silver hair", "a silver bar necklace", 2111),
    ("L", "倒挂入画 · 撞色双人", "medium height, sweet oval face, lively eyes, long dark brown hair with a hidden pastel-pink underlayer that shows when she moves", "a pink hair tie on her wrist", 2112),
]
c1_members = set("ABCDEFGH")

def prompt_for(identity, accessory, costume):
    return (f"{common['style']}. A fictional adult Korean woman in her early twenties, {identity}, with {accessory}, "
            f"{costumes[costume]}. {common['pose']}.")

entries = []
for mid, role, identity, accessory, seed in members:
    m = {"id": mid, "role": role, "look_zh": ZH[mid], "identity": identity, "signature": accessory, "seed": seed, "outputs": {}}
    looks = (["c1"] if mid in c1_members else []) + ["c2"]
    for look in looks:
        m["outputs"][look] = {
            "file": f"members/{mid}_{look}.png",
            "prompt": prompt_for(identity, accessory, look),
        }
    if "c1" in m["outputs"]:
        m["outputs"]["c2"]["edit_from"] = f"members/{mid}_c1.png"
        m["outputs"]["c2"]["edit_prompt"] = edit_c2
    entries.append(m)

lineup = "; ".join(f"{mid}: {identity.split(', ', 1)[-1]}" for mid, _, identity, _, _ in members)
group = {
    k: {
        "file": f"group/group_{k}.png",
        "size": [2688, 1536],
        "prompt": (f"Professional K-pop group concept photo, twelve fictional adult Korean women in their early twenties standing in one straight line, "
                   f"full bodies visible, evenly spaced, facing the camera, seamless light grey backdrop, even soft studio lighting, photorealistic. "
                   f"All of them {costumes[k]}. From left to right — {lineup}."),
        "tip": "直接文生 12 人很难每个人都准，更稳的做法是把 12 张定妆照排进一张宽图，再用图像编辑模型统一光线和地面阴影。",
    } for k in ("c1", "c2")
}
end_frame = {
    "file": "keyframes/end_AB_L.png",
    "size": [1344, 768],
    "prompt": ("Cinematic K-pop music video still, 16:9, deep electric-blue circular arena with glowing white rings and lines in the soft-focus background, "
               "close-up of two fictional adult Korean women side by side facing the camera, both making an 'L' hand sign near the face, confident smiles. "
               f"Left: {members[0][2]}, with {members[0][3]}. Right: {members[1][2]}, with {members[1][3]}. "
               f"Both {costumes['c2']}. Cool blue key light with a soft white rim light, photorealistic, shallow depth of field."),
    "tip": "用 A_c2、B_c2 当参考图做图像编辑或多图参考生成，脸会更准；出图后裁成正好 1344×768。",
}

data = {
    "usage": "定妆照提示词。先用文生图出第一套服装（c1），再把 c1 图喂给图像编辑模型，用 edit_prompt 只换衣服得到 c2，同一个人的脸最稳。I–L 只有 c2，直接文生。",
    "common": common,
    "costumes": costumes,
    "members": entries,
    "group": group,
    "end_frame": end_frame,
}
with open(os.path.join(out_dir, "character_prompts.json"), "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write("\n")

md = ["# 成员定妆照提示词", "",
      "由 `make_member_prompts.py` 生成，和 `character_prompts.json` 内容一致，这里方便直接复制。改设定请改脚本后重新运行。", "",
      "**出图顺序**：A–H 先文生第一套服装（c1）→ 把 c1 图喂给图像编辑模型（Qwen-Image-Edit、FLUX Kontext 等），用下面的「换装指令」只换衣服得到 c2 → I–L 直接文生 c2。",
      "", f"**尺寸**：{common['size'][0]}×{common['size'][1]}（3:4 竖图）　**负向提示词（所有成员通用）**：", "",
      "```", common["negative"], "```", "",
      "**换装指令（c1 → c2，A–H 通用）**：", "", "```", edit_c2, "```", "",
      "## 成员一览", "", "| 成员 | 分镜里的戏份 | 辨识点 | 标志配饰（英文原词） | 种子 |", "|---|---|---|---|---|"]
for mid, role, identity, accessory, seed in members:
    md.append(f"| {mid} | {role} | {ZH[mid]} | {accessory} | {seed} |")
for m in entries:
    md += ["", f"## {m['id']} · {m['role']}", ""]
    for look, o in m["outputs"].items():
        label = "第一套服装（c1）" if look == "c1" else ("第二套服装（c2）" + ("，备用：直接文生" if "edit_from" in o else ""))
        md += [f"**{label}** → `{o['file']}`", "", "```", o["prompt"], "```", ""]
md += ["## 全员合影", ""]
for k, g in group.items():
    md += [f"**{k}** → `{g['file']}`（{g['size'][0]}×{g['size'][1]}）", "", "```", g["prompt"], "```", "", f"> {g['tip']}", ""]
md += ["## 尾帧 · 首尾呼应", "", f"→ `{end_frame['file']}`（{end_frame['size'][0]}×{end_frame['size'][1]}）", "",
       "```", end_frame["prompt"], "```", "", f"> {end_frame['tip']}", ""]
with open(os.path.join(out_dir, "PROMPTS.md"), "w", encoding="utf-8") as f:
    f.write("\n".join(md))
print(len(entries), sum(len(m["outputs"]) for m in entries))
