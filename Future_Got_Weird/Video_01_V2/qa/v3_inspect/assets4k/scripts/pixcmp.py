"""Pixel comparison of two same-size images: prints max/mean abs diff and count of differing pixels."""
import sys
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
a = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(np.int16)
b = np.asarray(Image.open(sys.argv[2]).convert('RGB')).astype(np.int16)
print('shapes', a.shape, b.shape)
if a.shape != b.shape:
    sys.exit(1)
d = np.abs(a - b)
nz = (d.max(axis=2) > 0)
print('max', int(d.max()), 'mean', float(d.mean()), 'diff_px', int(nz.sum()), 'of', nz.size)
if nz.any():
    ys, xs = np.nonzero(nz)
    print('diff bbox', xs.min(), ys.min(), xs.max(), ys.max())
