# 成员定妆照提示词

由 `make_member_prompts.py` 生成，和 `character_prompts.json` 内容一致，这里方便直接复制。改设定请改脚本后重新运行。

**出图顺序**：A–H 先文生第一套服装（c1）→ 把 c1 图喂给图像编辑模型（Qwen-Image-Edit、FLUX Kontext 等），用下面的「换装指令」只换衣服得到 c2 → I–L 直接文生 c2。

**尺寸**：1152×1536（3:4 竖图）　**负向提示词（所有成员通用）**：

```
cropped head, cropped feet, multiple people, extra limbs, extra fingers, deformed hands, heavy makeup, harsh shadows, busy background, text, watermark, logo, cartoon, anime, 3d render, plastic skin, blurry, revealing outfit, provocative pose
```

**换装指令（c1 → c2，A–H 通用）**：

```
Keep this exact same person, same face, same hairstyle, same hair colour, same accessories, same pose, same backdrop and lighting. Change only the outfit to: a fitted grey-white cropped polo shirt with a white collar, a light grey pleated mini skirt, white knee-high socks and glossy white loafers.
```

## 成员一览

| 成员 | 分镜里的戏份 | 辨识点 | 标志配饰（英文原词） | 种子 |
|---|---|---|---|---|
| A | 中心位 · 开场双人 | 高挑，杏眼，左眼下泪痣，黑长直配空气刘海 | a thin silver chain choker | 2101 |
| B | 开场双人 · 结尾 wink | 圆脸酒窝，铜棕色大波浪，深侧分 | small gold hoop earrings | 2102 |
| C | 绿光特写 · 波浪下腰中心 | 高颧骨单眼皮，黑色中分直发别耳后 | pearl stud earrings | 2103 |
| D | 翻花绳 · 拱门 | 娇小，灰棕色锁骨发配八字刘海 | several thin silver rings on both hands | 2104 |
| E | 手腕道具 · 拱门 | 运动型，深棕色高马尾 | a white ring-shaped wrist device on her left wrist | 2105 |
| F | 丝带俯拍 · 拱门前景 | 心形脸，及腰黑长发，半扎白缎带 | a white satin hair ribbon | 2106 |
| G | 发光小球 · 闯关路径 | 眼尾上扬，鼻梁小雀斑，蜂蜜金层次长发 | a single silver ear cuff on her right ear | 2107 |
| H | 水晶 · 推滚轮 · 踩节点 | 娇小圆脸，深棕色双低丸子头 | small white star hair clips | 2108 |
| I | 旋转入画 · 回眸笑 | 笑容明亮，栗橙色微卷长发 | a thin red string bracelet | 2109 |
| J | 伏地圆环 · 脚尖点地 | 猫眼，黑色齐下颌短发配空气刘海 | small black stud earrings | 2110 |
| K | 扶梯 · 圆孔开门 · 撞色双人 | 高冷，铂银色长直发 | a silver bar necklace | 2111 |
| L | 倒挂入画 · 撞色双人 | 甜美鹅蛋脸，深棕长发内层挑染粉色 | a pink hair tie on her wrist | 2112 |

## A · 中心位 · 开场双人

**第一套服装（c1）** → `members/A_c1.png`

```
Professional K-pop concept photo, full-body character reference sheet photo, photorealistic, 85mm lens, sharp focus on the face, natural skin texture, even soft studio lighting, seamless light grey backdrop, no props. A fictional adult Korean woman in her early twenties, tall slim build, oval face, sharp almond-shaped eyes, a small beauty mark under her left eye, long straight jet-black hair falling past the chest with soft see-through bangs, with a thin silver chain choker, wearing an oversized white cropped sweatshirt, baggy white jogger sweatpants and chunky white sneakers, monochrome all-white streetwear. Standing straight facing the camera, arms relaxed at her sides, feet slightly apart, neutral friendly expression, entire body visible from head to shoes with a little space above the head.
```

