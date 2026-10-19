import sys, glob, os, numpy as np
from PIL import Image
D = sys.argv[1]
def load(p): return np.asarray(Image.open(p).convert('RGB')).astype(float)
rows = []
for bgp in sorted(glob.glob(f'{D}/bg_*.png')):
    tag = os.path.basename(bgp)[3:-4]
    bg = load(bgp)
    for po in ['idle', 'guard']:
        res = {}
        for lod in ['full', 'mid', 'far']:
            p = f'{D}/u_{tag}_{po}_{lod}.png'
            if not os.path.exists(p): continue
            im = load(p)
            m = np.abs(im - bg).sum(axis=2) > 24
            res[lod] = (im, m)
        if len(res) < 3: continue
        ys, xs = np.nonzero(res['full'][1])
        def stats(l):
            im, m = res[l]
            area = m.sum()
            mean = im[m].mean(axis=0) if area else np.zeros(3)
            return area, mean
        af, mf = stats('full'); am, mm = stats('mid'); ar, mr = stats('far')
        def iou(a, b): return (res[a][1] & res[b][1]).sum() / max(1, (res[a][1] | res[b][1]).sum())
        lum = lambda c: 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
        rows.append((tag, po, af, am, ar, iou('full', 'mid'), iou('mid', 'far'), iou('full', 'far'), lum(mf), lum(mm), lum(mr)))
print('case                       area f/m/r        IoU f-m  m-far  f-far   lum f / m / far')
for r in rows:
    print(f'{r[0]:12s}{r[1]:6s} {r[2]:6d} {r[3]:6d} {r[4]:6d}   {r[5]:.2f}   {r[6]:.2f}   {r[7]:.2f}   {r[8]:.0f} / {r[9]:.0f} / {r[10]:.0f}')
a = np.array([[r[5], r[6], r[7], r[8], r[9], r[10]] for r in rows])
print('MEAN IoU f-m %.3f m-far %.3f f-far %.3f | lum f %.1f m %.1f far %.1f' % tuple(a.mean(axis=0)))
