#!/usr/bin/env python3
"""Contact sheets and a phone-size interface check from an encoded video (decoded frames, not stills).

sheets : every STEP-th frame, labelled with frame number and time, 8 x 5 per sheet
phone  : chosen frames at 360x640 with an APPROXIMATE Shorts interface overlay (right action column,
         bottom title/channel block, top bar). The overlay geometry is an estimate, not the platform spec.
Usage: python3 tools/qa_sheets.py video.mp4 outdir [step] [phone_frames comma list]"""
import subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

vid, out = sys.argv[1], Path(sys.argv[2])
step = int(sys.argv[3]) if len(sys.argv) > 3 else 6
phone = [int(x) for x in sys.argv[4].split(',')] if len(sys.argv) > 4 else []
out.mkdir(parents=True, exist_ok=True)
TW, TH = 216, 384
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', vid, '-vf', f'scale={TW}:{TH}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, TH, TW, 3)
idx = list(range(0, len(fr), step))
per = 40
for s in range(0, len(idx), per):
    chunk = idx[s:s + per]
    sheet = Image.new('RGB', (TW * 8, (TH + 18) * 5), 'white')
    d = ImageDraw.Draw(sheet)
    for k, i in enumerate(chunk):
        x, y = (k % 8) * TW, (k // 8) * (TH + 18)
        sheet.paste(Image.fromarray(fr[i]), (x, y + 18))
        d.text((x + 4, y + 3), f'f{i}  {i / 30:.2f}s', fill='black')
    sheet.save(out / f'sheet_{s // per:02d}_f{chunk[0]:04d}-{chunk[-1]:04d}.jpg', quality=88)
if phone:
    PW, PH = 360, 640
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', vid, '-vf', f'scale={PW}:{PH}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
    pf = np.frombuffer(raw, np.uint8).reshape(-1, PH, PW, 3)
    sheet = Image.new('RGB', (PW * min(6, len(phone)), (PH + 20) * ((len(phone) + 5) // 6)), 'white')
    for k, i in enumerate(phone):
        im = Image.fromarray(pf[i]).convert('RGBA')
        ov = Image.new('RGBA', im.size, (0, 0, 0, 0))
        o = ImageDraw.Draw(ov)
        sx = PW / 1080
        o.rectangle([960 * sx, 1010 * sx, 1070 * sx, 1640 * sx], fill=(255, 0, 255, 70))   # action column (approx.)
        o.rectangle([0, 1560 * sx, 900 * sx, 1860 * sx], fill=(255, 0, 255, 55))          # title / channel block (approx.)
        o.rectangle([0, 0, PW, 130 * sx], fill=(255, 0, 255, 40))                         # top bar (approx.)
        o.rectangle([90 * sx, 180 * sx, 900 * sx, 1480 * sx], outline=(0, 200, 255, 160))  # brief's working area
        im = Image.alpha_composite(im, ov).convert('RGB')
        x, y = (k % 6) * PW, (k // 6) * (PH + 20)
        sheet.paste(im, (x, y + 20))
        ImageDraw.Draw(sheet).text((x + 4, y + 4), f'f{i}', fill='black')
    sheet.save(out / 'phone_ui_overlay.jpg', quality=88)
print('wrote', out)
