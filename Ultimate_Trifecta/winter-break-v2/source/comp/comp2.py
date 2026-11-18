#!/usr/bin/env python3
"""Ultimate Trifecta - Winter Break V2 (33 s): compositor (from the V1 compositor).

Cuts the in-engine shots to the EDL at 30 fps, blending each pair of 60 fps
render frames (a 180-degree shutter's motion blur), grades every frame
(filmic tone curve, cool night shadows and warm highlights, two-scale bloom,
vignette, fine grain), adds the one transition the edit asks for (the splash
fills the frame and the camera goes under, 0:20.0-0:20.9) and the end card
(the official title, Season 1 · Winter Break, hard cut on 0:36.0).

    python3 comp.py --edl EDL --shots DIR --out OUT.mp4 [--audio MIX.wav] [--fps-in 60] [--scale 1.0] [--from T --to T]
"""
import argparse, json, math, os, subprocess, sys
import numpy as np
import cv2

W, H, FPS = 1920, 1080, 30
HERE = os.path.dirname(os.path.abspath(__file__))

# per-shot grade trims: exposure (stops), warmth (+ warmer), saturation
TRIM = {
    "v2_a1_lobby": (-0.16, 0.10, 1.04), "v2_e1_door": (-0.12, 0.08, 1.04), "v2_e2_listen": (-0.12, 0.08, 1.04), "v2_e3_snow": (-0.14, 0.08, 1.03),
    "v2_a2_rim_foot": (0.0, -0.04, 1.0), "v2_a3_toe_test": (0.0, -0.04, 1.0), "v2_b1_lights": (-0.05, -0.03, 1.0), "v2_b2_wheels": (-0.08, -0.03, 1.0),
    "v2_c1_round": (0.0, -0.04, 1.0), "v2_c2_alongside": (-0.03, -0.03, 1.02), "v2_c3_prints": (-0.12, -0.04, 1.0), "v2_d1_dive": (0.0, -0.04, 1.0),
    "v2_d2_bush": (0.0, -0.05, 1.0),
    "s01_dorm_out": (-0.18, 0.10, 1.04), "s15_dorm_home": (-0.18, 0.10, 1.04), "s14_door_catch": (-0.08, 0.05, 1.04),
    "s02_rim_foot": (0.0, -0.04, 1.0), "s03_rim_test": (0.0, -0.04, 1.0), "s04_freeze": (-0.2, -0.02, 1.0),
    "s05_cart": (-0.15, -0.03, 1.0), "s06_nod": (-0.05, -0.02, 1.0), "s07_wide": (0.0, -0.04, 1.0),
    "s08_leap": (0.0, -0.03, 1.02), "s11_surface": (0.0, -0.05, 1.0), "s12_follow": (0.0, -0.04, 1.0),
    "s13_officer": (-0.04, -0.03, 1.0),
}


