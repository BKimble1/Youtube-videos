#!/usr/bin/env python3
"""Representative Shorts-UI LAYOUT overlay on key frames of the ENCODED V5 mp4, plus phone-width (360 px wide) crops of the caption lane.
This is an approximate layout check from the author's recollection of the Shorts player (top bar, right action rail, bottom channel/title block, progress bar); it is NOT
the live YouTube UI, which changes by device and version. The owner must still check the real player. Usage: python3 tools/ui_overlay_v5.py [video] [outdir]"""
import os, shutil, subprocess, sys
from PIL import Image, ImageDraw
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
X = sys.argv[1] if len(sys.argv) > 1 else f'{ROOT}/exports/v8/FGW_EarthStops_V5_Review_1080x1920.mp4'
OUT = sys.argv[2] if len(sys.argv) > 2 else f'{ROOT}/qa/v8'
FR = [0, 15, 22, 27, 36, 47, 201, 208, 236, 330, 390, 447, 575, 614]
d = '/tmp/fgw_v5ui'; shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
for f in FR:
    subprocess.run(['ffmpeg', '-v', 'error', '-i', X, '-vf', f'select=eq(n\\,{f})', '-vframes', '1', f'{d}/f{f:04d}.png'], check=True)
# hazard zones at 1080 x 1920 (x0, y0, x1, y1, label)
ZONES = [(0, 0, 1080, 170, 'top bar'), (930, 1060, 1080, 1780, 'right rail'), (0, 1650, 830, 1920, 'channel / title'), (0, 1895, 1080, 1920, 'progress')]
def over(im):
    ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); dr = ImageDraw.Draw(ov)
    for x0, y0, x1, y1, lab in ZONES:
        dr.rectangle([x0, y0, x1, y1], fill=(230, 40, 60, 90), outline=(230, 40, 60, 255), width=4)
        dr.text((x0 + 12, y0 + 10), lab, fill=(255, 255, 255, 255))
    dr.rectangle([0, 300, 1080, 620], outline=(40, 120, 255, 255), width=3)
    dr.text((12, 306), 'caption lane (y 300-620)', fill=(40, 120, 255, 255))
    return Image.alpha_composite(im.convert('RGBA'), ov).convert('RGB')
w, h = 270, 480
S = Image.new('RGB', (7 * w, 2 * h), (30, 30, 30))
for i, f in enumerate(FR):
    im = over(Image.open(f'{d}/f{f:04d}.png').convert('RGB')).resize((w, h), Image.LANCZOS)
    ImageDraw.Draw(im).text((4, 4), f'f{f}', fill=(255, 255, 255))
    S.paste(im, ((i % 7) * w, (i // 7) * h))
S.save(f'{OUT}/UI_OVERLAY_V5.png')
# phone-width crops (360 x 640 of the 1080 x 1920 frame = 1/3 scale, roughly a phone's CSS-pixel width) of the caption lane + labels, on the cues' hardest backgrounds
P = Image.new('RGB', (7 * 360, 640), (30, 30, 30))
for i, f in enumerate([0, 22, 36, 208, 330, 390, 447]):
    P.paste(Image.open(f'{d}/f{f:04d}.png').convert('RGB').resize((360, 640), Image.LANCZOS), (i * 360, 0))
P.save(f'{OUT}/PHONE_WIDTH_V5.png')
print('wrote', f'{OUT}/UI_OVERLAY_V5.png', f'{OUT}/PHONE_WIDTH_V5.png')
