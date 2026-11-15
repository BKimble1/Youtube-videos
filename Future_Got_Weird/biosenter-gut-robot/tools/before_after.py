#!/usr/bin/env python3
"""Before/after frame sequences for the repaired continuity defects: the same frames from V3 (top row) and V4 (bottom
row), cropped at native resolution on the defect; plus one-frame-flicker maps (motion-compensated, DIS flow) for the
wall fix, which is a texture-swim that a still cannot show.
usage: python3 tools/before_after.py <v3.mp4> <v4.mp4> <out_dir>"""
import os, subprocess, sys
import numpy as np, cv2
from PIL import Image, ImageDraw
v3, v4, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)

def frames(src, idx):
    idx = sorted(set(idx))
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vf', f"select='{'+'.join(f'eq(n,{i})' for i in idx)}'", '-vsync', '0', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                         capture_output=True, check=True).stdout
    return dict(zip(idx, np.frombuffer(raw, np.uint8).reshape(-1, 1920, 1080, 3)))

def strip(name, title, idx, box, cell=200):
    x0, y0, w, h = box
    A, B = frames(v3, idx), frames(v4, idx)
    ch = int(cell * h / w)
    im = Image.new('RGB', (cell * len(idx), ch * 2 + 40), (14, 14, 14)); d = ImageDraw.Draw(im)
    d.text((6, 4), title, fill=(255, 230, 0))
    for k, f in enumerate(idx):
        for r, F in enumerate((A, B)):
            im.paste(Image.fromarray(F[f][y0:y0 + h, x0:x0 + w]).resize((cell, ch)), (k * cell, 22 + r * (ch + 18)))
            d.text((k * cell + 4, 22 + r * (ch + 18) + ch + 3), f'{"V3" if r == 0 else "V4"} f{f} {f / 30:.2f}s', fill=(220, 220, 220))
    im.save(os.path.join(out, name))

def flicker_map(src, t, H=960, W=540):
    F = frames(src, [t - 1, t, t + 1])
    sm = {k: cv2.resize(v, (W, H), interpolation=cv2.INTER_AREA) for k, v in F.items()}
    G = {k: cv2.cvtColor(v, cv2.COLOR_RGB2GRAY) for k, v in sm.items()}
    dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    dis.setFinestScale(0); dis.setPatchSize(12); dis.setPatchStride(4); dis.setGradientDescentIterations(25); dis.setVariationalRefinementIterations(10)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    def res(s):
        fl = dis.calc(G[t], G[s], None)
        w = cv2.remap(sm[s].astype(np.float32), xx + fl[..., 0], yy + fl[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        return np.abs(sm[t].astype(np.float32) - w).mean(2)
    m = np.minimum(res(t - 1), res(t + 1))
    heat = cv2.applyColorMap((np.clip(m / 25, 0, 1) * 255).astype(np.uint8), cv2.COLORMAP_INFERNO)[..., ::-1]
    return sm[t], heat, float(np.percentile(m, 99))

def flicker_sheet(name, title, ts):
    cell = 216
    im = Image.new('RGB', (cell * 4, int(cell * 16 / 9) * len(ts) + 26), (14, 14, 14)); d = ImageDraw.Draw(im)
    d.text((6, 6), title, fill=(255, 230, 0))
    for r, t in enumerate(ts):
        y = 26 + r * int(cell * 16 / 9)
        for c, (src, lab) in enumerate(((v3, 'V3'), (v4, 'V4'))):
            fr, heat, p99 = flicker_map(src, t)
            im.paste(Image.fromarray(fr).resize((cell, int(cell * 16 / 9))), (c * 2 * cell, y))
            im.paste(Image.fromarray(heat).resize((cell, int(cell * 16 / 9))), (c * 2 * cell + cell, y))
            d.text((c * 2 * cell + 4, y + 4), f'{lab} f{t} {t / 30:.2f}s  flicker p99 {p99:.1f}', fill=(255, 255, 255))
    im.save(os.path.join(out, name))

strip('A_collar_flicker_f085-090.png', 'A. Collar ring texture flicker (hatched patch): V3 top, V4 bottom', list(range(85, 91)), (180, 480, 360, 360))
strip('A_collar_flicker_f298-303.png', 'A. Collar ring texture flicker (cutaway cycle): V3 top, V4 bottom', list(range(298, 304)), (220, 700, 320, 320))
strip('A_collar_flicker_f617-622.png', 'A. Collar ring texture flicker (lab): V3 top, V4 bottom', list(range(617, 623)), (150, 440, 320, 320))
strip('B_biopsy_retract_f530-543.png', 'B. Biopsy instrument: V3 vanishes in the open at f542; V4 retracts into the channel', list(range(530, 544)), (0, 300, 540, 620), 150)
strip('C_spray_emerge_f543-551.png', 'C. Spray catheter: V3 nozzle pops in at the mouth; V4 slides out of the channel', list(range(543, 552)), (0, 150, 540, 620), 150)
strip('D_loop_order_f686-692.png', 'D. Neighbouring gut loop draw-order swap (wide ending): V3 top, V4 bottom', list(range(686, 693)), (700, 760, 360, 360))
flicker_sheet('E_wall_flicker_maps.png', 'E. One-frame-flicker maps (motion-compensated): V3 left pair, V4 right pair. Bright = changes no motion explains',
              [20, 140, 270, 700])
print('written to', out)
