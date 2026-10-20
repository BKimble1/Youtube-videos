#!/usr/bin/env python3
"""Per-shot review sheets: 3 frames (start+2, middle, end-3) of each shot of V4, two shots per image.
usage: python3 tools/shotsheet.py <outdir> [comp=TelepathyFlawV4Clean]"""
import subprocess, sys, re, json
from pathlib import Path
from PIL import Image, ImageDraw
ROOT = Path(__file__).resolve().parents[1]
out = (ROOT / sys.argv[1]).resolve(); comp = sys.argv[2] if len(sys.argv) > 2 else 'TelepathyFlawV4Clean'
src = (ROOT / 'source/src/v4/plan4.ts').read_text()
cuts = [(m.group(1), float(m.group(2))) for m in re.finditer(r"\['(\w+)', ([\d.]+), '", src)]
shots = []
for i, (sid, a) in enumerate(cuts):
    b = cuts[i + 1][1] if i + 1 < len(cuts) else 28.0
    fa, fb = round(a * 30), round(b * 30)
    fr = sorted({min(fb - 1, fa + 2), (fa + fb) // 2, max(fa, fb - 3)})
    shots.append((sid, a, b, fr))
allf = sorted({f for s in shots for f in s[3]})
out.mkdir(parents=True, exist_ok=True)
subprocess.run(['node', 'scripts/frames.mjs', str(out), comp, ','.join(map(str, allf)), '1'], cwd=ROOT / 'source', check=True, capture_output=True)
tw, th = 360, 640
for k in range(0, len(shots), 2):
    grp = shots[k:k + 2]
    S = Image.new('RGB', (tw * 6, th + 22), 'white')
    d = ImageDraw.Draw(S)
    for g, (sid, a, b, fr) in enumerate(grp):
        for j, f in enumerate(fr):
            im = Image.open(out / f'{comp}_{f:04d}.png').resize((tw, th))
            x = (g * 3 + j) * tw
            S.paste(im, (x, 22))
            d.text((x + 4, 4), f'{sid}  f{f} {f / 30:.2f}s  [{a:.2f}-{b:.2f}]', fill='black')
    S.save(out / f'shots_{k // 2:02d}.png')
print(len(shots), 'shots,', len(allf), 'frames')
