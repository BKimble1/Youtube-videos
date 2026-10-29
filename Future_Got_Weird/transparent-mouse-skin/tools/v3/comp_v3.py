#!/usr/bin/env python3
"""V3 compositor: builds the 752 picture frames of "Transparent Mouse Skin" V3 from the rendered plates.

All light is combined in scene-linear float and tone-mapped once per frame. Every mask on the skin is a function of
physical position on the skin (mm, from each plate's UV pass) and time, so the treated patch is the same patch in every
shot. Cleared skin is the opaque-skin plate's opposite: K (the skin's own light in the cleared state) plus O = C - K
(the light from the organs through it), and only O is moved (peristalsis), so the skin surface never moves with the gut.

usage: comp_v3.py <cache> <out_dir> [first_frame] [last_frame] [workers]
Writes out_dir/f0000.jpg ... (1080x1920 sRGB, JPEG q97)."""
import math, os, sys
import numpy as np, cv2
from scipy.spatial import cKDTree
from scipy.ndimage import map_coordinates
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from exr import read, tonemap
import timeline_v3 as TL

CACHE = sys.argv[1] if len(sys.argv) > 1 else '/tmp/claude-0/v3cache'
W, H, FPS = 1080, 1920, 30
DUR = TL.DUR
N = TL.NFRAMES
X0, Y0, XS, YS = -22.0, -35.0, 44.0, 70.0

