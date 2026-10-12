#!/usr/bin/env python3
"""Storyboard sheet: real frames of the built B01 hook (decoded from the encoded silent mp4) + SCHEMATIC panels for B02-B06 (drawn here, not rendered by Remotion).
Usage: python3 tools/storyboard_sheet.py  ->  script/storyboard/STORYBOARD_SHEET.png"""
import os, shutil, subprocess, textwrap
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = f'{ROOT}/exports/v3/FGW_EarthStops_Hook_H1_Silent_1080x1920.mp4'
TMP = os.environ.get('FGW_SB_TMP', '/tmp/fgw_sb_frames')
shutil.rmtree(TMP, ignore_errors=True); os.makedirs(TMP)
subprocess.run(['ffmpeg', '-v', 'error', '-i', SRC, '-vsync', '0', f'{TMP}/f%03d.png'], check=True)

CREAM, SAFF, TEAL, CORAL, INK = (250, 243, 223), (255, 199, 68), (28, 167, 160), (239, 107, 85), (22, 42, 50)
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
F = lambda s, b=True: ImageFont.truetype(BOLD if b else REG, s)

# ---- layout
M, G = 30, 14
FW, FH = 270, 480            # real frames
PW, PH = 324, 576            # schematic panels
W = M * 2 + 6 * FW + 5 * G   # 1680 + margins
H = 1460
S = Image.new('RGB', (W, H), (236, 232, 220))
d = ImageDraw.Draw(S)
d.text((M, 18), 'Earth Stops. You Don\'t. — storyboard sheet', font=F(30), fill=INK)
d.text((M, 58), 'Row 1: REAL frames of the built hook B01 (decoded from the encoded silent mp4).   Row 2: SCHEMATIC panels for B02–B06 — NOT built, NOT rendered; layout and idea only.', font=F(15, False), fill=INK)

# ---- row 1: real frames
y1 = 100
key = [(0, '0.00 s  f0'), (5, '0.17 s  f5  globe stops, lean begins'), (17, '0.57 s  f17  street full bleed'), (42, '1.40 s  f42  street still, tags'), (90, '3.00 s  f90  rewound: "before"'), (154, '5.13 s  f154  1,000 MPH')]
for i, (f, lab) in enumerate(key):
    x = M + i * (FW + G)
    im = Image.open(f'{TMP}/f{f + 1:03d}.png').convert('RGB').resize((FW, FH), Image.LANCZOS)
    S.paste(im, (x, y1))
    d.rectangle([x, y1, x + FW - 1, y1 + FH - 1], outline=INK, width=2)
    for j, ln in enumerate(textwrap.wrap(lab, 34)):
        d.text((x, y1 + FH + 6 + j * 16), ln, font=F(13), fill=INK)
d.text((M, y1 + FH + 44), 'B01 hook 0.0–6.0 s  ·  "What if Earth stopped—right now?" (0.03–2.17 s)  ·  "This street was moving east at about a thousand miles an hour." (2.74–5.83 s)', font=F(14), fill=INK)
d.text((M, y1 + FH + 64), 'ledger C00–C02  ·  Remotion  ·  BUILT, awaiting owner review', font=F(14), fill=INK)

# ---- row 2: schematic panels
y2 = y1 + FH + 100
def panel(i):
    x = M + i * (PW + 15)
    im = Image.new('RGB', (PW, PH), SAFF)
    return x, im, ImageDraw.Draw(im)
def chip(dr, cx, cy, text, w=None, fill=CREAM, size=16):
    f = F(size); tw = dr.textlength(text, font=f); w = w or tw + 22
    dr.rounded_rectangle([cx - w / 2 + 3, cy - 15 + 4, cx + w / 2 + 3, cy + 15 + 4], 9, fill=INK)
    dr.rounded_rectangle([cx - w / 2, cy - 15, cx + w / 2, cy + 15], 9, fill=fill, outline=INK, width=3)
    dr.text((cx - tw / 2, cy - 10), text, font=f, fill=INK)
def arrow(dr, x0, y, L, col=TEAL, w=6):
    dr.line([x0, y, x0 + L, y], fill=col, width=w); dr.polygon([(x0 + L + 12, y), (x0 + L - 2, y - 9), (x0 + L - 2, y + 9)], fill=col)
def globe(dr, cx, cy, r):
    dr.ellipse([cx - r, cy - r, cx + r, cy + r], fill=TEAL, outline=INK, width=3)
    dr.ellipse([cx - r * .5, cy - r * .5, cx + r * .1, cy + r * .1], fill=CREAM); dr.ellipse([cx + r * .1, cy, cx + r * .6, cy + r * .55], fill=CREAM)
    dr.line([cx - r, cy, cx + r, cy], fill=CORAL, width=2)
