#!/usr/bin/env python3
"""The black hole, ray-traced (Schwarzschild, M = 1) and then posterised into the channel's cel-shaded vector finish.

Physics. Every pixel is a photon traced backwards from a distant camera. A photon's orbit lies in the plane through
the hole, the camera and the pixel direction, and obeys u'' = 3u^2 - u (u = 1/r, angle phi measured from the camera).
The orbit depends only on the impact parameter b, so u(phi) is integrated once per b (RK4) and every pixel reads its
own b from the table. Where the orbit crosses the disk plane between r_in and r_out the photon hits the accretion
disk (the first crossing is the direct image, later crossings are the lensed images that wrap over and under the
shadow). Captured photons (r < 2) give the shadow; escaping photons sample a star field in their asymptotic
direction, so the stars behind the hole are lensed into arcs and an Einstein ring.

Shading. Disk emissivity falls with radius; the brightness is boosted by g^4, where g combines the gravitational
redshift and the Doppler shift of the Keplerian disk, so the approaching side is brighter. A sheared, differentially
rotating (Keplerian Omega ~ r^-1.5) streak texture moves through the disk over time. The brightness is then
quantised into flat bands from the channel palette, with a thin ink line at each band edge, so it sits with the
vector characters instead of looking like a photo.

usage:
  python3 tools/blackhole.py maps                      -> cache/bh_maps.npz (geometry, once)
  python3 tools/blackhole.py frames <t0> <t1> [step]   -> source/public/bh/f_XXXX.jpg (film frames t0..t1 at 30 fps)
  python3 tools/blackhole.py still <t> <out.png>
"""
import os, sys, json
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, 'cache')
# BH_WIDE=1: the same camera and physics over a 2.5x wider field (drawn under the sharp image so that pulling back,
# or a reflection larger than the sharp image, never shows an edge; the overlap is pixel-for-pixel the same sky)
WIDE = os.environ.get('BH_WIDE') == '1'
OUT = os.path.join(ROOT, 'source', 'public', 'bhw' if WIDE else 'bh')
MAPS = os.path.join(CACHE, 'bhw_maps.npz' if WIDE else 'bh_maps.npz')
FPS = 30
# image: 9:16, x in [-XW, XW] M, y in [-XW*16/9, XW*16/9]
WPX, HPX = 1440, 2560
XW = 48.0 if WIDE else 19.5
INC = np.radians(83.0)        # camera inclination from the disk normal (just above the disk plane)
R0 = 80.0                     # camera distance
R_IN, R_OUT = 4.2, 17.5
TILT = np.radians(-9.0)       # roll of the image (a slightly canted, dynamic disk)

def trace_table(nb=2600, bmax=None, dphi=0.0025, phimax=4.2 * np.pi):
    bmax = bmax or (110.0 if WIDE else 60.0)
    nb = 5200 if WIDE else nb
    bs = np.linspace(0.02, bmax, nb)
    nphi = int(phimax / dphi) + 1
    U = np.full((nb, nphi), np.nan, np.float32)
    DU = np.full((nb, nphi), np.nan, np.float32)
    u0 = 1.0 / R0
    u = np.full(nb, u0)
    du = np.sqrt(np.maximum(1.0 / bs ** 2 - u0 ** 2 * (1 - 2 * u0), 0))
    alive = np.ones(nb, bool)
    end = np.full(nb, phimax)
    fate = np.zeros(nb, np.int8)  # 0 running, 1 captured, 2 escaped
    f = lambda u: 3 * u * u - u
    for k in range(nphi):
        U[alive, k] = u[alive]; DU[alive, k] = du[alive]
        # RK4 on (u, du)
        k1u, k1v = du, f(u)
        k2u, k2v = du + 0.5 * dphi * k1v, f(u + 0.5 * dphi * k1u)
        k3u, k3v = du + 0.5 * dphi * k2v, f(u + 0.5 * dphi * k2u)
        k4u, k4v = du + dphi * k3v, f(u + dphi * k3u)
        un = u + dphi / 6 * (k1u + 2 * k2u + 2 * k3u + k4u)
        dun = du + dphi / 6 * (k1v + 2 * k2v + 2 * k3v + k4v)
        cap = alive & (un > 0.5)
        esc = alive & (un <= 0) & (k > 10)
        end[cap] = k * dphi; fate[cap] = 1
        end[esc] = (k + u[esc] / np.maximum(u[esc] - un[esc], 1e-12)) * dphi; fate[esc] = 2  # sub-step zero crossing
        alive &= ~(cap | esc)
        u, du = np.where(alive, un, u), np.where(alive, dun, du)
        if not alive.any():
            break
    return bs, dphi, U, DU, end, fate