def ss(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
def sss(a, b, x):  # scalar smoothstep
    t = min(1.0, max(0.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
def lerp(a, b, t): return a + (b - a) * t
def ease(t): t = min(1.0, max(0.0, t)); return t * t * (3 - 2 * t)

# ---------------- plates ----------------
_P = {}
def plate(path):
    if path not in _P:
        _P[path] = read(os.path.join(CACHE, path))
    return _P[path]

def rgba(path):
    """a sprite (premultiplied RGBA)"""
    if path not in _P:
        import OpenEXR
        f = OpenEXR.File(os.path.join(CACHE, path)); ch = {}
        for p in f.parts:
            for k, c in p.channels.items(): ch[k] = c.pixels
        k = [k for k in ch if k.endswith('Combined')][0]
        px = ch[k].astype(np.float32)
        # the shadow catcher also darkens the whole plane faintly (ambient); keep only the cast shadow, so a moved
        # sprite shows no rectangle
        a = px[..., 3]; shadow_only = px[..., :3].max(-1) < 0.02
        px[..., 3] = np.where(shadow_only, np.clip((a - 0.12) / 0.88, 0, 1), a)
        _P[path] = px
    return _P[path]

_MM = {}
def mm_map(cam):
    """per plate pixel: position on the skin in mm (x, y) and a KD-tree to go back"""
    if cam not in _MM:
        uv = plate(f'plates/{cam}_A.exr' if os.path.exists(os.path.join(CACHE, f'plates/{cam}_A.exr')) else f'plates/{cam}_C.exr')['uv']
        x = X0 + uv[..., 0] * XS; y = Y0 + uv[..., 1] * YS
        valid = (uv[..., 0] > 0.001) & (uv[..., 1] > 0.001)
        ys, xs = np.nonzero(valid)
        tree = cKDTree(np.column_stack([x[valid], y[valid]]))
        _MM[cam] = (x.astype(np.float32), y.astype(np.float32), tree, xs, ys)
    return _MM[cam]

def mm_to_px(cam, p):
    x, y, tree, xs, ys = mm_map(cam)
    _, i = tree.query(p); return np.column_stack([xs[i], ys[i]]).astype(np.float32)

def px_to_mm(cam, q):
    x, y, *_ = mm_map(cam)
    q = np.asarray(q, float); qi = np.clip(np.round(q).astype(int), 0, [x.shape[1] - 1, x.shape[0] - 1])
    return np.column_stack([x[qi[:, 1], qi[:, 0]], y[qi[:, 1], qi[:, 0]]])

# ---------------- smooth noise (mm space and screen space) ----------------
_rng = np.random.default_rng(5)
_G = _rng.standard_normal((4, 64, 64)).astype(np.float32)
def noise2(x, y, scale, k=0):
    """smooth value noise on a periodic 64x64 lattice (bicubic)"""
    g = _G[k % 4]
    return map_coordinates(g, [(y / scale) % 64, (x / scale) % 64], order=3, mode='grid-wrap').astype(np.float32)

# ---------------- the application track (one patch, shared by every skin shot) ----------------
# keyed in the HOOK plate's normalised pixel coordinates (u right, v down) with times tau (s from the film's start;
# negative = the end of the film, which runs into the start)
TRACK = [(-1.00, 1.18, 0.12), (-0.34, 0.66, 0.36), (-0.04, 0.47, 0.43), (0.35, 0.31, 0.53), (0.75, 0.60, 0.47),
         (1.15, 0.67, 0.57), (1.55, 0.37, 0.62), (1.95, 0.42, 0.72), (2.25, 0.62, 0.69), (2.62, 1.20, 0.86)]
CONTACT = (-0.34, 2.25)  # touches down with the loop's brushing sound (24.73 s = tau -0.34)
def _cr(P, t):
    """Catmull-Rom through keyed points (t, x, y)"""
    ts = np.array([p[0] for p in P]); i = int(np.clip(np.searchsorted(ts, t) - 1, 0, len(P) - 2))
    p0 = np.array(P[max(i - 1, 0)][1:]); p1 = np.array(P[i][1:]); p2 = np.array(P[i + 1][1:]); p3 = np.array(P[min(i + 2, len(P) - 1)][1:])
    u = (t - ts[i]) / (ts[i + 1] - ts[i]); u = min(1.0, max(0.0, u))
    return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u ** 3)

def hook_uv(tau): return _cr(TRACK, tau)

_TR = {}
def track_mm():
    """samples of the contact stroke in mm (tau, x, y)"""
    if 'mm' not in _TR:
        x, *_ = mm_map('HOOK'); h, w = x.shape
        taus = np.arange(CONTACT[0], CONTACT[1] + 1e-6, 0.01)
        q = np.array([hook_uv(t) for t in taus]) * [w, h]
        _TR['mm'] = np.column_stack([taus, px_to_mm('HOOK', q)])
    return _TR['mm']

R0, SPREAD = 1.25, 2.6  # wet width (mm, radius) and how fast the solution spreads out from the stroke (mm/s)
def arrival(xm, ym):
    """when the solution reaches each point on the skin (s, tau; 1e4 where it never does), and the distance to the stroke"""
    T = track_mm(); a = np.full(xm.shape, 1e4, np.float32); dmin = np.full(xm.shape, 1e4, np.float32)
    for tau, px, py in T[::2]:
        d = np.sqrt((xm - px) ** 2 + (ym - py) ** 2)
        dmin = np.minimum(dmin, d)
        a = np.minimum(a, np.where(d < R0 + 4.5, tau + np.maximum(0, d - R0) / SPREAD, 1e4))
    return a, dmin

# where the treated patch sits under each camera (mm offset of the patch from where the hook's strokes put it):
# each view frames the boundary its move is built around; within a shot the patch is fixed to the skin
PATCH_OFFSET = {'SIDE': (-9.0, -4.0), 'GRAZE': (-3.0, 0.0), 'WIDE': (-4.4, -0.8), 'WASH': (-5.9, -1.8)}
_ARR = {}
def arrival_cam(cam):
    if cam not in _ARR:
        x, y, *_ = mm_map(cam)
        ox, oy = PATCH_OFFSET.get(cam, (0.0, 0.0))
        x, y = x - ox, y - oy
        a, dmin = arrival(x, y)
        n = noise2(x, y, 0.9, 1) * 0.22 + noise2(x, y, 0.25, 2) * 0.08  # an organic, uneven uptake
        # less dye reaches the edge of the applied area: clarity falls off over ~2 mm, unevenly
        edge = ss(R0 + 2.2 + n * 2, R0 - 0.2 + n * 2, dmin).astype(np.float32)
        wetedge = ss(R0 + 1.4 + n * 2, R0 - 0.2 + n * 2, dmin).astype(np.float32) * 0.6  # a thin wet film: tints, doesn't paint
        _ARR[cam] = (a, n, edge, wetedge)
    return _ARR[cam]

def stain_clear(cam, tau, lag=0.08, dur=0.42):
    a, n, edge, wetedge = arrival_cam(cam)
    st = ss(a, a + 0.10, tau) * wetedge
    cl = ss(a + lag + n, a + lag + dur + n, tau) * edge
    return st, cl

def treated_final(cam):
    """the cleared patch once it has fully developed"""
    a, n, edge, _ = arrival_cam(cam)
    return edge * (a < 10)

# ---------------- organ motion: peristalsis, a slow travelling squeeze; breathing ----------------
_FLOW = {}
def peristalsis(shape, t, amp):
    """a displacement field (dx, dy) in pixels: slow waves, periodic over the film so the loop is seamless"""
    h, w = shape
    if shape not in _FLOW:
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        s = w / 1080.0
        _FLOW[shape] = [noise2(xx, yy, 140 * s, k) for k in range(4)]
    F = _FLOW[shape]
    w1 = 2 * np.pi * 9 / DUR; w2 = 2 * np.pi * 14 / DUR
    dx = amp * (F[0] * np.cos(w1 * t) + F[1] * np.sin(w1 * t) * 0.6 + 0.4 * F[2] * np.sin(w2 * t))
    dy = amp * (F[1] * np.cos(w1 * t + 1) + F[2] * np.sin(w1 * t) * 0.6 + 0.4 * F[3] * np.cos(w2 * t))
    return dx, dy

def remap(img, dx, dy):
    h, w = img.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    return cv2.remap(img, (xx + dx).astype(np.float32), (yy + dy).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

BREATH_F = 20 / DUR  # ~0.8 Hz, a whole number of breaths over the film
def breath(t): return math.sin(2 * math.pi * BREATH_F * t)

# ---------------- camera: a window on a plate ----------------
def view(img, cx, cy, k, rot=0.0, out=(W, H), interp=cv2.INTER_LINEAR):
    """the output frame shows the plate region centred (cx, cy) (plate px) at k plate-px per output px, rotated rot deg"""
    ph, pw = img.shape[:2]
    if rot == 0:  # keep the window inside the plate (a camera never looks past its plate)
        k = min(k, pw / out[0], ph / out[1])
        cx = min(max(cx, out[0] * k / 2), pw - out[0] * k / 2); cy = min(max(cy, out[1] * k / 2), ph - out[1] * k / 2)
    a = math.radians(rot); c, s = math.cos(a) * k, math.sin(a) * k
    M = np.array([[c, -s, cx - c * out[0] / 2 + s * out[1] / 2], [s, c, cy - s * out[0] / 2 - c * out[1] / 2]], np.float32)
    return cv2.warpAffine(img, M, out, flags=interp | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT)

def over(base, spr, dx=0.0, dy=0.0, scale=1.0, alpha_mul=1.0):
    """premultiplied sprite over base, shifted by (dx, dy) px"""
    h, w = base.shape[:2]
    M = np.array([[scale, 0, dx + (1 - scale) * spr.shape[1] / 2], [0, scale, dy + (1 - scale) * spr.shape[0] / 2]], np.float32)
    s = cv2.warpAffine(spr, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0) * alpha_mul
    return s[..., :3] + base * (1 - s[..., 3:4])

# ---------------- skin shots ----------------
def skin_plate(cam, st, t, organ_amp=3.0):
    """the cleared state with its organs moving: K + moved(C - K)"""
    C = plate(f'plates/{cam}_{st[0]}.exr')['rgb']; K = plate(f'plates/{cam}_{st[1]}.exr')['rgb']
    O = np.maximum(C - K, 0)
    dx, dy = peristalsis(C.shape[:2], t, organ_amp * C.shape[1] / 1080)
    return K + remap(O, dx, dy)

def skin_frame(cam, t, tau=None, final=False, wet=None, base='A'):
    """compose a skin plate in plate space: opaque -> stained -> cleared by the shared masks"""
    A = plate(f'plates/{cam}_{base}.exr')['rgb']
    if final:
        m = treated_final(cam)[..., None]
        Cc = skin_plate(cam, ('C', 'K'), t)
        return A * (1 - m) + Cc * m
    st, cl = stain_clear(cam, tau)
    out = A
    if (st > 0).any():
        B = plate(f'plates/{cam}_B.exr')['rgb'] * np.array([1.08, 0.94, 0.78], np.float32)  # tartrazine's yellow-orange
        out = A + (B - A) * (st * (1 - cl))[..., None]
    if (cl > 0).any():
        Cc = skin_plate(cam, ('C', 'K'), t)
        out = out + (Cc - out) * cl[..., None]
    return out

def swab_sprite(cam, tip_px, lift=0.0):
    """the soaked applicator over a skin plate, its bud at tip_px (plate px)"""
    spr = rgba(f'lab/SWAB_{cam}.exr')
    h, w = spr.shape[:2]
    # the sprite is a 6.5 mm cotton bud; the film uses a fine-tip applicator, sized to read in each shot's framing
    return spr, tip_px[0] - w / 2 + lift * 30, tip_px[1] - h / 2 - lift * 55, SWAB_SCALE[cam] * (1 + lift * 0.06)

SWAB_SCALE = {'HOOK': 1.0, 'APPLY': 1.0}  # sizes are set by the sprites' render fields (render_rest.sh: 2.04x, 3.3x)

def shot_hook(t, tau):
    """S1 / S12: tight on the belly; the applicator strokes and the skin behind it turns translucent"""
    img = skin_frame('HOOK', t, tau=tau)
    h, w = img.shape[:2]
    if -1.0 <= tau <= 2.62:
        u, v = hook_uv(tau)
        lift = 1 - ss(-0.6, -0.34, tau) if tau < 0 else ss(2.25, 2.45, tau)
        spr, dx, dy, sc = swab_sprite('HOOK', (u * w, v * h), lift)
        img = over(img, spr, dx, dy, sc)
    k = 0.95 - 0.034 * tau - 0.004 * breath(t)
    k = k if tau <= 1.6 else (0.95 - 0.034 * 1.6) - 0.03 * (1 - math.exp(-(tau - 1.6) * 1.2))
    cx = w / 2 + 14 * math.sin(tau * 0.7); cy = h / 2 - 10 * tau
    return view(img, cx, cy, k * w / W)

def shot_side(t, s0, s1):
    """S2: low across the belly from the untreated skin to the treated, a slider move"""
    img = skin_frame('SIDE', t, final=True)
    h, w = img.shape[:2]
    u = ease((t - s0) / (s1 - s0))
    cx = lerp(w * 0.36, w * 0.64, u); cy = h * 0.52 + 6 * breath(t)
    return view(img, cx, cy, 0.66 * w / W * (1.0 - 0.04 * u))

def shot_graze(t, s0, s1):
    """S3: grazing macro travelling along the surface: unbroken skin over the treated patch"""
    img = skin_frame('GRAZE', t, final=True)
    h, w = img.shape[:2]
    u = (t - s0) / (s1 - s0)
    cx = lerp(w * 0.32, w * 0.68, u); cy = h * 0.55 + 4 * breath(t)
    return view(img, cx, cy, 0.6 * w / W)

# ---------------- lab ----------------
_PL = {}
def plume_frames():
    if 'p' not in _PL: _PL['p'] = np.load(os.path.join(CACHE, 'plume.npy'))
    return _PL['p']

def lab_geom():
    if 'g' not in _PL:
        m = plate('lab/LAB_MASK.exr')['rgb']
        water = (m[..., 0] > 0.5) & (m[..., 1] < 0.5)
        ys, xs = np.nonzero(water)
        liq = (m[..., 2] > 0.5)
        ly, lx = np.nonzero(liq)
        _PL['g'] = dict(water=water.astype(np.float32), wx0=xs.min(), wx1=xs.max(), wy0=ys.min(), wy1=ys.max(),
                        tip=(float(np.median(lx[ly > ly.max() - 4])), float(ly.max())))
    return _PL['g']

def shot_lab(t, s0, s1):
    """S4: the dye solution prepared: a drop of food colouring from the pipette, blooming in the water;
    the applicator dipped in"""
    bg = plate('lab/LAB_BG.exr')['rgb']; g = lab_geom(); h, w = bg.shape[:2]
    img = bg.copy()
    # dye in the water: the plume (2D simulation) mapped onto the water seen through the glass
    if t >= TL.B['dropLand']:
        P = plume_frames(); i = min(len(P) - 1, int((t - TL.B['dropLand']) * FPS))
        d = P[i]
        wx0, wx1, wy0, wy1 = g['wx0'], g['wx1'], g['wy0'], g['wy1']
        dd = cv2.resize(d, (wx1 - wx0 + 1, int((wx1 - wx0 + 1) * 25.0 / 20.2)), interpolation=cv2.INTER_CUBIC)
        full = np.zeros((h, w), np.float32)
        y1 = min(h, wy0 + 6 + dd.shape[0]); full[wy0 + 6:y1, wx0:wx1 + 1] = dd[:y1 - wy0 - 6]
        full *= g['water']
        absorb = np.array([0.08, 0.55, 2.4], np.float32)  # tartrazine: strong blue absorption, some green
        img = img * np.exp(-3.4 * full[..., None] * absorb)
    # the drop: swells on the tip, lets go, falls ~9 mm (about 0.05 s), lands
    tipx, tipy = g['tip']
    pxmm = h / (100.0 * 1.08)
    drop = rgba('lab/LAB_DROP.exr'); dh, dw = drop.shape[:2]
    # the drop sprite was rendered at world (0, 0, 30): find its centre in the sprite
    al = drop[..., 3]; ys, xs = np.nonzero(al > 0.5); dcx, dcy = xs.mean(), ys.mean()
    if TL.B['dropGrow'] <= t < TL.B['dropLand']:
        if t < TL.B['dropFree']:
            g_ = ease((t - TL.B['dropGrow']) / (TL.B['dropFree'] - TL.B['dropGrow']))
            sc = 0.35 + 0.65 * g_; cy = tipy + sc * 1.0 * pxmm
        else:
            f = (t - TL.B['dropFree']) / (TL.B['dropLand'] - TL.B['dropFree'])
            sc = 1.0; cy = tipy + pxmm * (1.0 + 8.5 * f * f)
        img = over(img, drop, tipx - dcx, cy - dcy, sc)
    if TL.B['dropLand'] <= t < TL.B['dropLand'] + 0.5:
        # rings spreading on the surface
        f = (t - TL.B['dropLand']) / 0.5
        ring = np.zeros((h, w), np.float32)
        yw = g['wy0'] + 2
        for k in range(2):
            r = (f - 0.15 * k) * 160
            if r > 0: cv2.ellipse(ring, (int(tipx), int(yw)), (int(r), int(r * 0.16)), 0, 0, 360, 1.0, 3, cv2.LINE_AA)
        ring = cv2.GaussianBlur(ring, (0, 0), 1.5) * (1 - f) * g['water']
        img = img + ring[..., None] * 0.9
    # the applicator: enters from the upper right, dips into the solution, comes out soaked
    if t >= TL.B['swabIn']:
        wet = t > TL.B['dip0'] + 0.08
        spr = rgba('lab/LAB_SWABWET.exr' if wet else 'lab/LAB_SWAB.exr')
        a = ease((t - TL.B['swabIn']) / (TL.B['dip0'] - TL.B['swabIn']))
        dn = ease((t - TL.B['dip0']) / 0.18) - ease((t - TL.B['dip1']) / 0.25)
        dx = lerp(260, 0, a) + dn * -14; dy = lerp(-420, 0, a) + dn * 11 * pxmm
        img = over(img, spr, dx, dy)
    u = (t - s0) / (s1 - s0)
    out = view(img, w / 2 + 10 * u, h / 2 + 30 * u, (1 / 1.08) * w / W * (1 - 0.05 * u))
    fb = 16 * (1 - ease((t - s0) / 0.3))  # the camera finds focus on the vial as the shot opens
    return cv2.GaussianBlur(out, (0, 0), fb) if fb > 0.4 else out

# ---------------- application ----------------
APPLY_TRACK = [(-0.40, 1.15, 0.05), (0.0, 0.62, 0.40), (0.22, 0.40, 0.48), (0.45, 0.62, 0.55), (0.65, 0.42, 0.63), (0.84, 0.58, 0.70), (1.2, 1.25, 0.95)]
_AP = {}
def apply_arrival():
    """when the solution reaches each point in the application shot, and how much reaches it (soft, uneven edge)"""
    if 'a' not in _AP:
        x, y, *_ = mm_map('APPLY'); h, w = x.shape
        taus = np.arange(0.0, 0.85, 0.01)
        q = np.array([_cr(APPLY_TRACK, s) for s in taus]) * [w, h]
        T = np.column_stack([taus, px_to_mm('APPLY', q)])
        a = np.full(x.shape, 1e4, np.float32); dmin = np.full(x.shape, 1e4, np.float32)
        for tau, px, py in T[::2]:
            d = np.sqrt((x - px) ** 2 + (y - py) ** 2); dmin = np.minimum(dmin, d)
            a = np.minimum(a, np.where(d < 4.0, tau + np.maximum(0, d - 0.9) / 2.0, 1e4))
        n = noise2(x, y, 0.7, 3) * 0.25 + noise2(x, y, 0.2, 1) * 0.08
        _AP['a'] = (a + n * 0.3, ss(2.2 + n * 2, 0.6 + n * 2, dmin).astype(np.float32))
    return _AP['a']

def shot_apply(t, s0, s1):
    """S5: the soaked applicator on the skin; the solution spreads into the surface; the camera dives in"""
    A = plate('plates/APPLY_A.exr')['rgb']; B = plate('plates/APPLY_B.exr')['rgb'] * np.array([1.08, 0.94, 0.78], np.float32); h, w = A.shape[:2]
    tau = t - TL.B['contact']
    a, amt = apply_arrival(); st = ss(a, a + 0.15, tau) * amt * 0.75
    img = A + (B - A) * st[..., None]
    if tau < 1.2:
        u, v = _cr(APPLY_TRACK, tau)
        lift = 1 - ss(-0.25, 0.0, tau) if tau < 0 else ss(0.84, 1.0, tau)
        spr, dx, dy, sc = swab_sprite('APPLY', (u * w, v * h), lift)
        img = over(img, spr, dx, dy, sc)
    # the dive: push into the wet, spreading solution
    z = ease((t - TL.B['dive0']) / (s1 - TL.B['dive0']))
    k = (1 / 1.12) * (1 - 0.62 * z) - 0.003 * breath(t)
    return view(img, w * (0.5 + 0.04 * z), h * (0.5 + 0.08 * z), k * w / W)

# ---------------- tissue ----------------
def tissue_cam(t):
    """the MAIN tissue camera through S6 - S10: (centre x, y as plate fractions, window width as plate fraction)"""
    B = TL.B
    keys = [(B['tis0'], 0.50, 0.30, 0.42), (B['tis0'] + 1.35, 0.50, 0.40, 0.80),
            (B['beam0'], 0.50, 0.42, 0.80), (B['hideCam0'], 0.50, 0.42, 0.70), (B['hideCam1'], 0.50, 0.76, 0.52),
            (B['dye0'] - 0.01, 0.50, 0.78, 0.50)]
    return keys

def interp_keys(keys, t):
    if t <= keys[0][0]: return keys[0][1:]
    for (t0, *a), (t1, *b) in zip(keys, keys[1:]):
        if t <= t1:
            u = ease((t - t0) / (t1 - t0)); return tuple(lerp(x, y, u) for x, y in zip(a, b))
    return keys[-1][1:]

_PH = {}
def photon_paths(kind, entry, h, w, n=26):
    """light paths from the entry point: scattering (a random walk that soon turns back and spreads) or straight"""
    key = (kind, n)
    if key not in _PH:
        r = np.random.default_rng(13 if kind == 'scatter' else 17); paths = []
        for i in range(n):
            p = np.array(entry, float); d = np.array([r.normal(0, 0.08), 1.0]); d /= np.linalg.norm(d); pts = [p.copy()]
            L = r.uniform(0.25, 0.42) * h if kind == 'scatter' else r.uniform(0.70, 0.74) * h
            step = 0.008 * h; s = 0
            while s < L:
                if kind == 'scatter' and r.random() < 0.35:
                    a = r.normal(0, 1.1); c, sn = math.cos(a), math.sin(a); d = np.array([c * d[0] - sn * d[1], sn * d[0] + c * d[1]])
                elif kind == 'straight':
                    d = d + np.array([r.normal(0, 0.012), 0]); d /= np.linalg.norm(d)
                p = p + d * step; s += step; pts.append(p.copy())
            paths.append((np.array(pts), r.uniform(0, 1)))
        _PH[key] = paths
    return _PH[key]

def draw_photons(img, paths, t, t0, speed, col, alpha=1.0, width=2.0):
    """photon pulses running along the paths (additive glow) and faint trails"""
    h, w = img.shape[:2]
    layer = np.zeros((h, w), np.float32); trail = np.zeros((h, w), np.float32)
    for pts, ph in paths:
        L = len(pts); head = (t - t0 - ph * 0.5) * speed
        if head <= 0: continue
        hi = int(min(L - 1, head)); tail = max(0, hi - 10)
        if hi > 1:
            cv2.polylines(trail, [np.round(pts[:hi + 1] * 4).astype(np.int32)], False, 0.25, 1, cv2.LINE_AA, shift=2)
            cv2.polylines(layer, [np.round(pts[tail:hi + 1] * 4).astype(np.int32)], False, 1.0, int(width), cv2.LINE_AA, shift=2)
    g = cv2.GaussianBlur(layer, (0, 0), 3.0) * 2.2 + layer + cv2.GaussianBlur(trail, (0, 0), 1.2)
    return img + (g[..., None] * np.array(col, np.float32)) * alpha

def shot_tissue(t):
    """S6 - S10 on the MAIN tissue plates"""
    B = TL.B
    MN = plate('tissue/MAIN_MN.exr')['rgb']; h, w = MN.shape[:2]
    cx, cy, kw = interp_keys(tissue_cam(t), t) if t < B['dye0'] else interp_keys(tissue_cam2(), t)
    img = MN
    if B['beam0'] <= t < B['dye0'] or t >= B['ba0']:
        MB = plate('tissue/MAIN_MB.exr')['rgb']
        yy = np.linspace(0, 1, h, dtype=np.float32)[:, None, None]
        front = (t - (B['beam0'] if t < B['dye0'] else B['ba0'] - 1.0)) / 0.45
        on = np.clip((front * 1.1 - yy) / 0.08, 0, 1)
        img = MN + (MB - MN) * on
    if t >= B['ba0']:
        CB = plate('tissue/MAIN_CB.exr')['rgb']
        yy = np.linspace(0, 1, h, dtype=np.float32)[:, None, None]
        front = (t - B['clear0']) / 0.9
        cl = np.clip((front * 1.15 - yy) / 0.12, 0, 1)
        img = img + (CB - img) * cl
    # water and fat named: the fluid shimmers, the lipid glows (no labels)
    if B['tis0'] <= t < B['beam0']:
        M = plate('tissue/MAIN_MASK.exr')['rgb']
        lip = cv2.GaussianBlur(M[..., 0], (0, 0), 2)[..., None]
        wg = sss(B['water'] - 0.05, B['water'] + 0.15, t) * (1 - sss(B['water'] + 0.5, B['water'] + 0.9, t))
        fg = sss(B['fat'] - 0.05, B['fat'] + 0.15, t) * (1 - sss(B['fat'] + 0.6, B['fat'] + 1.0, t))
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        caus = (0.5 + 0.5 * np.sin(xx * 0.035 + np.sin(yy * 0.02 + t * 3) * 2 + t * 4)) ** 6
        tissue_px = np.clip(M.sum(-1) * 3, 0, 1)[..., None]  # not the empty space above the skin
        img = img * (1 + 0.35 * fg * lip) + (caus[..., None] * np.array([0.18, 0.35, 0.55]) * 0.25 * wg * (1 - lip) * tissue_px) * img.mean()
    # light paths
    entry = beam_entry()
    if B['beam0'] + 0.2 <= t < B['dye0']:
        img = draw_photons(img, photon_paths('scatter', entry, h, w), t, B['beam0'] + 0.2, 30, (1.0, 0.45, 0.25), 0.9)
    if t >= B['ba0'] + 0.15:
        kind = 'straight' if t >= B['clear0'] + 0.3 else 'scatter'
        t0 = B['clear0'] + 0.3 if kind == 'straight' else B['ba0'] + 0.15
        img = draw_photons(img, photon_paths(kind, entry, h, w), t, t0, 34, (1.0, 0.45, 0.25), 0.9)
    return view(img, cx * w, cy * h, kw * w / W)

def tissue_cam2():
    B = TL.B
    return [(B['ba0'], 0.50, 0.42, 0.80), (B['bacam0'], 0.50, 0.44, 0.80), (B['bacam1'], 0.50, 0.76, 0.52),
            (B['out0'], 0.50, 0.76, 0.52), (B['out1'], 0.50, 0.12, 0.98)]

_BE = {}
def beam_entry():
    if 'e' not in _BE:
        MB = plate('tissue/MAIN_MB.exr')['rgb']; MN = plate('tissue/MAIN_MN.exr')['rgb']
        d = (MB - MN * 0.1).sum(-1); h, w = d.shape
        top = d[: h // 3]; y, x = np.unravel_index(np.argmax(cv2.GaussianBlur(top, (0, 0), 6)), top.shape)
        _BE['e'] = (float(x), float(y))
    return _BE['e']

_DP = {}
def dye_particles(h, w, lipid):
    """dye molecules diffusing in from the surface through the water, never into the lipid (precomputed walk)"""
    if 'p' not in _DP:
        r = np.random.default_rng(23); n = 2600; steps = int((TL.B['dyeEnd'] - TL.B['dyeIn']) * FPS) + 2
        P = np.zeros((steps, n, 2), np.float32)
        p = np.column_stack([r.uniform(0, w, n), r.uniform(-0.12 * h, 0.02 * h, n)]).astype(np.float32)
        start = r.uniform(0, 0.5, n)
        lip = lipid > 0.5
        for s in range(steps):
            P[s] = p
            move = (s / FPS) > start
            dp = np.column_stack([r.normal(0, 7, n), r.normal(9, 7, n)]).astype(np.float32) * move[:, None]
            q = p + dp
            qi = np.clip(q.astype(int), 0, [w - 1, h - 1])
            blocked = lip[qi[:, 1], qi[:, 0]] & (q[:, 1] > 0)
            p = np.where(blocked[:, None], p + np.column_stack([r.normal(0, 5, n), np.zeros(n)]), q).astype(np.float32)
        _DP['p'] = P
    return _DP['p']

def shot_dye(t, s0, s1):
    """S8: a closer look, a new angle: dye molecules flow into the watery parts; behind them the fog lifts"""
    B = TL.B
    MN = plate('tissue/DYE_MN.exr')['rgb']; CN = plate('tissue/DYE_CN.exr')['rgb']; M = plate('tissue/DYE_MASK.exr')['rgb']
    h, w = MN.shape[:2]
    lip = M[..., 0]
    yy = np.linspace(0, 1, h, dtype=np.float32)[:, None]
    f = (t - B['dyeIn'] - 0.25) / (B['dyeEnd'] - B['dyeIn'] - 0.2)
    front = f * 1.25 - 0.1
    cl = np.clip((front - yy) / 0.25, 0, 1) * (1 - 0.25 * cv2.GaussianBlur(lip, (0, 0), 3))
    img = MN + (CN - MN) * cl[..., None]
    if t >= B['dyeIn']:
        P = dye_particles(h, w, lip); i = min(len(P) - 1, int((t - B['dyeIn']) * FPS))
        pts = P[i]; prev = P[max(0, i - 2)]
        layer = np.zeros((h, w), np.float32)
        for a, b in zip(prev, pts):
            if 0 <= b[0] < w and 0 <= b[1] < h:
                cv2.line(layer, (int(a[0] * 4), int(a[1] * 4)), (int(b[0] * 4), int(b[1] * 4)), 1.0, 2, cv2.LINE_AA, shift=2)
        g = cv2.GaussianBlur(layer, (0, 0), 2.0) * 1.5 + layer * 0.8
        img = img * (1 - 0.25 * np.clip(layer, 0, 1)[..., None]) + g[..., None] * np.array([1.0, 0.55, 0.08], np.float32) * img.mean() * 2.4
    u = (t - s0) / (s1 - s0)
    return view(img, w * (0.46 + 0.08 * u), h * (0.5 + 0.03 * u), (1 / 1.15) * w / W * (1 - 0.04 * u))

# ---------------- return and wash ----------------
def shot_wide(t, s0, s1):
    """S10 (end): back out at the animal: the cleared patch in the curved belly, organs moving"""
    img = skin_frame('WIDE', t, final=True)
    h, w = img.shape[:2]
    u = ease((t - s0) / (s1 - s0 + 0.4))
    return view(img, w / 2, h / 2 + 5 * breath(t), (0.62 + 0.25 * u) / 1.15 * w / W)

_WS = {}
def wash_masks():
    if 'm' not in _WS:
        x, y, *_ = mm_map('WASH')
        treated = treated_final('WASH')
        h, w = x.shape; yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        # the water runs in from the upper left down across the frame
        flow = (xx / w * 0.45 + yy / h * 0.75) + noise2(xx, yy, 60 * w / 1080, 3) * 0.06
        _WS['m'] = (treated.astype(np.float32), flow.astype(np.float32))
    return _WS['m']

def shot_wash(t, s0, s1):
    """S11: water washes the dye away; behind the water the skin closes over the organs again"""
    B = TL.B
    treated, flow = wash_masks()
    Cdry = skin_plate('WASH', ('C', 'K'), t); Cwet = skin_plate('WASH', ('WC', 'WK'), t)
    A = plate('plates/WASH_A.exr')['rgb'] if os.path.exists(os.path.join(CACHE, 'plates/WASH_A.exr')) else None
    Wa = plate('plates/WASH_W.exr')['rgb']
    h, w = Wa.shape[:2]
    fr = (t - B['rinse0']) / 0.9  # the water front's progress over the frame
    wet = np.clip((fr * 1.3 - flow) / 0.06, 0, 1)
    # reversal: after the water reaches a point the dye diffuses out over ~1.5 s (time-compressed)
    since = (t - B['rinse0']) - flow * 0.9 / 1.3
    rev = ss(0.25, 1.9, since)
    cleared_dry = Cdry; cleared_wet = Cwet
    clear_now = treated * (1 - rev)
    base_dry = A if A is not None else Wa
    dry = base_dry + (cleared_dry - base_dry) * treated[..., None]
    wetimg = Wa + (cleared_wet - Wa) * clear_now[..., None]
    img = dry + (wetimg - dry) * wet[..., None]
    # the moving water: a soft front, then a running film (streaking highlights along the flow, refraction) that thins out
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    run = wet * ss(2.2, 0.6, since)
    fx, fy = 0.45, 0.75; nrm = math.hypot(fx, fy); fx, fy = fx / nrm, fy / nrm
    along = xx * fx + yy * fy; across = -xx * fy + yy * fx
    sp = 900.0 * w / 1080
    st1 = noise2(across, along * 0.12 - t * sp * 0.12, 9 * w / 1080, 2)
    st2 = noise2(across * 1.7, along * 0.2 - t * sp * 0.2, 5 * w / 1080, 3)
    hl = np.clip(st1 * 0.8 + st2 * 0.5 - 0.6, 0, None) ** 1.5
    img = remap(img, (st1 * 3.0 * run).astype(np.float32), (st2 * 3.0 * run).astype(np.float32))
    front = np.exp(-((fr * 1.3 - flow) / 0.09) ** 2) * (fr < 1.3)
    sheen = (hl * run * 1.6 + front * 0.35)[..., None] * np.array([0.9, 0.95, 1.0], np.float32) * float(img.mean())
    img = img + sheen
    for td, x0 in ((22.02, 0.36), (22.47, 0.62), (23.07, 0.48)):  # beads running down off the skin (the mix's drips)
        if td - 0.15 <= t < td + 0.45:
            f = ease((t - td + 0.15) / 0.6)
            img = bead(img, (x0 * w + 20 * f, (0.30 + 0.45 * f) * h), 0.012 * w)
    u = (t - s0) / (s1 - s0)
    return view(img, w * (0.5 - 0.03 * u), h * (0.5 + 0.02 * u), (1 / 1.12) * w / W * (1 - 0.04 * u))

def bead(img, c, r):
    """a water bead: the skin under it magnified and flipped a little, a bright highlight, a dark rim"""
    h, w = img.shape[:2]; x0, y0 = int(c[0] - 2 * r), int(c[1] - 2 * r); x1, y1 = int(c[0] + 2 * r), int(c[1] + 2 * r)
    if x0 < 0 or y0 < 0 or x1 >= w or y1 >= h: return img
    yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    dx, dy = xx - c[0], yy - c[1]; rr = np.sqrt(dx ** 2 + dy ** 2) / r
    inside = np.clip((1.0 - rr) / 0.12, 0, 1)
    sx = c[0] - dx * 0.6; sy = c[1] - dy * 0.6
    lens = cv2.remap(img, sx, sy, cv2.INTER_LINEAR)
    patch = img[y0:y1, x0:x1]
    hl = np.exp(-((dx + 0.35 * r) ** 2 + (dy + 0.4 * r) ** 2) / (0.06 * r * r))
    rim = np.exp(-((rr - 0.95) / 0.08) ** 2) * 0.35
    new = patch * (1 - inside[..., None]) + (lens * (1 - rim[..., None]) + hl[..., None] * patch.mean() * 6) * inside[..., None]
    out = img.copy(); out[y0:y1, x0:x1] = new; return out

# ---------------- the film ----------------
SHOT_EXPOSURE = {'hook': -2.0, 'side': -2.0, 'graze': -2.0, 'lab': -1.0, 'apply': -2.0, 'tissue': -3.0, 'dye': -3.5, 'wide': -2.0, 'wash': -2.0}

def shot_at(name, t):
    B = TL.B; s0, s1 = TL.SHOTS[name]
    if name == 'hook': return shot_hook(t, t)
    if name == 'loop': return shot_hook(t, t - DUR)
    if name == 'side': return shot_side(t, s0, s1)
    if name == 'graze': return shot_graze(t, s0, s1)
    if name == 'lab': return shot_lab(t, s0, s1)
    if name == 'apply': return shot_apply(t, s0, s1)
    if name in ('tissue', 'tissue2'): return shot_tissue(t)
    if name == 'dye': return shot_dye(t, s0, s1)
    if name == 'wide': return shot_wide(t, s0, s1)
    if name == 'wash': return shot_wash(t, s0, s1)
    raise KeyError(name)

def expo(name): return SHOT_EXPOSURE.get(name.rstrip('2').replace('loop', 'hook'), -2.0)

def grade(lin, name, t):
    x = tonemap(lin, expo(name))
    return x

def frame(fi):
    t = fi / FPS
    layers = TL.layers_at(t)  # [(shot, weight)]
    out = None
    for name, wgt in layers:
        img = grade(shot_at(name, t), name, t)
        out = img * wgt if out is None else out + img * wgt
    # lens: gentle vignette, fine grain (fixed seed per frame)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    vig = 1 - 0.10 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 1.6)) ** 2)
    out = out * vig[..., None]
    g = np.random.default_rng(1000 + fi).normal(0, 0.012, (H // 2, W // 2)).astype(np.float32)
    out = out + cv2.resize(g, (W, H))[..., None]
    return np.clip(out, 0, 1)

def main():
    out = sys.argv[2]; a = int(sys.argv[3]) if len(sys.argv) > 3 else 0; b = int(sys.argv[4]) if len(sys.argv) > 4 else N
    workers = int(sys.argv[5]) if len(sys.argv) > 5 else 1
    os.makedirs(out, exist_ok=True)
    todo = [f for f in range(a, b)]
    if workers > 1:
        from multiprocessing import Pool
        with Pool(workers) as pool:
            for _ in pool.imap_unordered(_one, [(out, f) for f in todo], chunksize=4): pass
    else:
        for f in todo: _one((out, f))

def _one(arg):
    out, f = arg
    img = frame(f)
    cv2.imwrite(os.path.join(out, f'f{f:04d}.jpg'), (img[..., ::-1] * 255 + 0.5).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 97])

if __name__ == '__main__':
    main()
