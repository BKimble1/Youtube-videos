#!/usr/bin/env python3
"""Caption contrast on the real renders: for the middle of every caption window, compare the captioned frame with the clean
frame (same moment). The difference marks the caption (glyph fill + dark outline + soft shadow); then it measures
  * glyph fill vs the dark outline pixels that touch it (the contrast that makes it readable on any picture), and
  * glyph fill vs the picture just beyond the shadow (what the viewer would see without any outline).
usage: python3 tools/caption_contrast.py <captioned.mp4> <clean.mp4> <out.json>"""
import json, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image
from PIL import ImageFilter
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
cap_v, clean_v, out = sys.argv[1], sys.argv[2], sys.argv[3]
# caption windows from the shared caption chunker (via the TS source) are heavy to import; derive them from the captioned vs clean
# difference instead: sample every 3rd frame and keep frames whose lane region differs.
W, H = 1080, 1920
def frames(path, step=3):
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', path, '-vf', f'select=not(mod(n\\,{step})),scale={W}:{H}', '-vsync', '0', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    n = W * H * 3
    i = 0
    while True:
        b = p.stdout.read(n)
        if len(b) < n: break
        yield i * step, np.frombuffer(b, np.uint8).reshape(H, W, 3)
        i += 1
def dil(m, r):
    # square dilation by r pixels (PIL max filter)
    im = Image.fromarray((m.astype(np.uint8)) * 255).filter(ImageFilter.MaxFilter(2 * r + 1))
    return np.asarray(im) > 0
def lum(a):
    c = a.astype(np.float32) / 255
    c = np.where(c <= 0.03928, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * c[..., 0] + 0.7152 * c[..., 1] + 0.0722 * c[..., 2]
rows = []
for (f, A), (_, B) in zip(frames(cap_v), frames(clean_v)):
    d = np.abs(A.astype(int) - B.astype(int)).max(axis=2)
    lane = np.zeros_like(d, bool); lane[1330:1580, 40:960] = True
    M = (d > 14) & lane
    if M.sum() < 800: continue
    LA = lum(A); LB = lum(B)
    glyph = M & (LA > 0.5) & (d > 60)
    if glyph.sum() < 300: continue
    dil = dil(glyph, 4)
    outline = dil & ~glyph & M & (LA < 0.12)
    ring = dil(M, 34) & ~dil(M, 16) & lane
    if outline.sum() < 100 or ring.sum() < 100: continue
    lt = float(np.median(LA[glyph])); lo = float(np.median(LA[outline])); lb = float(np.median(LB[ring]))
    hi_lo = lambda a, b: (max(a, b) + 0.05) / (min(a, b) + 0.05)
    rows.append({'frame': f, 'glyph_L': round(lt, 3), 'outline_L': round(lo, 3), 'bg_beyond_shadow_L': round(lb, 3), 'ratio_vs_outline': round(hi_lo(lt, lo), 1), 'ratio_vs_background': round(hi_lo(lt, lb), 2)})
res = {'frames_measured': len(rows), 'min_ratio_vs_outline': min(r['ratio_vs_outline'] for r in rows), 'min_ratio_vs_background': min(r['ratio_vs_background'] for r in rows),
       'median_ratio_vs_background': float(np.median([r['ratio_vs_background'] for r in rows])), 'worst_background_frames': sorted(rows, key=lambda r: r['ratio_vs_background'])[:8],
       'note': 'glyph = white/yellow fill; outline = the near-black stroke that touches it; background = the picture 16-34 px beyond the caption (outside the shadow). WCAG-style (L1+0.05)/(L2+0.05).'}
json.dump(res, open(out, 'w'), indent=1)
print(json.dumps({k: v for k, v in res.items() if k != 'worst_background_frames'}, indent=1))