def build_maps():
    bs, dphi, U, DU, end, fate = trace_table()
    xs = (np.arange(WPX) + 0.5) / WPX * 2 - 1
    ys = (np.arange(HPX) + 0.5) / HPX * 2 - 1
    X, Y = np.meshgrid(xs * XW, -ys * XW * HPX / WPX)
    # image roll
    a = X * np.cos(TILT) - Y * np.sin(TILT)
    be = X * np.sin(TILT) + Y * np.cos(TILT)
    b = np.hypot(a, be)
    bi = np.clip((b - bs[0]) / (bs[1] - bs[0]), 0, len(bs) - 1.001)
    i0 = np.floor(bi).astype(int); fb = (bi - i0).astype(np.float32)
    c = np.array([0, -np.sin(INC), np.cos(INC)])          # camera direction from the hole
    xh = np.array([1.0, 0, 0]); yh = np.array([0, np.cos(INC), np.sin(INC)])
    ex = (a[..., None] * xh + be[..., None] * yh) / b[..., None]
    ez = ex[..., 2]
    phi0 = np.mod(np.arctan2(-c[2], ez), np.pi)            # first crossing of the disk plane, in (0, pi)
    endp = end[i0] * (1 - fb) + end[i0 + 1] * fb
    fatep = np.where(fb < 0.5, fate[i0], fate[i0 + 1])
    H, W = b.shape
    hit = np.zeros((H, W), bool); R = np.zeros((H, W), np.float32); TH = np.zeros((H, W), np.float32)
    G = np.zeros((H, W), np.float32); ORDER = np.zeros((H, W), np.int8)
    def u_at(phi):
        j = phi / dphi
        j0 = np.clip(np.floor(j).astype(int), 0, U.shape[1] - 2); fj = (j - j0).astype(np.float32)
        def lerp(T):
            return ((T[i0, j0] * (1 - fj) + T[i0, j0 + 1] * fj) * (1 - fb) + (T[i0 + 1, j0] * (1 - fj) + T[i0 + 1, j0 + 1] * fj) * fb)
        return lerp(U), lerp(DU)
    for kk in range(4):
        ph = phi0 + kk * np.pi
        ok = (~hit) & (ph < endp - dphi)
        uu, duu = u_at(ph)
        rr = 1.0 / np.where(np.isfinite(uu) & (uu > 1e-6), uu, 1e-6)
        h = ok & np.isfinite(uu) & (rr >= R_IN) & (rr <= R_OUT)
        cp, sp = np.cos(ph), np.sin(ph)
        P = rr[..., None] * (cp[..., None] * c + sp[..., None] * ex)
        th = np.arctan2(P[..., 1], P[..., 0])
        # photon propagation direction at P (towards the camera) = minus the backward-trace tangent
        T = -(duu / np.maximum(uu, 1e-6) ** 2)[..., None] * (cp[..., None] * c + sp[..., None] * ex) + rr[..., None] * (-sp[..., None] * c + cp[..., None] * ex)
        T /= np.linalg.norm(T, axis=-1, keepdims=True) + 1e-9
        k_ = -T
        v = 1.0 / np.sqrt(np.maximum(rr - 2.0, 0.3))
        v = np.minimum(v, 0.75)
        phat = np.stack([-np.sin(th), np.cos(th), np.zeros_like(th)], -1)
        g = np.sqrt(np.maximum(1 - 2 / rr, 0.01)) * np.sqrt(1 - v ** 2) / (1 - v * (phat * k_).sum(-1))
        hit |= h; R[h] = rr[h]; TH[h] = th[h]; G[h] = g[h]; ORDER[h] = kk
    shadow = (~hit) & (fatep == 1)
    # escaping photons: asymptotic direction
    ue = end[i0] * (1 - fb) + end[i0 + 1] * fb
    D = np.cos(ue)[..., None] * c + np.sin(ue)[..., None] * ex
    lon = np.arctan2(D[..., 1], D[..., 0]); lat = np.arcsin(np.clip(D[..., 2], -1, 1))
    os.makedirs(CACHE, exist_ok=True)
    np.savez_compressed(MAPS, hit=hit, R=R, TH=TH, G=G, ORDER=ORDER, shadow=shadow, lon=lon.astype(np.float32), lat=lat.astype(np.float32))
    # the shadow's apparent radius in M and in image pixels (for the vector overlays)
    meta = {'WPX': WPX, 'HPX': HPX, 'XW': XW, 'px_per_M': WPX / (2 * XW), 'shadow_px': int(shadow.sum()),
            'shadow_r_M': float(np.sqrt(shadow.sum() / np.pi) / (WPX / (2 * XW))), 'inc_deg': float(np.degrees(INC)), 'tilt_deg': float(np.degrees(TILT)),
            'r_in': R_IN, 'r_out': R_OUT}
    json.dump(meta, open(os.path.join(ROOT, 'source', 'src', 'data', 'bhw_meta.json' if WIDE else 'bh_meta.json'), 'w'), indent=1)
    print(meta)

