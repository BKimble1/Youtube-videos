"""Read Blender multilayer EXRs (Combined, UV, Depth) and tone-map scene-linear light for display."""
import numpy as np, OpenEXR

def read(path):
    f = OpenEXR.File(path)
    ch = {}
    for p in f.parts:
        for k, c in p.channels.items(): ch[k] = c.pixels
    out = {}
    for k, v in ch.items():
        if k.endswith('Combined'): out['rgb'] = v[..., :3].astype(np.float32)
        elif k.endswith('Depth.Z'): out['z'] = v.astype(np.float32)
    if 'ViewLayer.UV.U' in ch: out['uv'] = np.stack([ch['ViewLayer.UV.U'], ch['ViewLayer.UV.V']], -1).astype(np.float32)
    return out

def tonemap(rgb, exposure=0.0):
    """a gentle filmic curve (ACES-fitted shoulder) then sRGB; float 0..1"""
    x = np.maximum(rgb * (2.0 ** exposure), 0)
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    y = np.clip((x * (a * x + b)) / (x * (c * x + d) + e), 0, 1)
    return np.where(y <= 0.0031308, 12.92 * y, 1.055 * np.power(y, 1 / 2.4) - 0.055)
