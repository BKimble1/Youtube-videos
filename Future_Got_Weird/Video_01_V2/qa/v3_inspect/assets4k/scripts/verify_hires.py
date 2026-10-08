"""Verify a 2x re-render against the original crop: same framing, same content.

usage: verify_hires.py original.png hires.png out_prefix
 - checks hires is exactly 2x the original's size (same proportions, same framing)
 - downsamples hires by an exact 2x2 box average and compares with the original (mean/max abs diff, PSNR,
   share of pixels off by > 32 levels, ink-mask IoU at threshold 128)
 - searches +/-3 px shifts of the downsample to show the best alignment is (0, 0)
 - writes <out_prefix>_overlay.png (original ink red, downsampled-hires ink cyan; overlap = dark) and
   <out_prefix>_diff.png (|diff| x 4) at original resolution.
"""
import sys
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
orig = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(np.float64)
hi = np.asarray(Image.open(sys.argv[2]).convert('RGB')).astype(np.float64)
out = sys.argv[3]
oh, ow = orig.shape[:2]
hh, hw = hi.shape[:2]
print(f'original {ow}x{oh} (aspect {ow/oh:.6f})  hires {hw}x{hh} (aspect {hw/hh:.6f})  scale {hw/ow:.4f} x {hh/oh:.4f}')
assert hw == 2 * ow and hh == 2 * oh, 'hires must be exactly 2x'
down = hi.reshape(oh, 2, ow, 2, 3).mean(axis=(1, 3))
d = np.abs(down - orig)
mse = (d ** 2).mean()
psnr = 10 * np.log10(255 ** 2 / mse) if mse > 0 else float('inf')
g_o = orig.mean(axis=2)
g_d = down.mean(axis=2)
ink_o = g_o < 128
ink_d = g_d < 128
iou = (ink_o & ink_d).sum() / max(1, (ink_o | ink_d).sum())
print(f'2x2-box downsample vs original: mean|d| {d.mean():.3f}  max|d| {d.max():.0f}  PSNR {psnr:.2f} dB  px off >32: {(d.max(axis=2) > 32).mean()*100:.3f}%  ink IoU {iou:.4f}  ink px {ink_o.sum()} vs {ink_d.sum()}')
best = None
for dy in range(-3, 4):
    for dx in range(-3, 4):
        a = g_o[3:-3, 3:-3]
        b = g_d[3 + dy:oh - 3 + dy, 3 + dx:ow - 3 + dx]
        e = np.abs(a - b).mean()
        if best is None or e < best[0]:
            best = (e, dx, dy)
print(f'best alignment shift (dx, dy) = ({best[1]}, {best[2]}), mean|d| there {best[0]:.3f}')
ov = np.full((oh, ow, 3), 255, np.uint8)
ov[ink_o & ~ink_d] = (230, 40, 40)
ov[ink_d & ~ink_o] = (0, 190, 220)
ov[ink_o & ink_d] = (20, 20, 20)
Image.fromarray(ov).save(out + '_overlay.png', optimize=True)
Image.fromarray(np.clip(d.max(axis=2) * 4, 0, 255).astype(np.uint8)).save(out + '_diff.png', optimize=True)
