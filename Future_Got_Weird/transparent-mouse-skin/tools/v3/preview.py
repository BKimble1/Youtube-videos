import sys, cv2, numpy as np
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from exr import read, tonemap
ims = []
for p in sys.argv[3:]:
    r = read(p)['rgb']; ims.append((tonemap(r, float(sys.argv[2]))[..., ::-1] * 255).astype(np.uint8))
cv2.imwrite(sys.argv[1], cv2.hconcat(ims) if len(ims) > 1 else ims[0])