def grade(img, sid, t, rng):
    """img: float32 BGR 0..1 (display-referred, as the engine renders it).
    A light-touch cinematic grade: the engine's exposure is kept."""
    ev, warm, sat = TRIM.get(sid, (0.0, 0.0, 1.0))
    x = img * (2.0 ** ev)
    # bloom: only the bright parts (lamps, bulbs, headlights, windows), two radii
    lum = x.max(axis=2, keepdims=True)
    hi = np.clip((x - 0.82) * 2.2, 0, None) * (lum > 0.82)
    small = cv2.resize(hi, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    b1 = cv2.resize(cv2.GaussianBlur(small, (0, 0), 5), (W, H), interpolation=cv2.INTER_LINEAR)
    b2 = cv2.resize(cv2.GaussianBlur(cv2.resize(small, (W // 16, H // 16), interpolation=cv2.INTER_AREA), (0, 0), 4), (W, H), interpolation=cv2.INTER_LINEAR)
    x = x + b1 * 0.10 + b2 * 0.08
    # split tone: a touch cooler in the shadows, warmer in the highlights
    l = (0.114 * x[..., 0] + 0.587 * x[..., 1] + 0.299 * x[..., 2])[..., None]
    sh = np.clip(1.0 - l * 2.5, 0, 1)
    hl = np.clip((l - 0.55) * 2.0, 0, 1)
    x = x + sh * np.array([0.012, 0.004, -0.006], np.float32) + hl * np.array([-0.012, 0.0, 0.014 + warm * 0.06], np.float32)
    if warm:
        x = x * np.array([1.0 - warm * 0.08, 1.0, 1.0 + warm * 0.04], np.float32)
    # saturation
    l = (0.114 * x[..., 0] + 0.587 * x[..., 1] + 0.299 * x[..., 2])[..., None]
    x = l + (x - l) * (1.05 * sat)
    # contrast: a mild S about mid-grey, a soft shoulder for the highlights
    x = 0.5 + (x - 0.5) * 1.07
    over = np.clip(x - 0.86, 0, None)
    x = np.minimum(x, 0.86) + over / (1.0 + over * 4.0)
    x = 0.012 + np.clip(x, 0, 1) * 0.985
    # vignette
    x = x * VIGN
    # grain
    g = rng.standard_normal((H // 2, W // 2)).astype(np.float32)
    g = cv2.resize(g, (W, H), interpolation=cv2.INTER_LINEAR)[..., None]
    x = x + g * 0.009
    return np.clip(x, 0, 1)


yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
rr = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 * 0.85 + ((yy - H / 2) / (H / 2)) ** 2 * 0.85)
VIGN = (1.0 - 0.26 * np.clip(rr - 0.4, 0, None) ** 1.7)[..., None].astype(np.float32)


# ------------------------------------------------------------------ water
def water_layer(u, t, rng_seed=7):
    """the underwater frame: deep blue-teal, caustic light from above,
    bubbles rising.  u = 0..1 coverage (used by the caller)."""
    g = np.linspace(0, 1, H, dtype=np.float32)[:, None]
    base = np.zeros((H, W, 3), np.float32)
    base[..., 0] = 0.30 - 0.18 * g     # B
    base[..., 1] = 0.20 - 0.12 * g     # G
    base[..., 2] = 0.05 - 0.03 * g     # R
    # caustics: two drifting sine lattices
    c = (np.sin(xx * 0.009 + t * 2.1 + np.sin(yy * 0.007 + t * 1.3) * 2.4) * np.sin(yy * 0.011 - t * 1.6 + np.sin(xx * 0.006) * 2.4))
    c = np.clip(c, 0, 1) ** 2 * (1.0 - g) * 0.22
    c = cv2.GaussianBlur(c.astype(np.float32), (0, 0), 9)
    base += c[..., None] * np.array([0.9, 0.85, 0.55], np.float32)
    # bubbles
    rng = np.random.default_rng(rng_seed)
    for i in range(70):
        bx = rng.uniform(0, W); by0 = rng.uniform(H * 0.2, H * 1.6); r = rng.uniform(4, 22); sp = rng.uniform(500, 1300)
        by = by0 - sp * t
        cx = int(bx + math.sin(t * 6 + i) * 10); cy = int(by)
        if -40 < cy < H + 40:
            cv2.circle(base, (cx, cy), int(r), (0.75, 0.8, 0.7), max(1, int(r * 0.18)), cv2.LINE_AA)
            cv2.circle(base, (int(cx - r * 0.35), int(cy - r * 0.35)), max(1, int(r * 0.22)), (0.95, 0.95, 0.9), -1, cv2.LINE_AA)
    return base


def water_mix(frame, sid, lt, dur):
    """0:20.0-0:20.6 at the end of s08 (the splash closes over the lens),
    0:20.6-0:20.9 at the start of s11 (surfacing: the water drains off)."""
    if sid == "s08_leap":
        t = lt - (dur - 0.6)          # 0..0.6
        if t <= 0:
            return frame
        u = min(1.0, t / 0.22) ** 1.5
        wl = water_layer(u, t)
        blur = cv2.GaussianBlur(frame, (0, 0), 6 + 20 * u)
        # a ragged rising waterline
        line = H * (1.05 - 1.35 * u) + 30 * np.sin(xx[0] * 0.012 + t * 20) + 18 * np.sin(xx[0] * 0.031 - t * 13)
        m = np.clip((yy - line[None, :]) / 40.0 + 0.5, 0, 1)[..., None]
        m = np.maximum(m, u ** 3)
        return blur * (1 - m) + wl * m
    if sid == "s11_surface":
        if lt >= 0.32:
            return frame
        u = 1.0 - lt / 0.32                  # 1 -> 0
        wl = water_layer(u, 0.6 + lt)
        line = H * (-0.2 + 1.3 * (1 - u)) + 26 * np.sin(xx[0] * 0.015 + lt * 18)
        m = np.clip((line[None, :] - yy) / 50.0 + 0.5, 0, 1)[..., None]
        m = 1.0 - m                          # water below the falling line... drains downward
        m = np.clip(m * u * 1.2, 0, 1)
        # droplets on the lens as it drains
        out = frame * (1 - m) + wl * m
        return out
    return frame


# ------------------------------------------------------------------ card
def card(t, rng):
    """the end card at t seconds after the cut (hard cut, already full size)."""
    fg = CARD_FG
    # background: the game's night navy with a soft central glow
    bg = CARD_BG.copy()
    # very slow drift of the whole card (1.2 % over 4 s), no pop
    s = 1.0 + 0.012 * min(t / 4.0, 1.0)
    M = cv2.getRotationMatrix2D((W / 2, H / 2 - 20), 0, s)
    layer = cv2.warpAffine(fg, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    a = layer[..., 3:4]
    rgb = layer[..., :3]
    # sheen: a soft diagonal band crossing the title, 0.35-1.35 s
    st = (t - 0.35) / 1.0
    if 0 < st < 1:
        band = np.exp(-((xx - (st * 1.6 - 0.3) * W - (yy - H / 2) * 0.5) / 70.0) ** 2)[..., None]
        rgb = rgb + band * 0.35 * (rgb.max(axis=2, keepdims=True) > 0.15)
    out = bg * (1 - a) + rgb * a
    # a hit of light on the first frames (the musical accent), decaying
    flash = math.exp(-t * 12.0) * 0.06
    out = out + flash
    # faint snow drifting behind
    out = out + SNOW(t)
    # fade out over the last 0.35 s
    # held cleanly to the end (no fade)
    g = cv2.resize(rng.standard_normal((H // 2, W // 2)).astype(np.float32), (W, H))[..., None]
    return np.clip(out + g * 0.008, 0, 1)


def make_card_assets():
    global CARD_FG, CARD_BG
    fg = cv2.imread(os.path.join(HERE, "card_fg.png"), cv2.IMREAD_UNCHANGED).astype(np.float32) / 255.0
    a = fg[..., 3:4]
    rgb = np.where(a > 0, fg[..., :3], 0)
    CARD_FG = np.concatenate([rgb, a], axis=2)
    NIGHT = np.array([22, 11, 7], np.float32) / 255.0
    NAVY = np.array([40, 22, 12], np.float32) / 255.0
    e = np.exp(-(((xx - W / 2) / (W * 0.36)) ** 2 + ((yy - H * 0.46) / (H * 0.42)) ** 2))[..., None]
    CARD_BG = NIGHT * (1 - e) + NAVY * e


_snow = None


def SNOW(t):
    global _snow
    if _snow is None:
        rng = np.random.default_rng(11)
        _snow = [(rng.uniform(0, W), rng.uniform(-H, H), rng.uniform(1.0, 3.2), rng.uniform(25, 70), rng.uniform(0, 6.28)) for _ in range(140)]
    layer = np.zeros((H, W, 3), np.float32)
    for (x0, y0, r, sp, ph) in _snow:
        y = (y0 + sp * t) % (H * 1.1) - H * 0.05
        x = x0 + 14 * math.sin(t * 0.8 + ph)
        cv2.circle(layer, (int(x), int(y)), int(r), (0.10, 0.10, 0.10), -1, cv2.LINE_AA)
    return cv2.GaussianBlur(layer, (0, 0), 1.2)


# ------------------------------------------------------------------ main
class Clip:
    def __init__(self, path, fps_in):
        self.cap = cv2.VideoCapture(path)
        self.fps_in = round(self.cap.get(cv2.CAP_PROP_FPS)) or fps_in
        self.n = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
        self.idx = -1
        self.last = None
        self.cache = {}

    def frame(self, k):
        k = max(0, min(self.n - 1, k))
        while self.idx < k:
            ok, f = self.cap.read()
            if not ok:
                break
            self.idx += 1
            self.last = f
            self.cache[self.idx] = f
            self.cache.pop(self.idx - 4, None)
        return self.cache.get(k, self.last)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--edl", required=True)
    ap.add_argument("--shots", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--audio")
    ap.add_argument("--fps-in", type=int, default=60)
    ap.add_argument("--from", dest="t_from", type=float, default=0.0)
    ap.add_argument("--to", dest="t_to", type=float, default=33.0)
    ap.add_argument("--crf", type=int, default=14)
    a = ap.parse_args()
    edl = json.load(open(a.edl))
    clips = edl["clips"]
    logo_t = edl.get("logo", 36.0)
    make_card_assets()
    rng = np.random.default_rng(3)
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-"]
    if a.audio:
        cmd += ["-ss", f"{a.t_from:.4f}", "-t", f"{a.t_to - a.t_from:.4f}", "-i", a.audio, "-c:a", "aac", "-b:a", "320k", "-ar", "48000"]
    cmd += ["-c:v", "libx264", "-preset", "slow", "-crf", str(a.crf), "-pix_fmt", "yuv420p", "-profile:v", "high",
            "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-movflags", "+faststart"]
    if a.audio:
        cmd += ["-shortest"]
    cmd += [a.out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    opened = {}
    n0, n1 = int(round(a.t_from * FPS)), int(round(a.t_to * FPS))
    for n in range(n0, n1):
        t = n / FPS
        if t >= logo_t - 1e-6:
            img = card(t - logo_t, rng)
        else:
            sid, st, dur = None, 0, 0
            for c in clips:
                if c[1] - 1e-6 <= t < c[1] + c[2] - 1e-6:
                    sid, st, dur = c[0], c[1], c[2]
            path = os.path.join(a.shots, sid + ".mp4")
            if sid not in opened:
                opened = {sid: Clip(path, a.fps_in)}
            cl = opened[sid]
            lt = t - st
            if cl.fps_in >= 59:
                k = int(round(lt * 60))
                f0 = cl.frame(k).astype(np.float32)
                f1 = cl.frame(k + 1).astype(np.float32)
                f = (f0 + f1) * 0.5
            else:
                f = cl.frame(int(round(lt * cl.fps_in))).astype(np.float32)
            if f.shape[1] != W:
                f = cv2.resize(f, (W, H), interpolation=cv2.INTER_CUBIC)
            img = f / 255.0
            img = grade(img, sid, lt, rng)
        p.stdin.write((img * 255.0 + 0.5).clip(0, 255).astype(np.uint8).tobytes())
        if n % 60 == 0:
            print(f"  {t:5.2f}s", flush=True)
    p.stdin.close()
    p.wait()
    print("wrote", a.out)


if __name__ == "__main__":
    main()