**第二套服装（c2），备用：直接文生** → `members/A_c2.png`

```
Professional K-pop concept photo, full-body character reference sheet photo, photorealistic, 85mm lens, sharp focus on the face, natural skin texture, even soft studio lighting, seamless light grey backdrop, no props. A fictional adult Korean woman in her early twenties, tall slim build, oval face, sharp almond-shaped eyes, a small beauty mark under her left eye, long straight jet-black hair falling past the chest with soft see-through bangs, with a thin silver chain choker, wearing a fitted grey-white cropped polo shirt with a white collar, a light grey pleated mini skirt, white knee-high socks and glossy white loafers, clean retro-futuristic school uniform style. Standing straight facing the camera, arms relaxed at her sides, feet slightly apart, neutral friendly expression, entire body visible from head to shoes with a little space above the head.
```


## B · 开场双人 · 结尾 wink

**第一套服装（c1）** → `members/B_c1.png`

```
Professional K-pop concept photo, full-body character reference sheet photo, photorealistic, 85mm lens, sharp focus on the face, natural skin texture, even soft studio lighting, seamless light grey backdrop, no props. A fictional adult Korean woman in her early twenties, medium height, round soft face, big warm eyes, dimples when smiling, long wavy copper-auburn hair with a deep side part, with small gold hoop earrings, wearing an oversized white cropped sweatshirt, baggy white jogger sweatpants and chunky white sneakers, monochrome all-white streetwear. Standing straight facing the camera, arms relaxed at her sides, feet slightly apart, neutral friendly expression, entire body visible from head to shoes with a little space above the head.
```

**第二套服装（c2），备用：直接文生** → `members/B_c2.png`

```
Professional K-pop concept photo, full-body character reference sheet photo, photorealistic, 85mm lens, sharp focus on the face, natural skin texture, even soft studio lighting, seamless light grey backdrop, no props. A fictional adult Korean woman in her early twenties, medium height, round soft face, big warm eyes, dimples when smiling, long wavy copper-auburn hair with a deep side part, with small gold hoop earrings, wearing a fitted grey-white cropped polo shirt with a white collar, a light grey pleated mini skirt, white knee-high socks and glossy white loafers, clean retro-futuristic school uniform style. Standing straight facing the camera, arms relaxed at her sides, feet slightly apart, neutral friendly expression, entire body visible from head to shoes with a little space above the head.
```


## C · 绿光特写 · 波浪下腰中心

**第一套服装（c1）** → `members/C_c1.png`

```
Professional K-pop concept photo, full-body character reference sheet photo, photorealistic, 85mm lens, sharp focus on the face, natural skin texture, even soft studio lighting, seamless light grey backdrop, no props. A fictional adult Korean woman in her early twenties, slender build, elegant long neck, high cheekbones, calm monolid eyes, long sleek black hair with a sharp centre part tucked behind the ears, with pearl stud earrings, wearing an oversized white cropped sweatshirt, baggy white jogger sweatpants and chunky white sneakers, monochrome all-white streetwear. Standing straight facing the camera, arms relaxed at her sides, feet slightly apart, neutral friendly expression, entire body visible from head to shoes with a little space above the head.
```

**第二套服装（c2），备用：直接文生** → `members/C_c2.png`

```
Professional K-pop concept photo, full-body character reference sheet photo, photorealistic, 85mm lens, sharp focus on the face, natural skin texture, even soft studio lighting, seamless light grey backdrop, no props. A fictional adult Korean woman in her early twenties, slender build, elegant long neck, high cheekbones, calm monolid eyes, long sleek black hair with a sharp centre part tucked behind the ears, with pearl stud earrings, wearing a fitted grey-white cropped polo shirt with a white collar, a light grey pleated mini skirt, white knee-high socks and glossy white loafers, clean retro-futuristic school uniform style. Standing straight facing the camera, arms relaxed at her sides, feet slightly apart, neutral friendly expression, entire body visible from head to shoes with a little space above the head.
```


