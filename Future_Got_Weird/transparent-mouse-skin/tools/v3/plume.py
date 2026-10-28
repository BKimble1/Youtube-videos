#!/usr/bin/env python3
"""A drop of concentrated food dye entering the water in the vial: 2D stable fluids (semi-Lagrangian advection,
pressure projection, vorticity confinement), the dye denser than water so it sinks as a curling plume.
The applicator dipping in at `dip` stirs it. Grid in mm (the vial's inner width 20.2 mm by 25 mm of water).
Writes <out>.npy: density frames at 30 fps from t0 (s, film time) for n frames.
usage: plume.py <out.npy> [t_land] [t_dip] [frames]"""
import sys
import numpy as np
from scipy.ndimage import map_coordinates

out = sys.argv[1]
T_LAND = float(sys.argv[2]) if len(sys.argv) > 2 else 7.99
T_DIP = float(sys.argv[3]) if len(sys.argv) > 3 else 8.22
NF = int(sys.argv[4]) if len(sys.argv) > 4 else 24
NX, NY = 128, 160
WMM, HMM = 20.2, 25.0
h = WMM / NX
rng = np.random.default_rng(4)
u = np.zeros((NY, NX)); v = np.zeros((NY, NX)); d = np.zeros((NY, NX))
yy, xx = np.mgrid[0:NY, 0:NX].astype(float)

def advect(f, u, v, dt):
    return map_coordinates(f, [yy - v * dt / h, xx - u * dt / h], order=1, mode='nearest')

def project(u, v, it=50):
    div = (np.roll(u, -1, 1) - np.roll(u, 1, 1) + np.roll(v, -1, 0) - np.roll(v, 1, 0)) / (2 * h)
    p = np.zeros_like(u)
    for _ in range(it):
        p = (np.roll(p, 1, 0) + np.roll(p, -1, 0) + np.roll(p, 1, 1) + np.roll(p, -1, 1) - div * h * h) / 4
        p[0, :] = p[1, :]; p[-1, :] = p[-2, :]; p[:, 0] = p[:, 1]; p[:, -1] = p[:, -2]
    u = u - (np.roll(p, -1, 1) - np.roll(p, 1, 1)) / (2 * h)
    v = v - (np.roll(p, -1, 0) - np.roll(p, 1, 0)) / (2 * h)
    u[:, 0] = u[:, -1] = 0; v[0, :] = v[-1, :] = 0  # walls of the vial, the bottom, the surface
    return u, v

def vort(u, v, eps):
    w = (np.roll(v, -1, 1) - np.roll(v, 1, 1) - np.roll(u, -1, 0) + np.roll(u, 1, 0)) / (2 * h)
    aw = np.abs(w)
    gx = (np.roll(aw, -1, 1) - np.roll(aw, 1, 1)) / (2 * h); gy = (np.roll(aw, -1, 0) - np.roll(aw, 1, 0)) / (2 * h)
    n = np.sqrt(gx ** 2 + gy ** 2) + 1e-6
    return eps * (gy / n) * w, -eps * (gx / n) * w

def blob(cx, cy, r):
    return np.exp(-(((xx + 0.5) * h - cx) ** 2 + ((yy + 0.5) * h - cy) ** 2) / (2 * r * r))

SUB = 8; dt = 1 / (30 * SUB)
frames = []
t = T_LAND
injected = False
for f in range(NF):
    for s in range(SUB):
        if not injected:
            b = blob(WMM / 2 + 0.3, 0.9, 1.0)
            d += 2.4 * b; v += 140.0 * b; u += 6.0 * blob(WMM / 2 - 0.4, 1.2, 0.6) * rng.normal()
            injected = True
        if T_DIP <= t < T_DIP + 0.25:
            # the applicator pushing down through the water off-centre, then stopping
            b = blob(WMM / 2 + 4.0, 3.0 + (t - T_DIP) * 30, 1.0); v += 9.0 * b; u -= 2.0 * b
        fu, fv = vort(u, v, 0.35)
        v += dt * (220.0 * d + fv); u += dt * fu  # dense dye sinks
        u += dt * 30 * rng.normal(0, 1, u.shape) * (d > 0.02) * 0.2
        u, v = project(u, v)
        u, v = advect(u, u, v, dt), advect(v, u, v, dt)
        d = advect(d, u, v, dt) * 0.9995
        d = np.clip(d, 0, None)
        t += dt
    frames.append(d.astype(np.float32).copy())
np.save(out, np.stack(frames))
print('plume', np.stack(frames).shape, 'max', float(np.max(frames)))