# --- shading -------------------------------------------------------------------------------------------------------
def hexrgb(h):
    h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32)
SPACE_TOP, SPACE_BOT = hexrgb('#0B0E1D'), hexrgb('#1A1238')
INK = hexrgb('#120A10')
BANDS = [hexrgb(x) for x in ['#4A1630', '#8E2A34', '#C94A36', '#EF6B55', '#FF9A55', '#FFC744', '#FFE7A6', '#FFFBF0']]
EDGES = [0.07, 0.14, 0.24, 0.37, 0.52, 0.70, 0.90]

def stars_texture(seed=7, w=4096, h=2048):
    rng = np.random.default_rng(seed)
    tex = np.zeros((h, w), np.float32)
    n = 2600
    xs, ys = rng.integers(0, w, n), rng.integers(0, h, n)
    mag = rng.random(n) ** 3
    rad = 1 + (mag > 0.6) + (mag > 0.9)
    for x, y, m, r in zip(xs, ys, mag, rad):
        tex[max(0, y - r):y + r + 1, max(0, x - r):x + r + 1] = np.maximum(tex[max(0, y - r):y + r + 1, max(0, x - r):x + r + 1], 0.45 + 0.55 * m)
    return tex

def star_mask(lon, lat, cell=np.radians(0.55), p=0.16, seed=3.0):
    # stars as points on the sky: one candidate per (lon, lat) cell, kept with probability p, drawn as a disk of fixed
    # angular radius, so lensing stretches them into arcs exactly as it stretches the sky
    out = np.zeros(lon.shape, np.float32)
    for oy in (0, 1):
        for ox in (0, 1):
            cy = np.floor(lat / cell - 0.5 * oy) + 0.5 * oy
            cx = np.floor(lon / cell - 0.5 * ox) + 0.5 * ox
            h = np.sin(cx * 127.1 + cy * 311.7 + seed * 74.7) * 43758.5453; h -= np.floor(h)
            h2 = np.sin(cx * 269.5 + cy * 183.3 + seed * 12.9) * 43758.5453; h2 -= np.floor(h2)
            h3 = np.sin(cx * 419.2 + cy * 371.9 + seed * 5.3) * 43758.5453; h3 -= np.floor(h3)
            sx = (cx + 0.15 + 0.7 * h2) * cell; sy = (cy + 0.15 + 0.7 * h3) * cell
            d = np.hypot((lon - sx) * np.cos(lat), lat - sy)
            mag = (h / p)
            rad = np.radians(0.034 + 0.050 * (1 - mag) ** 3)
            on = (h < p) & (d < rad)
            out = np.maximum(out, np.where(on, np.where(mag < 0.35, 1.0, 0.6), 0))
    return out

_M = None
_S = None
def maps():
    global _M, _S
    if _M is None:
        _M = dict(np.load(MAPS))
        _S = stars_texture()
    return _M, _S