## D · 翻花绳 · 拱门

**第一套服装（c1）** → `members/D_c1.png`

```
Professional K-pop concept photo, full-body character reference sheet photo, photorealistic, 85mm lens, sharp focus on the face, natural skin texture, even soft studio lighting, seamless light grey backdrop, no props. A fictional adult Korean woman in her early twenties, petite build, small delicate face, gentle doe eyes, shoulder-length ash-brown bob with curtain bangs, with several thin silver rings on both hands, wearing an oversized white cropped sweatshirt, baggy white jogger sweatpants and chunky white sneakers, monochrome all-white streetwear. Standing straight facing the camera, arms relaxed at her sides, feet slightly apart, neutral friendly expression, entire body visible from head to shoes with a little space above the head.
```

**第二套服装（c2），备用：直接文生** → `members/D_c2.png`

```
Professional K-pop concept photo, full-body character reference sheet photo, photorealistic, 85mm lens, sharp focus on the face, natural skin texture, even soft studio lighting, seamless light grey backdrop, no props. A fictional adult Korean woman in her early twenties, petite build, small delicate face, gentle doe eyes, shoulder-length ash-brown bob with curtain bangs, with several thin silver rings on both hands, wearing a fitted grey-white cropped polo shirt with a white collar, a light grey pleated mini skirt, white knee-high socks and glossy white loafers, clean retro-futuristic school uniform style. Standing straight facing the camera, arms relaxed at her sides, feet slightly apart, neutral friendly expression, entire body visible from head to shoes with a little space above the head.
```


## E · 手腕道具 · 拱门

**第一套服装（c1）** → `members/E_c1.png`

```
Professional K-pop concept photo, full-body character reference sheet photo, photorealistic, 85mm lens, sharp focus on the face, natural skin texture, even soft studio lighting, seamless light grey backdrop, no props. A fictional adult Korean woman in her early twenties, athletic build, defined jawline, bright confident eyes, dark brown hair in a high sleek ponytail, with a white ring-shaped wrist device on her left wrist, wearing an oversized white cropped sweatshirt, baggy white jogger sweatpants and chunky white sneakers, monochrome all-white streetwear. Standing straight facing the camera, arms relaxed at her sides, feet slightly apart, neutral friendly expression, entire body visible from head to shoes with a little space above the head.
```

**第二套服装（c2），备用：直接文生** → `members/E_c2.png`

```
Professional K-pop concept photo, full-body character reference sheet photo, photorealistic, 85mm lens, sharp focus on the face, natural skin texture, even soft studio lighting, seamless light grey backdrop, no props. A fictional adult Korean woman in her early twenties, athletic build, defined jawline, bright confident eyes, dark brown hair in a high sleek ponytail, with a white ring-shaped wrist device on her left wrist, wearing a fitted grey-white cropped polo shirt with a white collar, a light grey pleated mini skirt, white knee-high socks and glossy white loafers, clean retro-futuristic school uniform style. Standing straight facing the camera, arms relaxed at her sides, feet slightly apart, neutral friendly expression, entire body visible from head to shoes with a little space above the head.
```


## F · 丝带俯拍 · 拱门前景

**第一套服装（c1）** → `members/F_c1.png`

```
Professional K-pop concept photo, full-body character reference sheet photo, photorealistic, 85mm lens, sharp focus on the face, natural skin texture, even soft studio lighting, seamless light grey backdrop, no props. A fictional adult Korean woman in her early twenties, tall build, heart-shaped face, soft dreamy eyes, very long straight black hair down to the waist, half-up with a white satin ribbon bow, with a white satin hair ribbon, wearing an oversized white cropped sweatshirt, baggy white jogger sweatpants and chunky white sneakers, monochrome all-white streetwear. Standing straight facing the camera, arms relaxed at her sides, feet slightly apart, neutral friendly expression, entire body visible from head to shoes with a little space above the head.
```