def ground(dr, y):
    dr.rectangle([0, y, PW, PH], fill=(171, 214, 211)); dr.rectangle([0, y - 34, PW, y], fill=CREAM); dr.line([0, y, PW, y], fill=CORAL, width=5)
def lamp(dr, x, y):
    dr.line([x, y, x, y - 120], fill=INK, width=5); dr.line([x, y - 120, x + 20, y - 120], fill=INK, width=5); dr.ellipse([x + 14, y - 126, x + 28, y - 114], fill=SAFF, outline=INK, width=2)
def palm(dr, x, y, lean=0):
    dr.line([x, y, x + lean, y - 130], fill=(190, 150, 90), width=7)
    for a in (-70, -35, 0, 35, 70):
        dr.line([x + lean, y - 130, x + lean + a, y - 118 + abs(a) * .1], fill=TEAL, width=7)
def person(dr, x, y, col=(60, 100, 190)):
    dr.ellipse([x - 9, y - 66, x + 9, y - 48], fill=(110, 70, 50), outline=INK, width=2); dr.rectangle([x - 11, y - 48, x + 11, y - 18], fill=col, outline=INK, width=2); dr.line([x - 6, y - 18, x - 8, y], fill=INK, width=4); dr.line([x + 6, y - 18, x + 8, y], fill=INK, width=4)
def cup(dr, x, y, s=1.0):
    dr.polygon([(x - 9 * s, y - 14 * s), (x + 9 * s, y - 14 * s), (x + 7 * s, y + 8 * s), (x - 7 * s, y + 8 * s)], fill=CORAL, outline=INK)
def tagging(dr, text):
    dr.rectangle([0, 0, PW, 22], fill=INK); dr.text((6, 3), text, font=F(12), fill=CREAM)