def shade(t, glow=1.0):
    M, S = maps()
    hit, R, TH, G, shadow = M['hit'], M['R'], M['TH'], M['G'], M['shadow']
    H, W = hit.shape
    # background: vertical gradient + lensed stars
    yy = np.linspace(0, 1, H)[:, None, None]
    img = SPACE_TOP * (1 - yy) + SPACE_BOT * yy
    img = np.broadcast_to(img, (H, W, 3)).copy()
    st = star_mask(M['lon'], M['lat'])[..., None]
    img = img * (1 - st * 0.92) + hexrgb('#FFF6E0') * st * 0.92
    # soft lensed glow ring around the shadow (scattered light), kept faint
    # disk
    rr = np.where(hit, R, R_OUT)
    om = 1.9 * rr ** -1.5 * 6.0       # angular speed (rad/s, visual): inner disk ~ 1 turn / 2.5 s
    thp = TH - om * t
    lr = np.log(rr)
    n = (0.55 * np.sin(3 * thp + 9.0 * lr + 0.7) + 0.35 * np.sin(5 * thp - 14.0 * lr + 2.1) + 0.25 * np.sin(8 * thp + 23.0 * lr + 4.0)
         + 0.18 * np.sin(13 * thp - 31.0 * lr + 1.3))
    x = (rr - R_IN) / (R_OUT - R_IN)
    emis = (R_IN / rr) ** 2.1 * np.clip(1 - np.sqrt(R_IN * 0.92 / rr), 0, 1) * 3.2
    emis *= np.clip((1 - x) / 0.25, 0, 1) ** 0.7                       # soft outer edge
    L = 1.35 * emis * np.clip(G, 0, 2.5) ** 2.3 * (1 + 0.26 * n) * glow
    L = np.where(hit, L, 0)
    band = np.digitize(L, EDGES)
    pal = np.stack([np.zeros(3, np.float32)] + BANDS[:len(EDGES)], 0)
    dcol = pal[np.clip(band, 0, len(pal) - 1)]
    dm = (hit & (band > 0))[..., None]
    img = np.where(dm, dcol, img)
    # band-edge ink lines (thin, translucent) inside the disk
    edge = np.zeros(hit.shape, bool)
    edge[:, 1:] |= (band[:, 1:] != band[:, :-1]) & hit[:, 1:] & hit[:, :-1] & (band[:, 1:] < 5) & (band[:, :-1] < 5)
    edge[1:, :] |= (band[1:, :] != band[:-1, :]) & hit[1:, :] & hit[:-1, :] & (band[1:, :] < 5) & (band[:-1, :] < 5)
    img = np.where(edge[..., None], img * 0.55 + INK * 0.45, img)
    # shadow: deep ink, with a crisp cream photon ring at its rim
    sh = shadow.astype(np.float32)
    img = np.where(shadow[..., None], hexrgb('#05060B'), img)
    ring = np.zeros_like(shadow)
    ring[1:-1, 1:-1] = shadow[1:-1, 1:-1] & ~(shadow[:-2, 1:-1] & shadow[2:, 1:-1] & shadow[1:-1, :-2] & shadow[1:-1, 2:])
    # thicken the ring by 2 px outward
    rg = ring.copy()
    for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1), (-2, 0), (2, 0), (0, -2), (0, 2), (-1, -1), (1, 1), (-1, 1), (1, -1)]:
        rg |= np.roll(np.roll(ring, dy, 0), dx, 1)
    rg &= ~shadow | ring
    img = np.where(rg[..., None], hexrgb('#FFE9B8'), img)
    return np.clip(img, 0, 255).astype(np.uint8)

def save_frame(t, path, q=90):
    Image.fromarray(shade(t)).save(path, quality=q, subsampling=0)

if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'maps':
        build_maps()
    elif cmd == 'still':
        Image.fromarray(shade(float(sys.argv[2]))).save(sys.argv[3])
    elif cmd == 'frames':
        t0, t1 = float(sys.argv[2]), float(sys.argv[3])
        step = int(sys.argv[4]) if len(sys.argv) > 4 else 1
        os.makedirs(OUT, exist_ok=True)
        for f in range(int(round(t0 * FPS)), int(round(t1 * FPS)) + 1, step):
            p = os.path.join(OUT, f'f_{f:04d}.jpg')
            if not os.path.exists(p):
                save_frame(f / FPS, p)
        print('frames', t0, t1)
