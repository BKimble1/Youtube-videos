#!/usr/bin/env python3
"""V3 skin textures (numpy), in the skin patch's UV space: x -22..22 mm, y -35..35 mm at 0.015 mm/px.
Outputs (to <cache>/tex): albedo.png (16-bit sRGB), height.png (16-bit, 0.5 = surface), rough.png, shave.png (1 = shaved),
and stubs.npy / fur.npy (follicle positions in mm with their lie directions) used by the scene for hair curves.
Mouse ventral skin: thin and pale pink, a fine polygonal crease network (finer across the body than along it),
follicles at ~12/mm^2 in the shaved area, faint dermal capillaries."""
import os, sys
import numpy as np, cv2
from scipy import ndimage as ndi

X0, X1, Y0, Y1 = -22.0, 22.0, -35.0, 35.0
PX = 0.015
W, H = int(round((X1 - X0) / PX)), int(round((Y1 - Y0) / PX))
rng = np.random.default_rng(7)

def to_px(x, y):  # mm -> pixel (row 0 = y1: image top is the head end)
    return (x - X0) / PX, (Y1 - y) / PX

def fbm(shape, scale_px, octaves=4, seed=0):
    r = np.random.default_rng(seed); out = np.zeros(shape, np.float32); a = 1.0; s = scale_px; tot = 0
    for _ in range(octaves):
        h, w = max(2, int(shape[0] / s) + 3), max(2, int(shape[1] / s) + 3)
        n = r.standard_normal((h, w)).astype(np.float32)
        out += a * cv2.resize(n, (shape[1], shape[0]), interpolation=cv2.INTER_CUBIC); tot += a
        a *= 0.5; s /= 2
    return out / tot

def crease_net(cell_mm, aniso, seed, keep=0.6, jitter=1.0):
    """a polygonal crease network: grooves along cell borders, each border with its own depth, many dropped"""
    r = np.random.default_rng(seed)
    sx, sy = cell_mm * aniso, cell_mm / aniso
    nx, ny = int((X1 - X0) / sx) + 2, int((Y1 - Y0) / sy) + 2
    gx, gy = np.meshgrid(np.arange(nx) * sx + X0, np.arange(ny) * sy + Y0)
    px = gx + (r.random(gx.shape) - 0.5) * sx * jitter; py = gy + (r.random(gy.shape) - 0.5) * sy * jitter
    u, v = to_px(px.ravel(), py.ravel())
    seeds = np.zeros((H, W), bool)
    ok = (u >= 0) & (u < W) & (v >= 0) & (v < H)
    seeds[v[ok].astype(int), u[ok].astype(int)] = True
    lab, n = ndi.label(seeds)
    _, (iy, ix) = ndi.distance_transform_edt(~seeds, return_indices=True)
    L = lab[iy, ix]
    hv = r.random(n + 1).astype(np.float32)
    out = np.zeros((H, W), np.float32)
    for sh in [(1, 0), (0, 1)]:
        L2 = np.roll(L, sh[0], 0) if sh[0] else np.roll(L, sh[1], 1)
        e = L != L2
        # a border's depth from the pair of cells it separates (symmetric hash)
        a, b = np.minimum(L, L2), np.maximum(L, L2)
        hsh = np.modf((a * 0.6180339 + b * 0.4142135) * 7.31)[0].astype(np.float32)
        w = np.clip((hsh - (1 - keep)) / keep, 0, 1) ** 0.7
        out = np.maximum(out, e * w)
    return out

