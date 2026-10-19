import sys, numpy as np
from PIL import Image
D, tag, po, out = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
def load(p): return np.asarray(Image.open(p).convert('RGB')).astype(float)
bg = load(f'{D}/bg_{tag}.png')
ims = [load(f'{D}/u_{tag}_{po}_{l}.png') for l in ['full', 'mid', 'far']]
masks = [np.abs(i - bg).sum(axis=2) > 24 for i in ims]
def ov(a, b):
    o = np.zeros(a.shape + (3,), dtype=np.uint8)
    o[a & ~b] = [255, 60, 60]; o[b & ~a] = [60, 120, 255]; o[a & b] = [230, 230, 230]
    return o
row = np.concatenate([ims[0].astype(np.uint8), ims[1].astype(np.uint8), ims[2].astype(np.uint8), ov(masks[0], masks[2]), ov(masks[1], masks[2])], axis=1)
Image.fromarray(row).resize((row.shape[1] * 2, row.shape[0] * 2), Image.NEAREST).save(out)