panels = []
# B02 shared motion
x, im, dr = panel(0); tagging(dr, 'SCHEMATIC · B02 shared motion')
chip(dr, PW // 2, 52, 'WHAT IF', 110); globe(dr, PW // 2, 160, 70)
ground(dr, 470); lamp(dr, 40, 470); palm(dr, 105, 470, 6); person(dr, 175, 470); cup(dr, 193, 440, .8); dr.rectangle([225, 424, 306, 470], fill=CREAM, outline=INK, width=3)
for ax in (22, 87, 157, 232):
    arrow(dr, ax, 300, 52)
chip(dr, PW // 2, 255, 'ALL MOVING EAST — TOGETHER', 300, size=13)
panels.append((x, im, 'B02  6.0–10.5 s', '"So was everything on it. You can\'t feel it, because it all moves together."', 'C01 C03 · Remotion · plan'))
# B03 bus
x, im, dr = panel(1); tagging(dr, 'SCHEMATIC · B03 bus (optional)')
chip(dr, PW // 2, 52, 'WHAT IF', 110); ground(dr, 470)
dr.rounded_rectangle([40, 340, 220, 452], 12, fill=TEAL, outline=INK, width=4)
for wx in (55, 100, 145, 185): dr.rectangle([wx, 354, wx + 30, 384], fill=CREAM, outline=INK, width=2)
for wx in (80, 175): dr.ellipse([wx - 17, 436, wx + 17, 470], fill=INK)
for k in range(3): dr.line([6, 365 + k * 26, 32, 365 + k * 26], fill=INK, width=3)
dr.line([290, 250, 290, 470], fill=INK, width=6)
cup(dr, 252, 392, 1.2); arrow(dr, 232, 340, 44, CORAL)
chip(dr, PW // 2, 250, 'BUS 0 · CUP →', 200, size=17)
panels.append((x, im, 'B03  10.5–15.5 s', '"Stop the ground, and it\'s a bus hitting the brakes. The bus stops. Everything loose doesn\'t."', 'C04 · Remotion · plan · optional cut'))
# B04 air and ocean
x, im, dr = panel(2); tagging(dr, 'SCHEMATIC · B04 air + ocean (optional)')
chip(dr, PW // 2, 52, 'WHAT IF', 110)
dr.rectangle([0, 360, PW, PH], fill=TEAL)
for yy in (385, 425, 470):
    for xx in range(0, PW, 36): dr.arc([xx, yy, xx + 36, yy + 20], 180, 360, fill=CREAM, width=3)
    arrow(dr, 40, yy + 30, 90 - (yy - 385) // 3, CREAM, 4)
dr.line([250, 300, 250, 520], fill=INK, width=9); dr.rectangle([232, 296, 268, 308], fill=INK)
palm(dr, 70, 360, 36); arrow(dr, 100, 200, 60); arrow(dr, 100, 232, 40)
dr.ellipse([140, 372, 164, 396], fill=CORAL, outline=INK, width=3)
chip(dr, PW // 2, 150, 'AT FIRST', 150, size=18)
panels.append((x, im, 'B04  15.5–19.0 s', '"At first, the air keeps going. So does the ocean."', 'C05 · Remotion first · Runway HOLD · plan · optional cut'))
# B05 latitude
x, im, dr = panel(3); tagging(dr, 'SCHEMATIC · B05 latitude')
chip(dr, PW // 2, 52, 'WHAT IF', 110)
import math
cx, cy, R = PW // 2, 190, 110
dr.ellipse([cx - R, cy - R, cx + R, cy + R], fill=TEAL, outline=INK, width=3)
for lat in (40, 80):
    r = R * math.cos(math.radians(lat)); dr.ellipse([cx - r, cy - r, cx + r, cy + r], outline=CREAM, width=2)
dr.ellipse([cx - 4, cy - 4, cx + 4, cy + 4], fill=INK)
# eastward = counter-clockwise seen from above the North Pole: at the right-hand point each arrow points up, length ~ speed
for r, L in ((110, 70), (84, 54), (19, 12)):
    x0 = cx + r; dr.line([x0, cy, x0, cy - L], fill=CORAL if r < 30 else INK, width=6)
    dr.polygon([(x0, cy - L - 13), (x0 - 8, cy - L + 1), (x0 + 8, cy - L + 1)], fill=CORAL if r < 30 else INK)
dr.text((cx - 70, cy + 118), 'seen from above the N pole', font=F(11, False), fill=INK)
by = 355
for k, (v, lab) in enumerate(((1040, '0°  1,040'), (800, '40°  800'), (181, '80°  180 MPH'))):
    x1 = 20 + v * 0.24
    dr.rectangle([20, by + k * 46, x1, by + k * 46 + 28], fill=CORAL if k == 2 else TEAL, outline=INK, width=2)
    if k < 2: dr.text((26, by + k * 46 + 5), lab, font=F(14), fill=CREAM)
    else: dr.text((x1 + 8, by + k * 46 + 5), lab, font=F(14), fill=INK)
xl = 20 + 157 * 0.24
for yy in range(by - 8, by + 3 * 46, 10): dr.line([xl, yy, xl, yy + 5], fill=INK, width=2)
dr.text((xl + 6, by - 26), '157 = CATEGORY 5', font=F(12), fill=INK)
chip(dr, PW // 2, 520, 'STARTING SPEED ONLY', 250, size=14)
panels.append((x, im, 'B05  19.0–24.0 s', '"Farther from the equator, it\'s slower—but even at eighty degrees north, that\'s hurricane speed."', 'C06 C07 C13 · Remotion · plan'))
# B06 callback
x, im, dr = panel(4); tagging(dr, 'SCHEMATIC · B06 callback + loop')
globe(dr, 262, 80, 40); dr.text((222, 126), 'turns again', font=F(11, False), fill=INK)
ground(dr, 470); dr.rectangle([60, 360, 260, 376], fill=(190, 150, 90), outline=INK, width=3); dr.line([90, 376, 90, 470], fill=INK, width=5); dr.line([230, 376, 230, 470], fill=INK, width=5)
cup(dr, 160, 340, 2.2)
for k in (-12, 0, 12): dr.arc([150 + k, 262, 168 + k, 300], 200, 340, fill=INK, width=3)
chip(dr, PW // 2, 196, 'It just never spilled.', 290, size=16)
dr.text((20, 120), '"WHAT IF" tag has left', font=F(12), fill=INK)
dr.text((20, 520), '↻  last frame = hook frame 0', font=F(14), fill=INK)
panels.append((x, im, 'B06  24.0–32.0 s', '"None of this can really happen. But the motion is real: her coffee\'s been doing a thousand miles an hour all along. It just never spilled."', 'C08–C10 · Remotion · plan'))

for (x, im, t, vo, meta) in panels:
    S.paste(im, (x, y2)); d.rectangle([x, y2, x + PW - 1, y2 + PH - 1], outline=INK, width=2)
    d.text((x, y2 + PH + 8), t, font=F(15), fill=INK)
    for j, ln in enumerate(textwrap.wrap(vo, 40)):
        d.text((x, y2 + PH + 30 + j * 16), ln, font=F(12, False), fill=INK)
    for j, ln in enumerate(textwrap.wrap(meta, 44)):
        d.text((x, y2 + PH + 30 + 16 * 5 + j * 14), ln, font=F(11), fill=INK)
# 5 panels of 324 + 4*15 = 1680 -> sixth slot: key / notes
x6 = M + 5 * (PW + 15)
if x6 + 60 < W:
    pass
d.text((M, H - 36), 'Estimated times for B02–B06 are text-length estimates, not measured audio.  Total ≈ 32 s (≈ 27 s without B03, ≈ 29 s without B04, ≈ 24 s without both).  Runway: HOLD.  Music: HOLD.', font=F(14), fill=INK)
os.makedirs(f'{ROOT}/script/storyboard', exist_ok=True)
S.save(f'{ROOT}/script/storyboard/STORYBOARD_SHEET.png')
print('saved', S.size)