def main(cache):
    os.makedirs(os.path.join(cache, 'tex'), exist_ok=True)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    xmm = X0 + xx * PX; ymm = Y1 - yy * PX
    # shave region: an irregular rounded patch, the clipped fur edge ragged at ~0.5 mm
    edge_n = fbm((H, W), 160, 3, 11) * 1.4 + fbm((H, W), 10, 2, 12) * 0.5
    rr = np.sqrt((xmm / 9.2) ** 2 + ((ymm + 1.0) / 19.0) ** 2) ** 1.0
    shave = np.clip((1.0 - rr) * 14.0 + edge_n * 0.45 + 0.5, 0, 1).astype(np.float32)
    shave = cv2.GaussianBlur(shave, (0, 0), 1.2)
    # micro-relief: a coarse and a fine crease network (cells wider across the body), plus soft undulation
    e1 = crease_net(0.55, 1.5, 1, keep=0.55); e2 = crease_net(0.2, 1.3, 2, keep=0.45)
    g1 = np.clip(cv2.GaussianBlur(e1, (0, 0), 1.6) * 2.2, 0, 1); g2 = np.clip(cv2.GaussianBlur(e2, (0, 0), 1.0) * 1.8, 0, 1)
    # fine transverse wrinkles (across the body), broken and wavy
    wn = cv2.resize(fbm((H // 4, W // 4), 40, 3, 21), (W, H))
    wav = np.sin((ymm * 2 * np.pi / 0.11) + wn * 9.0 + 3 * fbm((H, W), 200, 2, 22))
    wr = np.clip(1 - np.abs(wav), 0, 1) ** 6 * np.clip(fbm((H, W), 90, 3, 23) * 1.8 + 0.2, 0, 1)
    und = fbm((H, W), 260, 4, 3)
    height = 0.5 - 0.14 * g1 - 0.05 * g2 - 0.05 * wr + 0.06 * und
    # follicles in the shaved area (and under the fur): ~12 per mm^2, jittered grid
    dens = 12.0; step = 1 / np.sqrt(dens)
    fx, fy = np.meshgrid(np.arange(X0, X1, step), np.arange(Y0, Y1, step * 0.92))
    fx = fx + (rng.random(fx.shape) - 0.5) * step * 0.9; fy = fy + (rng.random(fy.shape) - 0.5) * step * 0.9
    fx, fy = fx.ravel(), fy.ravel()
    fu, fv = to_px(fx, fy)
    inb = (fu > 2) & (fu < W - 3) & (fv > 2) & (fv < H - 3)
    fx, fy, fu, fv = fx[inb], fy[inb], fu[inb], fv[inb]
    pits = np.zeros((H, W), np.float32)
    np.add.at(pits, (fv.astype(int), fu.astype(int)), 1.0)
    pits = np.clip(cv2.GaussianBlur(pits, (0, 0), 2.0) * 2 * np.pi * 2.0 ** 2, 0, 1)
    height -= 0.22 * pits
    # dermal capillaries: branching random walks, thin and faint
    cap = np.zeros((H, W), np.float32)
    for k in range(260):
        x, y = rng.uniform(X0, X1), rng.uniform(Y0, Y1); a = rng.uniform(0, 2 * np.pi); w = rng.uniform(0.6, 1.6)
        pts = []
        for s in range(rng.integers(30, 110)):
            a += rng.normal(0, 0.25); x += np.cos(a) * 0.09; y += np.sin(a) * 0.09; pts.append(to_px(x, y))
        p = np.array(pts, np.float32).reshape(-1, 1, 2) * 4
        cv2.polylines(cap, [p.astype(np.int32)], False, float(w), 1, cv2.LINE_AA, shift=2)
    cap = cv2.GaussianBlur(cap, (0, 0), 1.8)
    # albedo (linear): pale pink, blotchy, slightly redder in creases and around follicles; capillaries faint red
    blot = fbm((H, W), 300, 4, 5)
    base = np.stack([0.86 + 0.03 * blot, 0.47 + 0.035 * blot, 0.43 + 0.03 * blot], -1)
    red = np.clip(0.30 * g1 + 0.6 * pits, 0, 1)[..., None] * np.array([-0.02, -0.08, -0.07])
    capc = np.clip(cap, 0, 1)[..., None] * np.array([-0.08, -0.20, -0.17])
    alb = np.clip(base + red + capc, 0, 1)
    # outside the shave: the fur covers it; keep skin a little paler
    rough = np.clip(0.40 + 0.12 * g1 + 0.08 * wr + 0.05 * fbm((H, W), 80, 3, 9), 0.2, 0.7)
    srgb = np.where(alb <= 0.0031308, alb * 12.92, 1.055 * np.power(alb, 1 / 2.4) - 0.055)
    cv2.imwrite(os.path.join(cache, 'tex/albedo.png'), (np.clip(srgb[..., ::-1], 0, 1) * 65535).astype(np.uint16))
    cv2.imwrite(os.path.join(cache, 'tex/height.png'), (np.clip(height, 0, 1) * 65535).astype(np.uint16))
    cv2.imwrite(os.path.join(cache, 'tex/rough.png'), (rough * 255).astype(np.uint8))
    cv2.imwrite(os.path.join(cache, 'tex/shave.png'), (shave * 255).astype(np.uint8))
    sv = shave[fv.astype(int), fu.astype(int)]
    # hair lie: toward the tail (-y), fanning out to the flanks
    lie = np.stack([np.clip(fx / 12, -1, 1) * 0.8 + rng.normal(0, 0.25, fx.size), -1.0 + rng.normal(0, 0.2, fx.size)], -1)
    np.save(os.path.join(cache, 'tex/follicles.npy'), np.column_stack([fx, fy, sv, lie]).astype(np.float32))
    print('tex', W, H, 'follicles', fx.size, 'shaved', int((sv > 0.5).sum()))

if __name__ == '__main__':
    main(sys.argv[1])
