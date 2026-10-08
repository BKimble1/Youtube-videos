"""Find where a crop image sits inside a page render (exact pixel search, then a full-crop check).

usage: findcrop.py crop.png page.png
Prints candidate offsets and the max/mean abs diff of the whole crop at each candidate.
"""
import sys
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
crop = np.asarray(Image.open(sys.argv[1]).convert('L'))
page = np.asarray(Image.open(sys.argv[2]).convert('L'))
ch, cw = crop.shape
ph, pw = page.shape
print('crop', cw, 'x', ch, ' page', pw, 'x', ph)

# pick a strongly inked row in the crop and a 96-px window on it with ink
ink_rows = np.argsort((crop < 128).sum(axis=1))[::-1]
found = []
for ry in ink_rows[:12]:
    row = crop[ry]
    xs = np.nonzero(row < 128)[0]
    if len(xs) == 0:
        continue
    x0 = max(0, xs[0] - 8)
    seg = row[x0:x0 + 96].tobytes()
    for py in range(ph):
        prow = page[py].tobytes()
        start = 0
        while True:
            i = prow.find(seg, start)
            if i < 0:
                break
            ox, oy = i - x0, py - ry
            if 0 <= ox and 0 <= oy and ox + cw <= pw and oy + ch <= ph:
                found.append((ox, oy))
            start = i + 1
    if found:
        break

cands = sorted(set(found))
print('candidates', cands[:10])
for ox, oy in cands[:10]:
    sub = page[oy:oy + ch, ox:ox + cw].astype(np.int16)
    d = np.abs(sub - crop.astype(np.int16))
    print('offset', ox, oy, 'box(x0,y0,x1,y1)=', (ox, oy, ox + cw, oy + ch), 'max', int(d.max()), 'mean', round(float(d.mean()), 5), 'diffpx', int((d > 0).sum()))