**第二套服装（c2），备用：直接文生** → `members/F_c2.png`

```
Professional K-pop concept photo, full-body character reference sheet photo, photorealistic, 85mm lens, sharp focus on the face, natural skin texture, even soft studio lighting, seamless light grey backdrop, no props. A fictional adult Korean woman in her early twenties, tall build, heart-shaped face, soft dreamy eyes, very long straight black hair down to the waist, half-up with a white satin ribbon bow, with a white satin hair ribbon, wearing a fitted grey-white cropped polo shirt with a white collar, a light grey pleated mini skirt, white knee-high socks and glossy white loafers, clean retro-futuristic school uniform style. Standing straight facing the camera, arms relaxed at her sides, feet slightly apart, neutral friendly expression, entire body visible from head to shoes with a little space above the head.
```


## G · 发光小球 · 闯关路径

**第一套服装（c1）** → `members/G_c1.png`

```
Professional K-pop concept photo, full-body character reference sheet photo, photorealistic, 85mm lens, sharp focus on the face, natural skin texture, even soft studio lighting, seamless light grey backdrop, no props. A fictional adult Korean woman in her early twenties, medium height, playful upturned eyes, light freckles across the nose, long layered honey-blonde hair, with a single silver ear cuff on her right ear, wearing an oversized white cropped sweatshirt, baggy white jogger sweatpants and chunky white sneakers, monochrome all-white streetwear. Standing straight facing the camera, arms relaxed at her sides, feet slightly apart, neutral friendly expression, entire body visible from head to shoes with a little space above the head.
```

**第二套服装（c2），备用：直接文生** → `members/G_c2.png`

```
Professional K-pop concept photo, full-body character reference sheet photo, photorealistic, 85mm lens, sharp focus on the face, natural skin texture, even soft studio lighting, seamless light grey backdrop, no props. A fictional adult Korean woman in her early twenties, medium height, playful upturned eyes, light freckles across the nose, long layered honey-blonde hair, with a single silver ear cuff on her right ear, wearing a fitted grey-white cropped polo shirt with a white collar, a light grey pleated mini skirt, white knee-high socks and glossy white loafers, clean retro-futuristic school uniform style. Standing straight facing the camera, arms relaxed at her sides, feet slightly apart, neutral friendly expression, entire body visible from head to shoes with a little space above the head.
```


## H · 水晶 · 推滚轮 · 踩节点

**第一套服装（c1）** → `members/H_c1.png`

```
Professional K-pop concept photo, full-body character reference sheet photo, photorealistic, 85mm lens, sharp focus on the face, natural skin texture, even soft studio lighting, seamless light grey backdrop, no props. A fictional adult Korean woman in her early twenties, petite build, round face, soft round eyes, dark brown hair styled in two low buns with loose face-framing strands, with small white star hair clips, wearing an oversized white cropped sweatshirt, baggy white jogger sweatpants and chunky white sneakers, monochrome all-white streetwear. Standing straight facing the camera, arms relaxed at her sides, feet slightly apart, neutral friendly expression, entire body visible from head to shoes with a little space above the head.
```

**第二套服装（c2），备用：直接文生** → `members/H_c2.png`

```
Professional K-pop concept photo, full-body character reference sheet photo, photorealistic, 85mm lens, sharp focus on the face, natural skin texture, even soft studio lighting, seamless light grey backdrop, no props. A fictional adult Korean woman in her early twenties, petite build, round face, soft round eyes, dark brown hair styled in two low buns with loose face-framing strands, with small white star hair clips, wearing a fitted grey-white cropped polo shirt with a white collar, a light grey pleated mini skirt, white knee-high socks and glossy white loafers, clean retro-futuristic school uniform style. Standing straight facing the camera, arms relaxed at her sides, feet slightly apart, neutral friendly expression, entire body visible from head to shoes with a little space above the head.
```


## I · 旋转入画 · 回眸笑

