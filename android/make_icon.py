"""生成启动图标（场记板 + 播放三角），纯标准库 PNG 编码，各密度一份"""
import os, struct, zlib, math

def png(path, w, h, px):
    raw = b''.join(b'\x00' + bytes(px[y * w * 4:(y + 1) * w * 4]) for y in range(h))
    chunk = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))

def draw(S):
    ss = 4  # 超采样抗锯齿
    N = S * ss
    acc = [0.0] * (S * S * 4)
    BG, TEAL, AMBER, WHITE = (13, 21, 32), (63, 193, 165), (240, 160, 48), (232, 240, 246)
    def inside_round(x, y, x0, y0, x1, y1, r):
        cx = min(max(x, x0 + r), x1 - r); cy = min(max(y, y0 + r), y1 - r)
        return (x - cx) ** 2 + (y - cy) ** 2 <= r * r
    for Y in range(N):
        for X in range(N):
            u, v = (X + 0.5) / N, (Y + 0.5) / N
            col = None
            if inside_round(u, v, 0.04, 0.04, 0.96, 0.96, 0.2):
                col = BG
                # 场记板主体
                if 0.18 <= u <= 0.82 and 0.40 <= v <= 0.80:
                    col = TEAL
                    # 播放三角
                    tu, tv = (u - 0.43) / 0.2, (v - 0.60) / 0.13
                    if 0 <= tu <= 1 and abs(tv) <= 1 - tu: col = BG
                # 打板（斜条纹，略抬起）
                ang = math.radians(-12)
                ru = (u - 0.18) * math.cos(ang) - (v - 0.36) * math.sin(ang)
                rv = (u - 0.18) * math.sin(ang) + (v - 0.36) * math.cos(ang)
                if 0 <= ru <= 0.66 and -0.08 <= rv <= 0.0:
                    col = WHITE if int((ru + rv) / 0.11) % 2 == 0 else BG
                if 0.18 <= u <= 0.82 and 0.33 <= v <= 0.38:
                    col = AMBER
            if col:
                i = ((Y // ss) * S + X // ss) * 4
                acc[i] += col[0]; acc[i + 1] += col[1]; acc[i + 2] += col[2]; acc[i + 3] += 255
    k = ss * ss
    out = bytearray(S * S * 4)
    for p in range(S * S):
        a = acc[p * 4 + 3]
        if a:
            for c in range(3): out[p * 4 + c] = int(acc[p * 4 + c] / (a / 255))
            out[p * 4 + 3] = int(a / k)
    return out

for name, S in (('mdpi', 48), ('hdpi', 72), ('xhdpi', 96), ('xxhdpi', 144), ('xxxhdpi', 192)):
    d = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'res', 'mipmap-' + name)
    os.makedirs(d, exist_ok=True)
    png(os.path.join(d, 'ic_launcher.png'), S, S, draw(S))
print('icons ok')