**第二套服装（c2）** → `members/I_c2.png`

```
Professional K-pop concept photo, full-body character reference sheet photo, photorealistic, 85mm lens, sharp focus on the face, natural skin texture, even soft studio lighting, seamless light grey backdrop, no props. A fictional adult Korean woman in her early twenties, medium height, bright cheerful face, wide smile, long chestnut-ginger hair with soft loose waves, with a thin red string bracelet, wearing a fitted grey-white cropped polo shirt with a white collar, a light grey pleated mini skirt, white knee-high socks and glossy white loafers, clean retro-futuristic school uniform style. Standing straight facing the camera, arms relaxed at her sides, feet slightly apart, neutral friendly expression, entire body visible from head to shoes with a little space above the head.
```


## J · 伏地圆环 · 脚尖点地

**第二套服装（c2）** → `members/J_c2.png`

```
Professional K-pop concept photo, full-body character reference sheet photo, photorealistic, 85mm lens, sharp focus on the face, natural skin texture, even soft studio lighting, seamless light grey backdrop, no props. A fictional adult Korean woman in her early twenties, lean dancer build, cat-like eyes, defined brows, jaw-length glossy black hair with see-through bangs, with small black stud earrings, wearing a fitted grey-white cropped polo shirt with a white collar, a light grey pleated mini skirt, white knee-high socks and glossy white loafers, clean retro-futuristic school uniform style. Standing straight facing the camera, arms relaxed at her sides, feet slightly apart, neutral friendly expression, entire body visible from head to shoes with a little space above the head.
```


## K · 扶梯 · 圆孔开门 · 撞色双人

**第二套服装（c2）** → `members/K_c2.png`

```
Professional K-pop concept photo, full-body character reference sheet photo, photorealistic, 85mm lens, sharp focus on the face, natural skin texture, even soft studio lighting, seamless light grey backdrop, no props. A fictional adult Korean woman in her early twenties, tall slim build, cool composed expression, fine features, long straight platinum-silver hair, with a silver bar necklace, wearing a fitted grey-white cropped polo shirt with a white collar, a light grey pleated mini skirt, white knee-high socks and glossy white loafers, clean retro-futuristic school uniform style. Standing straight facing the camera, arms relaxed at her sides, feet slightly apart, neutral friendly expression, entire body visible from head to shoes with a little space above the head.
```


## L · 倒挂入画 · 撞色双人

**第二套服装（c2）** → `members/L_c2.png`

```
Professional K-pop concept photo, full-body character reference sheet photo, photorealistic, 85mm lens, sharp focus on the face, natural skin texture, even soft studio lighting, seamless light grey backdrop, no props. A fictional adult Korean woman in her early twenties, medium height, sweet oval face, lively eyes, long dark brown hair with a hidden pastel-pink underlayer that shows when she moves, with a pink hair tie on her wrist, wearing a fitted grey-white cropped polo shirt with a white collar, a light grey pleated mini skirt, white knee-high socks and glossy white loafers, clean retro-futuristic school uniform style. Standing straight facing the camera, arms relaxed at her sides, feet slightly apart, neutral friendly expression, entire body visible from head to shoes with a little space above the head.
```

## 全员合影

**c1** → `group/group_c1.png`（2688×1536）

```
Professional K-pop group concept photo, twelve fictional adult Korean women in their early twenties standing in one straight line, full bodies visible, evenly spaced, facing the camera, seamless light grey backdrop, even soft studio lighting, photorealistic. All of them wearing an oversized white cropped sweatshirt, baggy white jogger sweatpants and chunky white sneakers, monochrome all-white streetwear. From left to right — A: oval face, sharp almond-shaped eyes, a small beauty mark under her left eye, long straight jet-black hair falling past the chest with soft see-through bangs; B: round soft face, big warm eyes, dimples when smiling, long wavy copper-auburn hair with a deep side part; C: elegant long neck, high cheekbones, calm monolid eyes, long sleek black hair with a sharp centre part tucked behind the ears; D: small delicate face, gentle doe eyes, shoulder-length ash-brown bob with curtain bangs; E: defined jawline, bright confident eyes, dark brown hair in a high sleek ponytail; F: heart-shaped face, soft dreamy eyes, very long straight black hair down to the waist, half-up with a white satin ribbon bow; G: playful upturned eyes, light freckles across the nose, long layered honey-blonde hair; H: round face, soft round eyes, dark brown hair styled in two low buns with loose face-framing strands; I: bright cheerful face, wide smile, long chestnut-ginger hair with soft loose waves; J: cat-like eyes, defined brows, jaw-length glossy black hair with see-through bangs; K: cool composed expression, fine features, long straight platinum-silver hair; L: sweet oval face, lively eyes, long dark brown hair with a hidden pastel-pink underlayer that shows when she moves.
```

> 直接文生 12 人很难每个人都准，更稳的做法是把 12 张定妆照排进一张宽图，再用图像编辑模型统一光线和地面阴影。

**c2** → `group/group_c2.png`（2688×1536）

```
Professional K-pop group concept photo, twelve fictional adult Korean women in their early twenties standing in one straight line, full bodies visible, evenly spaced, facing the camera, seamless light grey backdrop, even soft studio lighting, photorealistic. All of them wearing a fitted grey-white cropped polo shirt with a white collar, a light grey pleated mini skirt, white knee-high socks and glossy white loafers, clean retro-futuristic school uniform style. From left to right — A: oval face, sharp almond-shaped eyes, a small beauty mark under her left eye, long straight jet-black hair falling past the chest with soft see-through bangs; B: round soft face, big warm eyes, dimples when smiling, long wavy copper-auburn hair with a deep side part; C: elegant long neck, high cheekbones, calm monolid eyes, long sleek black hair with a sharp centre part tucked behind the ears; D: small delicate face, gentle doe eyes, shoulder-length ash-brown bob with curtain bangs; E: defined jawline, bright confident eyes, dark brown hair in a high sleek ponytail; F: heart-shaped face, soft dreamy eyes, very long straight black hair down to the waist, half-up with a white satin ribbon bow; G: playful upturned eyes, light freckles across the nose, long layered honey-blonde hair; H: round face, soft round eyes, dark brown hair styled in two low buns with loose face-framing strands; I: bright cheerful face, wide smile, long chestnut-ginger hair with soft loose waves; J: cat-like eyes, defined brows, jaw-length glossy black hair with see-through bangs; K: cool composed expression, fine features, long straight platinum-silver hair; L: sweet oval face, lively eyes, long dark brown hair with a hidden pastel-pink underlayer that shows when she moves.
```

> 直接文生 12 人很难每个人都准，更稳的做法是把 12 张定妆照排进一张宽图，再用图像编辑模型统一光线和地面阴影。

## 尾帧 · 首尾呼应

→ `keyframes/end_AB_L.png`（1344×768）

```
Cinematic K-pop music video still, 16:9, deep electric-blue circular arena with glowing white rings and lines in the soft-focus background, close-up of two fictional adult Korean women side by side facing the camera, both making an 'L' hand sign near the face, confident smiles. Left: tall slim build, oval face, sharp almond-shaped eyes, a small beauty mark under her left eye, long straight jet-black hair falling past the chest with soft see-through bangs, with a thin silver chain choker. Right: medium height, round soft face, big warm eyes, dimples when smiling, long wavy copper-auburn hair with a deep side part, with small gold hoop earrings. Both wearing a fitted grey-white cropped polo shirt with a white collar, a light grey pleated mini skirt, white knee-high socks and glossy white loafers, clean retro-futuristic school uniform style. Cool blue key light with a soft white rim light, photorealistic, shallow depth of field.
```

> 用 A_c2、B_c2 当参考图做图像编辑或多图参考生成，脸会更准；出图后裁成正好 1344×768。
